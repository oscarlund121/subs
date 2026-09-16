import { Module } from '@nestjs/common';
import { CancellationService } from './cancellation.service.js';
import { CancellationController } from './cancellation.controller.js';

@Module({
  controllers: [CancellationController],
  providers: [CancellationService],
  exports: [CancellationService],
})
export class CancellationModule {}
