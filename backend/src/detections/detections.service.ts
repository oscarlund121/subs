import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DetectionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllPending() {
    return this.prisma.detection.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async confirm(id: string) {
    const detection = await this.prisma.detection.findUnique({ where: { id } });
    if (!detection) throw new NotFoundException('Detection not found');

    const subscription = await this.prisma.subscription.create({
      data: {
        name: detection.service ?? 'Detected subscription',
        category: 'Other',
        price: detection.price ?? 0,
        currency: detection.currency ?? 'DKK',
        cycle: detection.cycle ?? 'monthly',
        nextRenewal: detection.trialEndsAt ?? new Date(),
        trialEndsAt: detection.trialEndsAt,
        status: detection.trialEndsAt ? 'trial' : 'active',
        source: 'Email',
      },
    });

    return this.prisma.detection.update({
      where: { id },
      data: { status: 'confirmed', subscriptionId: subscription.id },
    });
  }

  async ignore(id: string) {
    try {
      return await this.prisma.detection.update({
        where: { id },
        data: { status: 'ignored' },
      });
    } catch {
      throw new NotFoundException('Detection not found');
    }
  }
}
