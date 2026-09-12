import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service.js';
import { CreateSubscriptionDto } from './dto/create-subscription.dto.js';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }
}
