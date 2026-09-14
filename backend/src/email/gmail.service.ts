import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, gmail_v1 } from 'googleapis';
import { extractBody } from './mime.js';

export interface IncomingEmail {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  body: string;
  receivedAt: Date;
}

/**
 * Narrows the mailbox to mail that could plausibly be subscription billing.
 * Without this we would pull in every newsletter and personal email, and the
 * parser would spend its time rejecting them.
 */
const SUBSCRIPTION_QUERY = [
  '-in:spam',
  '-in:trash',
  '(',
  'subject:(receipt OR invoice OR subscription OR renewal OR renews OR membership',
  'OR billing OR "free trial" OR kvittering OR faktura OR abonnement OR fornyelse',
  'OR betaling OR medlemskab)',
  'OR "your subscription" OR "next billing date" OR "payment received"',
  'OR "payment confirmation" OR "auto-renew" OR "free trial"',
  'OR "dit abonnement" OR "næste betaling" OR "prøveperiode"',
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
