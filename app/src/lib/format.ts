import type { Cycle, Subscription } from './types';

export function formatCurrency(amount: number, currency = 'DKK'): string {
  try {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    // Unknown currency code — show the code rather than crashing the screen.
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function daysUntil(iso: string | null | undefined): number {
  if (!iso) return 0;
  return Math.ceil(
    (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

const CYCLE_SUFFIX: Record<Cycle, string> = {
  weekly: '/wk',
  monthly: '/mo',
  quarterly: '/qtr',
  yearly: '/yr',
};

export function formatCycle(cycle: Cycle | string | null): string {
  return CYCLE_SUFFIX[cycle as Cycle] ?? '';
}

/** What one billing period costs per month, for comparing across cycles. */
export function monthlyEquivalent(price: number, cycle: Cycle | string): number {
  switch (cycle) {
    case 'weekly':
      return (price * 52) / 12;
    case 'quarterly':
      return price / 3;
    case 'yearly':
      return price / 12;
    default:
      return price;
  }
}

/**
 * Monthly spend per currency.
 *
 * Amounts in different currencies are deliberately NOT added together — we
 * have no exchange rates, and summing 9 USD into a DKK total would quietly
 * understate what the user is spending.
 */
export function monthlyTotals(subs: Subscription[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const sub of subs) {
    if (sub.status === 'cancelled') continue;
    const currency = sub.currency || 'DKK';
    totals[currency] =
      (totals[currency] ?? 0) + monthlyEquivalent(sub.price, sub.cycle);
  }
  return totals;
}

/** The currency the user spends most in — the one worth showing largest. */
export function primaryCurrency(totals: Record<string, number>): string | null {
  const entries = Object.entries(totals);
  if (!entries.length) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * How a renewal reads in a list: near dates in plain words, distant ones as a
 * date. "in 3 days" is easier to act on than "17. mar. 2026".
 */
export function formatRelativeDay(iso: string | null | undefined): string {
  if (!iso) return '—';
  const days = daysUntil(iso);
  if (days < 0) return formatDate(iso);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `in ${days} days`;
  if (days < 14) return 'next week';
  return new Date(iso).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Live trials that convert to paid within `windowDays` — the list Home turns
 * into a "you'll be charged in N days" warning. Soonest first.
 */
export function trialsEndingSoon(
  subs: Subscription[],
  windowDays = 2,
): { sub: Subscription; daysLeft: number }[] {
  return subs
    .filter((s) => s.status === 'trial' && s.trialEndsAt)
    .map((sub) => ({ sub, daysLeft: daysUntil(sub.trialEndsAt) }))
    .filter((e) => e.daysLeft >= 0 && e.daysLeft <= windowDays)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}
