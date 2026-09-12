import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { GmailService } from './gmail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class EmailWatcherService implements OnModuleInit {
  private readonly logger = new Logger(EmailWatcherService.name);

  constructor(
    private readonly gmail: GmailService,
    private readonly prisma: PrismaService,
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
  async poll(): Promise<void> {
    if (!this.gmail.isConfigured()) return;

    try {
      const messages = await this.gmail.listRecentMessages(20);
      let stored = 0;

      for (const { id } of messages) {
        const existing = await this.prisma.detection.findUnique({
          where: { emailId: id },
        });
        if (existing) continue;

        const email = await this.gmail.getMessage(id);
        await this.prisma.detection.create({
          data: {
            emailId: email.id,
            from: email.from,
            subject: email.subject,
            snippet: email.snippet,
            body: email.body,
            status: 'pending',
          },
        });
        stored++;
      }

      this.logger.log(`Poll complete — ${stored} new email(s) stored as pending detections.`);
    } catch (err) {
      this.logger.error(
        'Poll failed',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
