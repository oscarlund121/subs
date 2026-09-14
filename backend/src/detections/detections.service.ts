import { Injectable, NotFoundException } from '@nestjs/common';
import type { Detection, Subscription } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfirmDetectionDto } from './dto/confirm-detection.dto.js';
import { nameKey } from '../common/name-key.js';
import {
  addCycle,
  nextFutureRenewal,
  CYCLES,
  type Cycle,
} from './parser/types.js';

@Injectable()
export class DetectionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Detections awaiting review, most confident first — the ones the user can
   * accept at a glance come before the ones needing a closer look.
   */
  findAllPending(): Promise<Detection[]> {
    return this.prisma.detection.findMany({
      where: { status: 'pending' },
      orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Turn a detection into a tracked subscription.
   *
   * Values from `dto` are corrections the user made while reviewing and always
   * win over what the parser extracted. If we already track the same service,
   * this updates it rather than adding a duplicate.
   */
  async confirm(id: string, dto: ConfirmDetectionDto = {}): Promise<Detection> {
    const detection = await this.prisma.detection.findUnique({ where: { id } });
    if (!detection) throw new NotFoundException('Detection not found');

    // Confirming twice should not create a second subscription.
    if (detection.status === 'confirmed' && detection.subscriptionId) {
      return detection;
    }

    const name = dto.name ?? detection.service ?? 'Unknown service';
    const cycle = this.resolveCycle(dto.cycle ?? detection.cycle);
    const trialEndsAt = this.resolveTrialEnd(dto, detection);
    const data = {
      name,
      nameKey: nameKey(name),
      category: dto.category ?? detection.category ?? 'Other',
      price: dto.price ?? detection.price ?? 0,
      currency: dto.currency ?? detection.currency ?? 'DKK',
      cycle,
      nextRenewal: this.resolveRenewal(dto, detection, cycle, trialEndsAt),
      trialEndsAt,
      status: dto.status ?? (this.isFutureTrial(trialEndsAt) ? 'trial' : 'active'),
      source: 'Email',
    };

    const existing = await this.findTrackedSubscription(data.nameKey);
    const subscription = existing
      ? await this.prisma.subscription.update({
          where: { id: existing.id },
          data,
        })
      : await this.prisma.subscription.create({ data });

    return this.prisma.detection.update({
      where: { id },
      data: { status: 'confirmed', subscriptionId: subscription.id },
    });
  }

  async ignore(id: string): Promise<Detection> {
    try {
      return await this.prisma.detection.update({
        where: { id },
        data: { status: 'ignored' },
      });
    } catch {
      throw new NotFoundException('Detection not found');
    }
  }

  /** An existing subscription for the same service that is still live. */
  private findTrackedSubscription(key: string): Promise<Subscription | null> {
    if (!key) return Promise.resolve(null);
    return this.prisma.subscription.findFirst({
      where: { nameKey: key, status: { not: 'cancelled' } },
      orderBy: { createdAt: 'asc' },
    });
  }

  private resolveCycle(value: string | null | undefined): Cycle {
    return CYCLES.includes(value as Cycle) ? (value as Cycle) : 'monthly';
  }

  private resolveTrialEnd(
    dto: ConfirmDetectionDto,
    detection: Detection,
  ): Date | null {
    if (dto.trialEndsAt === null) return null;
    if (dto.trialEndsAt) return new Date(dto.trialEndsAt);
    return detection.trialEndsAt;
  }

  private isFutureTrial(trialEndsAt: Date | null): boolean {
    return trialEndsAt !== null && trialEndsAt.getTime() > Date.now();
  }

  /**
   * Never store a renewal date in the past — an old receipt still has to
   * produce the *next* charge, otherwise it shows up as permanently overdue.
   */
  private resolveRenewal(
    dto: ConfirmDetectionDto,
    detection: Detection,
    cycle: Cycle,
    trialEndsAt: Date | null,
  ): Date {
    if (dto.nextRenewal) return new Date(dto.nextRenewal);
    if (this.isFutureTrial(trialEndsAt)) return trialEndsAt!;

    const anchor =
      detection.renewalAt ?? addCycle(detection.createdAt, cycle);
    return nextFutureRenewal(anchor, cycle);
  }
}
