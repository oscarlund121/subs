import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, gmail_v1 } from 'googleapis';

export interface IncomingEmail {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  body: string;
}

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

  async listRecentMessages(maxResults = 20): Promise<{ id: string }[]> {
    const res = await this.gmail!.users.messages.list({
      userId: 'me',
      q: 'in:inbox',
      maxResults,
    });
    return (res.data.messages ?? []).map((m) => ({ id: m.id! }));
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
      body: this.extractBody(msg.payload),
    };
  }

  private extractBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
    const decode = (data?: string | null) => {
      if (!data) return '';
      const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
      return Buffer.from(b64, 'base64').toString('utf8');
    };

    if (!payload) return '';
    if (payload.body?.data) return decode(payload.body.data);
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return decode(part.body.data);
        }
      }
    }
    return '';
  }
}
