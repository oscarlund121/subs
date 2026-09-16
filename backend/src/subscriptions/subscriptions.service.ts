import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Subscription } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CancellationService } from '../cancellation/cancellation.service.js';
import { CreateSubscriptionDto } from './dto/create-subscription.dto.js';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto.js';
import { nameKey } from '../common/name-key.js';
import { nextFutureRenewal, CYCLES, type Cycle } from '../detections/parser/types.js';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cancellation: CancellationService,
  ) {}

  findAll(): Promise<Subscription[]> {
    return this.prisma.subscription.findMany({
      orderBy: { nextRenewal: 'asc' },
    });
  }

  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');
    return subscription;
  }

  async create(dto: CreateSubscriptionDto): Promise<Subscription> {
    const subscription = await this.prisma.subscription.create({
      data: {
        name: dto.name,
        nameKey: nameKey(dto.name),
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

    // Resolve the cancellation page now so the first "Cancel" tap is instant.
    void this.cancellation.discover(dto.name).catch(() => undefined);
    return subscription;
  }

  async update(id: string, dto: UpdateSubscriptionDto): Promise<Subscription> {
    await this.findOne(id); // 404 before we attempt the write

    return this.prisma.subscription.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && {
          name: dto.name,
          nameKey: nameKey(dto.name),
        }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.cycle !== undefined && { cycle: dto.cycle }),
        ...(dto.nextRenewal !== undefined && {
          nextRenewal: new Date(dto.nextRenewal),
        }),
        ...(dto.trialEndsAt !== undefined && {
          trialEndsAt: dto.trialEndsAt ? new Date(dto.trialEndsAt) : null,
        }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.source !== undefined && { source: dto.source }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async remove(id: string): Promise<Subscription> {
    try {
      return await this.prisma.subscription.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Subscription not found');
    }
  }

  /**
   * Move renewal dates that have passed on to the next billing period.
   *
   * Without this every subscription drifts into the past and "upcoming
   * renewals" fills up with dates that have already happened.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async rollRenewalDates(): Promise<number> {
    const due = await this.prisma.subscription.findMany({
      where: { nextRenewal: { lt: new Date() }, status: { not: 'cancelled' } },
    });

    let rolled = 0;
    for (const subscription of due) {
      const cycle = CYCLES.includes(subscription.cycle as Cycle)
        ? (subscription.cycle as Cycle)
        : 'monthly';
      const next = nextFutureRenewal(subscription.nextRenewal, cycle);

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          nextRenewal: next,
          // A trial that has run its course is now a paid subscription.
          ...(subscription.status === 'trial' &&
            subscription.trialEndsAt &&
            subscription.trialEndsAt.getTime() <= Date.now() && {
              status: 'active',
            }),
        },
      });
      rolled++;
    }

    if (rolled) this.logger.log(`Rolled ${rolled} renewal date(s) forward.`);
    return rolled;
  }
}
