const MONTHS: Record<string, number> = {
  // English
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
  sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10,
  dec: 11, december: 11,
  // Danish (those that differ)
  maj: 4, okt: 9, oktober: 9, marts: 2, januar: 0, februar: 1, juni: 5,
  juli: 6,
};

const MONTH_NAMES = Object.keys(MONTHS)
  .sort((a, b) => b.length - a.length)
  .join('|');

/** `January 5, 2026` / `Jan 5 2026` */
const MONTH_FIRST = new RegExp(
  String.raw`\b(${MONTH_NAMES})\.?\s+(\d{1,2})(?:st|nd|rd|th)?\.?,?\s+(\d{4})\b`,
  'i',
);
/** `5 January 2026` / `5. januar 2026` */
const DAY_FIRST = new RegExp(
  String.raw`\b(\d{1,2})\.?\s+(${MONTH_NAMES})\.?,?\s+(\d{4})\b`,
  'i',
);
/** `2026-01-05` */
const ISO = /\b(\d{4})-(\d{2})-(\d{2})\b/;
/** `05/01/2026` or `05.01.2026` — day-first unless that is impossible. */
const NUMERIC = /\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/;

function utc(year: number, month: number, day: number): Date | null {
  const d = new Date(Date.UTC(year, month, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month ||
    d.getUTCDate() !== day
  ) {
    return null; // e.g. 31 February
  }
  return d;
}

/** First absolute date in the text, or null. */
export function parseDate(text: string): Date | null {
  const monthFirst = text.match(MONTH_FIRST);
  if (monthFirst) {
    const month = MONTHS[monthFirst[1].toLowerCase()];
    const d = utc(Number(monthFirst[3]), month, Number(monthFirst[2]));
    if (d) return d;
  }

  const dayFirst = text.match(DAY_FIRST);
  if (dayFirst) {
    const month = MONTHS[dayFirst[2].toLowerCase()];
    const d = utc(Number(dayFirst[3]), month, Number(dayFirst[1]));
    if (d) return d;
  }

  const iso = text.match(ISO);
  if (iso) {
    const d = utc(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    if (d) return d;
  }

  const numeric = text.match(NUMERIC);
  if (numeric) {
    const first = Number(numeric[1]);
    const second = Number(numeric[2]);
    const year = Number(numeric[3]);
    // Danish/EU convention is day-first; only flip when the first field cannot
    // be a day-of-month pairing (e.g. 12/25/2026).
    const dayFirstReading = second <= 12;
    const d = dayFirstReading
      ? utc(year, second - 1, first)
      : utc(year, first - 1, second);
    if (d) return d;
  }

  return null;
}

/** How far ahead a date may sit and still be a plausible renewal. */
const MAX_HORIZON_DAYS = 800;

function withinHorizon(date: Date, anchor: Date): boolean {
  const days = (date.getTime() - anchor.getTime()) / 86_400_000;
  return days > -400 && days < MAX_HORIZON_DAYS;
}

/**
 * Find a date that follows one of `labels`. Scans a window after each label
 * so `Next billing date: 5 January 2026` resolves, while an unrelated date
 * elsewhere in the footer does not.
 */
export function findLabelledDate(
  text: string,
  labels: string[],
  anchor: Date,
  windowSize = 120,
): Date | null {
  const lower = text.toLowerCase();
  for (const label of labels) {
    let from = 0;
    for (;;) {
      const at = lower.indexOf(label, from);
      if (at === -1) break;
      const window = text.slice(at + label.length, at + label.length + windowSize);
      const date = parseDate(window);
      if (date && withinHorizon(date, anchor)) return date;
      from = at + label.length;
    }
  }
  return null;
}

const RELATIVE_DAYS =
  /\b(\d{1,3})[-\s](?:day|days|dage|dags)\b|\b(?:in|within|om)\s+(\d{1,3})\s+(?:day|days|dage)\b/i;

/**
 * Resolve phrases like `7-day free trial` or `om 14 dage` against the date the
 * email arrived.
 */
export function findRelativeDate(text: string, anchor: Date): Date | null {
  const m = text.match(RELATIVE_DAYS);
  if (!m) return null;
  const days = Number(m[1] ?? m[2]);
  if (!Number.isFinite(days) || days <= 0 || days > 365) return null;
  const d = new Date(anchor.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export const RENEWAL_LABELS = [
  'next billing date', 'next billing', 'next payment date', 'next payment',
  'next charge', 'next invoice', 'renews on', 'will renew on', 'renewal date',
  'automatically renew on', 'auto-renews on', 'renews automatically on',
  'subscription renews', 'næste betaling', 'næste opkrævning',
  'fornyes den', 'fornyes automatisk den', 'næste fornyelse', 'betalingsdato',
];

export const TRIAL_LABELS = [
  'trial ends on', 'trial ends', 'trial will end on', 'trial period ends',
  'free trial ends', 'free until', 'trial expires on', 'trial expires',
  'prøveperiode slutter', 'prøveperioden slutter', 'gratis indtil',
  'prøveperioden udløber',
];
