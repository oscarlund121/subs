import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DetectionsService } from './detections.service.js';
import { ConfirmDetectionDto } from './dto/confirm-detection.dto.js';

@Controller('detections')
export class DetectionsController {
  constructor(private readonly detectionsService: DetectionsService) {}

  @Get()
  findAllPending() {
    return this.detectionsService.findAllPending();
  }

  /** Body is optional — send only the fields the user corrected. */
  @Post(':id/confirm')
  confirm(@Param('id') id: string, @Body() dto: ConfirmDetectionDto) {
    return this.detectionsService.confirm(id, dto);
  }

  @Post(':id/ignore')
  ignore(@Param('id') id: string) {
    return this.detectionsService.ignore(id);
  }
}
