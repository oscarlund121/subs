import { Module } from '@nestjs/common';
import { DetectionsController } from './detections.controller.js';
import { DetectionsService } from './detections.service.js';
import { SubscriptionParserService } from './parser/subscription-parser.service.js';

@Module({
  controllers: [DetectionsController],
  providers: [DetectionsService, SubscriptionParserService],
  exports: [SubscriptionParserService],
})
export class DetectionsModule {}
