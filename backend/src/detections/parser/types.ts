export type Cycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export const CYCLES: Cycle[] = ['weekly', 'monthly', 'quarterly', 'yearly'];

/** The raw email handed to the parser. */
export interface ParsableEmail {
  from: string;
  subject: string;
  snippet: string;
  body: string;
  /** When the email was received — anchors relative date maths. */
  receivedAt: Date;
}

/** What the parser managed to pull out of one email. */
export interface ParsedSubscription {
  /** False when the email does not look like subscription billing at all. */
  isSubscription: boolean;
  /** 0..1 — how much we trust the extraction. */
  confidence: number;
  service: string | null;
  category: string | null;
  price: number | null;
  currency: string | null;
  cycle: Cycle | null;
  /** Next charge date, either stated in the email or derived from it. */
  renewalAt: Date | null;
  trialEndsAt: Date | null;
  /** Human-readable trace of what matched — useful when tuning the rules. */
  reasons: string[];
}

/** Advance `from` by one billing period. */
export function addCycle(from: Date, cycle: Cycle): Date {
  const d = new Date(from.getTime());
  switch (cycle) {
    case 'weekly':
      d.setUTCDate(d.getUTCDate() + 7);
      return d;
    case 'quarterly':
      return addMonths(d, 3);
    case 'yearly':
      return addMonths(d, 12);
    case 'monthly':
    default:
      return addMonths(d, 1);
  }
}

/**
 * Month arithmetic that clamps instead of overflowing: 31 Jan + 1 month is
 * 28/29 Feb, not 2/3 Mar the way setUTCMonth alone would give.
 */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

/** Roll a past renewal date forward until it is in the future. */
export function nextFutureRenewal(
  anchor: Date,
  cycle: Cycle,
  now: Date = new Date(),
): Date {
  let next = new Date(anchor.getTime());
  let guard = 0;
  while (next.getTime() <= now.getTime() && guard < 600) {
    next = addCycle(next, cycle);
    guard++;
  }
  return next;
}
