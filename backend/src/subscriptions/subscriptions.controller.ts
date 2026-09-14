import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service.js';
import { CreateSubscriptionDto } from './dto/create-subscription.dto.js';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto.js';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }
}
