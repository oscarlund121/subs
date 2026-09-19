import { beforeEach, describe, expect, it } from 'vitest';
import { SubscriptionParserService } from './subscription-parser.service.js';
import { addMonths, type ParsableEmail } from './types.js';

const RECEIVED = new Date('2026-03-10T09:00:00Z');

function email(overrides: Partial<ParsableEmail>): ParsableEmail {
  return {
    from: 'Someone <someone@example.com>',
    subject: '',
    snippet: '',
    body: '',
    receivedAt: RECEIVED,
    ...overrides,
  };
}

describe('SubscriptionParserService', () => {
  let parser: SubscriptionParserService;

  beforeEach(() => {
    parser = new SubscriptionParserService();
  });

  describe('real-world receipts', () => {
    it('parses a Netflix monthly receipt', () => {
      const result = parser.parse(
        email({
          from: 'Netflix <info@mailer.netflix.com>',
          subject: 'Your Netflix receipt',
          body: [
            'Hi Oscar,',
            'Thanks for being a member.',
            'Total charged: 129,00 kr',
            'Your next billing date is 10 April 2026.',
          ].join('\n'),
        }),
      );

      expect(result.isSubscription).toBe(true);
      expect(result.service).toBe('Netflix');
      expect(result.category).toBe('Streaming');
      expect(result.price).toBe(129);
      expect(result.currency).toBe('DKK');
      expect(result.cycle).toBe('monthly');
      expect(result.renewalAt?.toISOString().slice(0, 10)).toBe('2026-04-10');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('parses a Spotify receipt in Danish', () => {
      const result = parser.parse(
        email({
          from: 'Spotify <no-reply@spotify.com>',
          subject: 'Din kvittering fra Spotify',
          body: [
            'Tak for din betaling.',
            'I alt: 119,00 kr.',
            'Abonnementet fornyes automatisk den 1. april 2026.',
          ].join('\n'),
        }),
      );

      expect(result.isSubscription).toBe(true);
      expect(result.service).toBe('Spotify');
      expect(result.price).toBe(119);
      expect(result.currency).toBe('DKK');
      expect(result.renewalAt?.toISOString().slice(0, 10)).toBe('2026-04-01');
    });

    it('parses an annual USD subscription from HTML', () => {
      const result = parser.parse(
        email({
          from: '1Password <billing@1password.com>',
          subject: 'Your 1Password invoice',
          body:
            '<html><body><table><tr><td>Amount due</td>' +
            '<td>$35.88</td></tr></table>' +
            '<p>Billed annually. Renews on January 15, 2027.</p></body></html>',
        }),
      );

      expect(result.isSubscription).toBe(true);
      expect(result.service).toBe('1Password');
      expect(result.price).toBe(35.88);
      expect(result.currency).toBe('USD');
      expect(result.cycle).toBe('yearly');
      expect(result.renewalAt?.toISOString().slice(0, 10)).toBe('2027-01-15');
    });

    it('resolves the specific product for a multi-product sender', () => {
      const result = parser.parse(
        email({
          from: 'Apple <no_reply@email.apple.com>',
          subject: 'Your receipt from Apple',
          body: 'Apple TV+\nMonthly Subscription\nTOTAL 99,00 kr',
        }),
      );

      expect(result.service).toBe('Apple TV+');
      expect(result.cycle).toBe('monthly');
      expect(result.price).toBe(99);
    });

    it('treats a trial as ending on the stated date', () => {
      const result = parser.parse(
        email({
          from: 'HBO Max <no-reply@mail.hbomax.com>',
          subject: 'Your free trial has started',
          body: 'Your free trial ends on 24 March 2026. After that you pay 89,00 kr per month.',
        }),
      );

      expect(result.isSubscription).toBe(true);
      expect(result.trialEndsAt?.toISOString().slice(0, 10)).toBe('2026-03-24');
      expect(result.renewalAt?.toISOString().slice(0, 10)).toBe('2026-03-24');
      expect(result.cycle).toBe('monthly');
    });

    it('resolves a relative trial length against the email date', () => {
      const result = parser.parse(
        email({
          from: 'Curiosity <hello@curiositystream.com>',
          subject: 'Your 14-day free trial',
          body: 'Enjoy your 14-day free trial. Then $19.99 per year.',
        }),
      );

      expect(result.trialEndsAt?.toISOString().slice(0, 10)).toBe('2026-03-24');
      expect(result.cycle).toBe('yearly');
    });

    it('identifies an unknown sender from its domain', () => {
      const result = parser.parse(
        email({
          from: 'billing@mail.somenewapp.io',
          subject: 'Your subscription receipt',
          body: 'You were charged €4.99 per month. Next billing date: 2026-04-10.',
        }),
      );

      expect(result.isSubscription).toBe(true);
      expect(result.service).toBe('Somenewapp');
      expect(result.price).toBe(4.99);
      expect(result.currency).toBe('EUR');
      expect(result.category).toBe('Other');
    });
  });

  describe('rejects non-subscription mail', () => {
    const cases: [string, Partial<ParsableEmail>][] = [
      [
        'newsletters',
        {
          from: 'The Daily <news@somenewsletter.com>',
          subject: 'Your Tuesday briefing',
          body: 'Top stories today. Unsubscribe here.',
        },
      ],
      [
        'password resets',
        {
          from: 'Netflix <info@netflix.com>',
          subject: 'Reset your password',
          body: 'Click to reset your password.',
        },
      ],
      [
        'shipping notifications',
        {
          from: 'Shop <orders@shop.com>',
          subject: 'Your order has shipped',
          body: 'Tracking number 12345. Total 499,00 kr.',
        },
      ],
      [
        'one-off purchases',
        {
          from: 'Store <receipts@randomstore.com>',
          subject: 'Thanks for your purchase',
          body: 'You paid 249,00 kr for one item.',
        },
      ],
      [
        'personal mail',
        {
          from: 'Mom <mom@gmail.com>',
          subject: 'Dinner Sunday?',
          body: 'Are you free around 6?',
        },
      ],
      [
        'marketing/referral mail from a known merchant',
        {
          from: 'Spotify <no-reply@spotify.com>',
          subject: 'Sidste chance for at dele 3 måneders gratis Premium med en ven.',
          body: 'Del 3 måneders gratis Premium med en ven. 119 kr/måned bagefter.',
        },
      ],
    ];

    it.each(cases)('rejects %s', (_label, overrides) => {
      const result = parser.parse(email(overrides));
      expect(result.isSubscription).toBe(false);
      expect(result.price).toBeNull();
    });
  });

  describe('renewal dates', () => {
    it('derives the next charge one cycle out when none is stated', () => {
      // Anchored to a recent receipt so this isolates the cycle arithmetic
      // from the roll-forward covered by the next test.
      const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000);
      const result = parser.parse(
        email({
          from: 'Figma <billing@figma.com>',
          subject: 'Your Figma receipt',
          body: 'Total $15.00 per month. Thanks!',
          receivedAt: threeDaysAgo,
        }),
      );

      expect(result.renewalAt?.toISOString().slice(0, 10)).toBe(
        addMonths(threeDaysAgo, 1).toISOString().slice(0, 10),
      );
    });

    it('rolls an old receipt forward to a future date', () => {
      const longAgo = new Date(Date.now() - 400 * 86_400_000);
      const result = parser.parse(
        email({
          from: 'Figma <billing@figma.com>',
          subject: 'Your Figma receipt',
          body: 'Total $15.00 per month.',
          receivedAt: longAgo,
        }),
      );

      expect(result.renewalAt!.getTime()).toBeGreaterThan(Date.now());
    });
  });
});
