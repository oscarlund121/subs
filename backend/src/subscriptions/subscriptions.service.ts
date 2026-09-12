import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSubscriptionDto } from './dto/create-subscription.dto.js';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.subscription.findMany({
      orderBy: { nextRenewal: 'asc' },
    });
  }

  create(dto: CreateSubscriptionDto) {
    return this.prisma.subscription.create({
      data: {
        name: dto.name,
        category: dto.category,
        price: dto.price,
        currency: dto.currency,
        cycle: dto.cycle,
        nextRenewal: new Date(dto.nextRenewal),
        trialEndsAt: dto.trialEndsAt ? new Date(dto.trialEndsAt) : null,
        status: dto.status,
        source: dto.source,
        notes: dto.notes ?? null,
      },
    });
  }

  async remove(id: string) {
    try {
      return await this.prisma.subscription.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Subscription not found');
    }
  }
}
