import { Controller, Get, Param, Post } from '@nestjs/common';
import { DetectionsService } from './detections.service.js';

@Controller('detections')
export class DetectionsController {
  constructor(private readonly detectionsService: DetectionsService) {}

  @Get()
  findAllPending() {
    return this.detectionsService.findAllPending();
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.detectionsService.confirm(id);
  }

  @Post(':id/ignore')
  ignore(@Param('id') id: string) {
    return this.detectionsService.ignore(id);
  }
}
