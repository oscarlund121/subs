import { Module } from '@nestjs/common';
import { DetectionsController } from './detections.controller.js';
import { DetectionsService } from './detections.service.js';

@Module({
  controllers: [DetectionsController],
  providers: [DetectionsService],
})
export class DetectionsModule {}
