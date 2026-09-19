import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, gmail_v1 } from 'googleapis';
import { extractBody } from './mime.js';
import { merchantQueryDomains } from '../detections/parser/merchants.js';

export interface IncomingEmail {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  body: string;
  receivedAt: Date;
}

/**
 * Words that, in a *subject*, reliably mark billing or trial mail. This is the
 * fallback path for senders we don't know about — known billing domains are
 * pulled by `from:` below regardless of subject.
 *
 * Deliberately subject-scoped: the previous version also matched bare body
 * terms ("your subscription", "free trial"), which dragged every newsletter
 * whose footer mentions "subscription" into the pipeline (The Economist alone
 * was ~60% of all filtered mail) to be rejected after a wasted fetch + parse.
 */
const BILLING_SUBJECT_TERMS = [
  'receipt',
  'invoice',
  'subscription',
  'subscribed',
  'renewal',
  'renews',
  'renewing',
  'membership',
  'billing',
  'billed',
  'payment',
  'trial',
  'kvittering',
  'faktura',
  'abonnement',
  'fornyelse',
  'fornyes',
  'betaling',
  'medlemskab',
  'opkrævning',
  'regning',
  'prøveperiode',
  'prøve',
];

/**
 * `from:(<known billing domains>) OR subject:(<billing words>)`.
 *
 * Two paths into the watcher:
 *  - a known billing domain is always fetched (recall — catches "Your plan is
 *    changing" and other non-billing subject lines from real services), and
 *  - an unknown sender needs an explicitly billing subject (precision — keeps
 *    newsletters and personal mail out).
 */
const SUBSCRIPTION_QUERY = [
  '-in:spam',
  '-in:trash',
  '(',
  `from:(${merchantQueryDomains().join(' OR ')})`,
  'OR',
  `subject:(${BILLING_SUBJECT_TERMS.join(' OR ')})`,
  ')',
].join(' ');

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private gmail: gmail_v1.Gmail | null = null;

  constructor(private readonly config: ConfigService) {
    const clientId = config.get<string>('GMAIL_CLIENT_ID');
    const clientSecret = config.get<string>('GMAIL_CLIENT_SECRET');
    const refreshToken = config.get<string>('GMAIL_REFRESH_TOKEN');

    if (clientId && clientSecret && refreshToken) {
      const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
      oauth2.setCredentials({ refresh_token: refreshToken });
      this.gmail = google.gmail({ version: 'v1', auth: oauth2 });
    } else {
      this.logger.warn(
        'Gmail OAuth not configured (missing GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN).',
      );
    }
  }

  isConfigured(): boolean {
    return this.gmail !== null;
  }

  /**
   * Message ids matching the subscription query.
   *
   * @param maxResults how many ids to return at most
   * @param newerThan  Gmail relative age, e.g. `7d` or `1y`. Use a wide window
   *                   for the initial backfill and a narrow one when polling.
   */
  async listSubscriptionMessages(
    maxResults = 50,
    newerThan = '30d',
  ): Promise<{ id: string }[]> {
    const query = `${SUBSCRIPTION_QUERY} newer_than:${newerThan}`;
    const ids: { id: string }[] = [];
    let pageToken: string | undefined;

    do {
      const res = await this.gmail!.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: Math.min(100, maxResults - ids.length),
        pageToken,
      });
      for (const m of res.data.messages ?? []) {
        if (m.id) ids.push({ id: m.id });
      }
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken && ids.length < maxResults);

    return ids;
  }

  async getMessage(id: string): Promise<IncomingEmail> {
    const res = await this.gmail!.users.messages.get({
      userId: 'me',
      id,
      format: 'full',
    });
    const msg = res.data;
    const headers = msg.payload?.headers ?? [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ??
      '';

    return {
      id: msg.id!,
      from: getHeader('From'),
      subject: getHeader('Subject'),
      snippet: msg.snippet ?? '',
      body: extractBody(msg.payload),
      receivedAt: msg.internalDate
        ? new Date(Number(msg.internalDate))
        : new Date(),
    };
  }

}
