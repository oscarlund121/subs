import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { GmailService } from './gmail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SubscriptionParserService } from '../detections/parser/subscription-parser.service.js';

export interface PollResult {
  scanned: number;
  detected: number;
  filtered: number;
}

/** First run reaches back a year; routine polls only need recent mail. */
const BACKFILL_WINDOW = '1y';
const BACKFILL_LIMIT = 200;
const POLL_WINDOW = '14d';
const POLL_LIMIT = 50;

@Injectable()
export class EmailWatcherService implements OnModuleInit {
  private readonly logger = new Logger(EmailWatcherService.name);
  private running = false;

  constructor(
    private readonly gmail: GmailService,
    private readonly prisma: PrismaService,
    private readonly parser: SubscriptionParserService,
  ) {}

  onModuleInit() {
    if (this.gmail.isConfigured()) {
      this.logger.log('Email watcher ready — first poll in 5s');
      setTimeout(() => void this.poll(), 5000);
    } else {
      this.logger.warn('Email watcher idle — Gmail OAuth not configured yet.');
    }
  }

  @Interval(120000) // every 2 minutes
  async poll(): Promise<PollResult> {
    const empty: PollResult = { scanned: 0, detected: 0, filtered: 0 };
    if (!this.gmail.isConfigured()) return empty;

    // A slow backfill must not overlap with the interval trigger.
    if (this.running) {
      this.logger.debug('Poll already in progress — skipping this tick.');
      return empty;
    }
    this.running = true;

    try {
      const firstRun = (await this.prisma.detection.count()) === 0;
      const messages = await this.gmail.listSubscriptionMessages(
        firstRun ? BACKFILL_LIMIT : POLL_LIMIT,
        firstRun ? BACKFILL_WINDOW : POLL_WINDOW,
      );
      if (firstRun) {
        this.logger.log(
          `First run — backfilling up to ${BACKFILL_LIMIT} messages from the last ${BACKFILL_WINDOW}.`,
        );
      }

      const result = await this.ingest(messages.map((m) => m.id));
      this.logger.log(
        `Poll complete — scanned ${result.scanned}, ${result.detected} subscription(s) detected, ${result.filtered} filtered out.`,
      );
      return result;
    } catch (err) {
      this.logger.error(
        'Poll failed',
        err instanceof Error ? err.stack : String(err),
      );
      return empty;
    } finally {
      this.running = false;
    }
  }

  private async ingest(ids: string[]): Promise<PollResult> {
    const known = await this.prisma.detection.findMany({
      where: { emailId: { in: ids } },
      select: { emailId: true },
    });
    const seen = new Set(known.map((d) => d.emailId));
    const fresh = ids.filter((id) => !seen.has(id));

    let detected = 0;
    let filtered = 0;

    for (const id of fresh) {
      try {
        const email = await this.gmail.getMessage(id);
        const parsed = this.parser.parse(email);

        await this.prisma.detection.create({
          data: {
            emailId: email.id,
            from: email.from,
            subject: email.subject,
            // Gmail's own snippet only — full bodies are parsed in memory and
            // never persisted.
            snippet: email.snippet,
            service: parsed.service,
            category: parsed.category,
            price: parsed.price,
            currency: parsed.currency,
            cycle: parsed.cycle,
            renewalAt: parsed.renewalAt,
            trialEndsAt: parsed.trialEndsAt,
            confidence: parsed.confidence,
            parseReasons: JSON.stringify(parsed.reasons),
            // `filtered` keeps the email id on record so we never re-fetch it,
            // without showing the user something we judged irrelevant.
            status: parsed.isSubscription ? 'pending' : 'filtered',
          },
        });

        if (parsed.isSubscription) detected++;
        else filtered++;
      } catch (err) {
        this.logger.warn(
          `Skipped message ${id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return { scanned: fresh.length, detected, filtered };
  }
}
