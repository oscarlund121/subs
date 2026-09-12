import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { GmailService } from './gmail.service.js';
import { EmailWatcherService } from './email-watcher.service.js';
import { EmailController } from './email.controller.js';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [EmailController],
  providers: [GmailService, EmailWatcherService],
})
export class EmailModule {}
