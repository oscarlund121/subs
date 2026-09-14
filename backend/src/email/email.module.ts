import { Module } from '@nestjs/common';
import { GmailService } from './gmail.service.js';
import { EmailWatcherService } from './email-watcher.service.js';
import { EmailController } from './email.controller.js';
import { DetectionsModule } from '../detections/detections.module.js';

@Module({
  imports: [DetectionsModule],
  controllers: [EmailController],
  providers: [GmailService, EmailWatcherService],
})
export class EmailModule {}
