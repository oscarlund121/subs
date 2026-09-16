import { Controller, Get, Param } from '@nestjs/common';
import { CancellationService } from './cancellation.service.js';
import type { ResolvedGuide } from './cancellation.service.js';

/**
 * Root-level controller so the per-subscription guide lives at the natural
 * `/subscriptions/:id/cancel-guide` path without touching SubscriptionsController.
 */
@Controller()
export class CancellationController {
  constructor(private readonly cancellation: CancellationService) {}

  @Get('subscriptions/:id/cancel-guide')
  cancelGuide(@Param('id') id: string): Promise<ResolvedGuide> {
    return this.cancellation.resolveGuide(id);
  }

  @Get('cancellation-guides')
  listGuides() {
    return this.cancellation.listGuides();
  }
}
