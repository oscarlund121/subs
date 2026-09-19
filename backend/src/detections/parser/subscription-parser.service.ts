import { Injectable } from '@nestjs/common';
import {
  brandFromDomain,
  extractDisplayName,
  extractDomain,
  matchMerchant,
  refineServiceName,
} from './merchants.js';
import { pickChargeAmount } from './money.js';
import {
  RENEWAL_LABELS,
  TRIAL_LABELS,
  findLabelledDate,
  findRelativeDate,
} from './dates.js';
import { htmlToText } from './html.js';
import {
  addCycle,
  nextFutureRenewal,
  type Cycle,
  type ParsableEmail,
  type ParsedSubscription,
} from './types.js';

/** Order matters: `every 3 months` must not be read as monthly. */
const CYCLE_PATTERNS: [Cycle, RegExp][] = [
  [
    'quarterly',
    /\b(quarterly|every\s+(?:3|three)\s+months?|per\s+quarter|kvartalsvis|hvert\s+kvartal|pr\.?\s*kvartal)\b/i,
  ],
  [
    'yearly',
    /\b(yearly|annually|annual|per\s+annum|per\s+year|a\s+year|each\s+year|every\s+(?:12\s+months?|year)|\/\s?(?:yr|year)|12[-\s]month|årlig[et]?|pr\.?\s*år|om\s+året|hvert\s+år)\b/i,
  ],
  [
    'weekly',
    /\b(weekly|per\s+week|a\s+week|each\s+week|every\s+week|\/\s?(?:wk|week)|ugentlig[t]?|pr\.?\s*uge|om\s+ugen)\b/i,
  ],
  [
    'monthly',
    /\b(monthly|per\s+month|a\s+month|each\s+month|every\s+month|\/\s?(?:mo|month)|hver\s+måned|månedlig[t]?|pr\.?\s*måned|om\s+måneden)\b/i,
  ],
];

/** Subject/body wording that marks an email as subscription billing. */
const BILLING_KEYWORDS =
  /\b(receipt|invoice|subscription|subscribed|renewal|renews?|renewing|auto-?renew|membership|billing|billed|payment\s+(?:received|confirmation|successful)|your\s+plan|kvittering|faktura|abonnement|fornyelse|fornyes|medlemskab|betaling(?:en)?\s+(?:er\s+)?(?:modtaget|gennemført)|opkrævning|regning)\b/i;

const TRIAL_KEYWORDS =
  /\b(free\s+trial|trial\s+period|trial\s+ends|start(?:ed)?\s+your\s+trial|prøveperiode|gratis\s+prøve|prøveabonnement)\b/i;

/**
 * Transactional mail that mentions money but is not a recurring charge.
 * Checked against the subject, where these are reliably signalled.
 */
const NOT_BILLING =
  /\b(password|reset\s+your|verify\s+your|verification\s+code|security\s+alert|sign[- ]?in|new\s+device|has\s+shipped|out\s+for\s+delivery|tracking\s+number|delivery|refund(?:ed)?|nulstil|bekræft\s+din|adgangskode|leveret|forsendelse|pakken)\b/i;

/**
 * Promotional / referral / contest mail. Like `NOT_BILLING` it is checked on
 * the subject only — "refer a friend" links and "X months free" banners sit in
 * the footer of *every* legitimate receipt, so matching the body here would
 * bury real subscriptions.
 */
const MARKETING =
  /\b(share|refer|referral|refer\s+a\s+friend|invite|invitation|giveaway|give\s+away|contest|sweepstakes|win\s+a|exclusive\s+offer|promo|discount|last\s+chance|final\s+chance|bonus|credits?\s+expire|expires?\s+(?:soon|tomorrow)|del\s+med|del\s+en|inviter|henvis|anbefal|gavekort|konkurrence|pr[æe]mie|sidste\s+chance|udl[øo]ber\s+(?:snart|i\s+morgen)|months?\s+free|free\s+months?|m[åa]neder[s]?\s+gratis|gratis\s+m[åa]neder)\b/i;

const CONFIDENCE_THRESHOLD = 0.5;

@Injectable()
export class SubscriptionParserService {
  /**
   * Extract subscription details from one email.
   *
   * Everything is rule-based and deliberately conservative: it would rather
   * return `isSubscription: false` than fill the user's inbox with noise. The
   * `confidence` score is what the UI uses to decide between "add this" and
   * "does this look right?".
   */
  parse(email: ParsableEmail): ParsedSubscription {
    const subject = email.subject ?? '';
    const body = this.plainBody(email.body ?? '');
    const haystack = [subject, email.snippet ?? '', body].join('\n');

    const reasons: string[] = [];
    let confidence = 0;

    // --- Sender -----------------------------------------------------------
    const merchant = matchMerchant(email.from ?? '');
    if (merchant) {
      confidence += 0.35;
      reasons.push(`known merchant: ${merchant.name}`);
    }

    // --- Hard negatives ---------------------------------------------------
    if (NOT_BILLING.test(subject)) {
      return this.notSubscription([...reasons, 'subject looks transactional, not billing']);
    }
    if (MARKETING.test(subject)) {
      return this.notSubscription([...reasons, 'subject looks promotional, not billing']);
    }

    // --- Billing language -------------------------------------------------
    if (BILLING_KEYWORDS.test(subject)) {
      confidence += 0.25;
      reasons.push('billing wording in subject');
    } else if (BILLING_KEYWORDS.test(haystack)) {
      confidence += 0.12;
      reasons.push('billing wording in body');
    }

    // --- Amount -----------------------------------------------------------
    const money = pickChargeAmount(haystack);
    if (money) {
      confidence += 0.2;
      reasons.push(`amount ${money.amount} ${money.currency}`);
    }

    // --- Billing period ---------------------------------------------------
    const detectedCycle = this.detectCycle(haystack);
    if (detectedCycle) {
      confidence += 0.15;
      reasons.push(`cycle: ${detectedCycle}`);
    }

    // --- Trial ------------------------------------------------------------
    const isTrial = TRIAL_KEYWORDS.test(haystack);
    const trialEndsAt = isTrial
      ? findLabelledDate(haystack, TRIAL_LABELS, email.receivedAt) ??
        findRelativeDate(haystack, email.receivedAt)
      : null;
    if (isTrial) {
      confidence += 0.1;
      reasons.push(trialEndsAt ? 'trial with end date' : 'trial mentioned');
    }

    // --- Renewal date -----------------------------------------------------
    const statedRenewal = findLabelledDate(
      haystack,
      RENEWAL_LABELS,
      email.receivedAt,
    );
    if (statedRenewal) {
      confidence += 0.15;
      reasons.push('stated renewal date');
    }

    // A price with no recurrence signal anywhere is most likely a one-off
    // purchase, so do not let the amount alone carry the email over the line.
    if (!detectedCycle && !isTrial && !statedRenewal && !merchant) {
      return this.notSubscription([...reasons, 'no recurrence signal']);
    }

    confidence = Math.min(1, Number(confidence.toFixed(2)));
    if (confidence < CONFIDENCE_THRESHOLD) {
      return this.notSubscription([...reasons, `confidence ${confidence} below threshold`]);
    }

    const cycle = detectedCycle ?? merchant?.defaultCycle ?? 'monthly';
    if (!detectedCycle) reasons.push(`cycle defaulted to ${cycle}`);

    return {
      isSubscription: true,
      confidence,
      service: this.serviceName(email, subject, body),
      category: merchant?.category ?? 'Other',
      price: money?.amount ?? null,
      currency: money?.currency ?? null,
      cycle,
      renewalAt: this.renewalDate(statedRenewal, trialEndsAt, cycle, email.receivedAt),
      trialEndsAt,
      reasons,
    };
  }

  /** Accept either plain text or raw HTML — callers do not always know which. */
  private plainBody(body: string): string {
    return /<\/?[a-z][\s\S]*>/i.test(body) ? htmlToText(body) : body;
  }

  private detectCycle(text: string): Cycle | null {
    for (const [cycle, pattern] of CYCLE_PATTERNS) {
      if (pattern.test(text)) return cycle;
    }
    return null;
  }

  /**
   * Prefer what the email states. Otherwise a trial converts on its end date,
   * and a receipt means the period just started — so the next charge is one
   * cycle on from the email.
   */
  private renewalDate(
    stated: Date | null,
    trialEndsAt: Date | null,
    cycle: Cycle,
    receivedAt: Date,
  ): Date {
    if (stated) return stated;
    if (trialEndsAt) return trialEndsAt;
    return nextFutureRenewal(addCycle(receivedAt, cycle), cycle);
  }

  private serviceName(
    email: ParsableEmail,
    subject: string,
    body: string,
  ): string {
    const merchant = matchMerchant(email.from ?? '');
    if (merchant) return refineServiceName(merchant, `${subject}\n${body}`);

    const display = extractDisplayName(email.from ?? '');
    const cleaned = display && this.cleanDisplayName(display);
    if (cleaned) return cleaned;

    const domain = extractDomain(email.from ?? '');
    const brand = domain && brandFromDomain(domain);
    return brand ? this.titleCase(brand) : 'Unknown service';
  }

  /** `Spotify Billing (no-reply)` -> `Spotify`. */
  private cleanDisplayName(name: string): string | null {
    const cleaned = name
      .replace(/\(.*?\)/g, ' ')
      .replace(
        /\b(no-?reply|do-?not-?reply|team|support|billing|invoices?|receipts?|notifications?|account|via|kundeservice|faktura)\b/gi,
        ' ',
      )
      .replace(/[|•·-]+\s*$/, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return cleaned.length >= 2 ? cleaned : null;
  }

  private titleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private notSubscription(reasons: string[]): ParsedSubscription {
    return {
      isSubscription: false,
      confidence: 0,
      service: null,
      category: null,
      price: null,
      currency: null,
      cycle: null,
      renewalAt: null,
      trialEndsAt: null,
      reasons,
    };
  }
}
