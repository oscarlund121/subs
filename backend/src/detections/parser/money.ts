export interface MoneyMatch {
  amount: number;
  currency: string;
  /** Character offset in the source text — used to score candidates. */
  index: number;
}

/** Symbol / code spellings mapped to ISO 4217. */
const CURRENCY_TOKENS: Record<string, string> = {
  $: 'USD',
  us$: 'USD',
  usd: 'USD',
  '€': 'EUR',
  eur: 'EUR',
  '£': 'GBP',
  gbp: 'GBP',
  kr: 'DKK',
  'kr.': 'DKK',
  dkk: 'DKK',
  sek: 'SEK',
  nok: 'NOK',
  chf: 'CHF',
  pln: 'PLN',
};

/**
 * `kr` alone is ambiguous across DKK/SEK/NOK. Danish mail is the common case
 * here, so bare `kr` resolves to DKK unless the text names another krone.
 */
function resolveKrone(text: string): string {
  const lower = text.toLowerCase();
  if (/\bsek\b|\bswedish\b|\bsvenska\b/.test(lower)) return 'SEK';
  if (/\bnok\b|\bnorwegian\b|\bnorske\b/.test(lower)) return 'NOK';
  return 'DKK';
}

/**
 * Turn a written number into a float, working out whether `.` or `,` is the
 * decimal separator. `1.234,56` is European, `1,234.56` is US, and a lone
 * separator with exactly two trailing digits is decimal either way.
 */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/\s| /g, '');
  if (!/[\d]/.test(cleaned)) return null;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  let normalised: string;
  if (lastComma !== -1 && lastDot !== -1) {
    // Both present — whichever comes last is the decimal separator.
    normalised =
      lastComma > lastDot
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '');
  } else if (lastComma !== -1) {
    const decimals = cleaned.length - lastComma - 1;
    // `1,234` is a thousands group; `12,34` is a decimal.
    normalised =
      decimals === 3 && /^\d{1,3},\d{3}$/.test(cleaned)
        ? cleaned.replace(/,/g, '')
        : cleaned.replace(',', '.');
  } else if (lastDot !== -1) {
    const decimals = cleaned.length - lastDot - 1;
    normalised =
      decimals === 3 && /^\d{1,3}\.\d{3}$/.test(cleaned)
        ? cleaned.replace(/\./g, '')
        : cleaned;
  } else {
    normalised = cleaned;
  }

  const value = Number.parseFloat(normalised);
  return Number.isFinite(value) ? value : null;
}

const NUMBER = String.raw`\d{1,3}(?:[.,\s ]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?`;
const SYMBOL_BEFORE = new RegExp(
  String.raw`(US\$|\$|€|£|DKK|SEK|NOK|EUR|USD|GBP|CHF|PLN|kr\.?)\s*(${NUMBER})`,
  'gi',
);
const SYMBOL_AFTER = new RegExp(
  String.raw`(${NUMBER})\s*(US\$|\$|€|£|DKK|SEK|NOK|EUR|USD|GBP|CHF|PLN|kr\.?)`,
  'gi',
);

/** Every monetary amount in the text, in the order they appear. */
export function findAmounts(text: string): MoneyMatch[] {
  const found: MoneyMatch[] = [];
  const seen = new Set<number>();

  const push = (rawAmount: string, rawCurrency: string, index: number) => {
    if (seen.has(index)) return;
    const amount = parseAmount(rawAmount);
    if (amount === null || amount <= 0) return;

    const token = rawCurrency.toLowerCase().trim();
    let currency = CURRENCY_TOKENS[token];
    if (!currency) return;
    if (currency === 'DKK' && /^kr\.?$/.test(token)) currency = resolveKrone(text);

    seen.add(index);
    found.push({ amount, currency, index });
  };

  for (const m of text.matchAll(SYMBOL_BEFORE)) {
    push(m[2], m[1], m.index ?? 0);
  }
  for (const m of text.matchAll(SYMBOL_AFTER)) {
    push(m[1], m[2], m.index ?? 0);
  }

  return found.sort((a, b) => a.index - b.index);
}

/** Words that sit next to the amount actually being charged. */
const TOTAL_HINTS = [
  'total', 'amount charged', 'amount due', 'amount', 'charged', 'you paid',
  'payment of', 'grand total', 'order total', 'subtotal', 'beløb', 'i alt',
  'samlet', 'betalt', 'pris', 'at betale', 'sum',
];

/**
 * Pick the amount most likely to be the recurring charge. Amounts sitting
 * right after a total-ish label win; otherwise take the first one, which in a
 * receipt is nearly always the headline price rather than an upsell.
 */
export function pickChargeAmount(text: string): MoneyMatch | null {
  const amounts = findAmounts(text);
  if (!amounts.length) return null;

  const lower = text.toLowerCase();
  let best = amounts[0];
  let bestScore = -1;

  for (const candidate of amounts) {
    let score = 0;
    // Look back a short window for a total-ish label.
    const windowStart = Math.max(0, candidate.index - 40);
    const before = lower.slice(windowStart, candidate.index);
    for (const hint of TOTAL_HINTS) {
      if (before.includes(hint)) {
        score += hint === 'subtotal' ? 2 : 5;
        break;
      }
    }
    // Earlier amounts are more likely to be the headline figure.
    score += Math.max(0, 3 - Math.floor(candidate.index / 400));

    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}
