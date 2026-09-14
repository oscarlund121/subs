import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { DetectionsService } from './detections.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

/**
 * Minimal in-memory stand-in for the two tables `confirm` touches. Keeps these
 * tests about the confirm/dedupe rules rather than about Prisma.
 */
function fakePrisma() {
  const detections = new Map<string, any>();
  const subscriptions = new Map<string, any>();
  let nextId = 1;

  const prisma = {
    detection: {
      findUnique: ({ where: { id } }: any) =>
        Promise.resolve(detections.get(id) ?? null),
      update: ({ where: { id }, data }: any) => {
        const updated = { ...detections.get(id), ...data };
        detections.set(id, updated);
        return Promise.resolve(updated);
      },
    },
    subscription: {
      findFirst: ({ where }: any) =>
        Promise.resolve(
          [...subscriptions.values()].find(
            (s) =>
              s.nameKey === where.nameKey && s.status !== where.status.not,
          ) ?? null,
        ),
      create: ({ data }: any) => {
        const created = {
          id: `sub-${nextId++}`,
          createdAt: new Date(),
          ...data,
        };
        subscriptions.set(created.id, created);
        return Promise.resolve(created);
      },
      update: ({ where: { id }, data }: any) => {
        const updated = { ...subscriptions.get(id), ...data };
        subscriptions.set(id, updated);
        return Promise.resolve(updated);
      },
    },
  };

  return { prisma, detections, subscriptions };
}

function detection(overrides: Record<string, unknown> = {}) {
  return {
    id: 'det-1',
    emailId: 'mail-1',
    service: 'Netflix',
    category: 'Streaming',
    price: 129,
    currency: 'DKK',
    cycle: 'monthly',
    renewalAt: new Date(Date.now() + 10 * 86_400_000),
    trialEndsAt: null,
    confidence: 0.9,
    status: 'pending',
    subscriptionId: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('DetectionsService.confirm', () => {
  let store: ReturnType<typeof fakePrisma>;
  let service: DetectionsService;

  beforeEach(() => {
    store = fakePrisma();
    service = new DetectionsService(store.prisma as unknown as PrismaService);
  });

  it('creates a subscription from the parsed fields', async () => {
    store.detections.set('det-1', detection());

    await service.confirm('det-1');

    const [sub] = [...store.subscriptions.values()];
    expect(sub.name).toBe('Netflix');
    expect(sub.price).toBe(129);
    expect(sub.currency).toBe('DKK');
    expect(sub.cycle).toBe('monthly');
    expect(sub.category).toBe('Streaming');
    expect(sub.source).toBe('Email');
    expect(store.detections.get('det-1').status).toBe('confirmed');
    expect(store.detections.get('det-1').subscriptionId).toBe(sub.id);
  });

  it('lets user corrections override the parser', async () => {
    store.detections.set('det-1', detection({ price: 99, service: 'Netflx' }));

    await service.confirm('det-1', {
      name: 'Netflix',
      price: 139,
      category: 'Entertainment',
    });

    const [sub] = [...store.subscriptions.values()];
    expect(sub.name).toBe('Netflix');
    expect(sub.price).toBe(139);
    expect(sub.category).toBe('Entertainment');
  });

  it('updates the existing subscription instead of duplicating it', async () => {
    store.detections.set('det-1', detection());
    store.detections.set(
      'det-2',
      detection({ id: 'det-2', emailId: 'mail-2', price: 139 }),
    );

    await service.confirm('det-1');
    await service.confirm('det-2');

    expect(store.subscriptions.size).toBe(1);
    expect([...store.subscriptions.values()][0].price).toBe(139);
  });

  it('matches services whose names are spelled differently', async () => {
    store.detections.set('det-1', detection({ service: 'Apple TV+' }));
    store.detections.set(
      'det-2',
      detection({ id: 'det-2', emailId: 'mail-2', service: 'apple tv +' }),
    );

    await service.confirm('det-1');
    await service.confirm('det-2');

    expect(store.subscriptions.size).toBe(1);
  });

  it('never stores a renewal date in the past', async () => {
    store.detections.set(
      'det-1',
      detection({
        renewalAt: new Date('2024-01-15T00:00:00Z'),
        createdAt: new Date('2024-01-15T00:00:00Z'),
      }),
    );

    await service.confirm('det-1');

    const [sub] = [...store.subscriptions.values()];
    expect(sub.nextRenewal.getTime()).toBeGreaterThan(Date.now());
    // Rolled forward on the billing cycle, so it keeps the 15th.
    expect(sub.nextRenewal.getUTCDate()).toBe(15);
  });

  it('marks a live trial as a trial and renews on the trial end date', async () => {
    const trialEnd = new Date(Date.now() + 5 * 86_400_000);
    store.detections.set(
      'det-1',
      detection({ trialEndsAt: trialEnd, renewalAt: null }),
    );

    await service.confirm('det-1');

    const [sub] = [...store.subscriptions.values()];
    expect(sub.status).toBe('trial');
    expect(sub.nextRenewal).toEqual(trialEnd);
  });

  it('is idempotent once confirmed', async () => {
    store.detections.set('det-1', detection());

    await service.confirm('det-1');
    await service.confirm('det-1');

    expect(store.subscriptions.size).toBe(1);
  });

  it('404s on an unknown detection', async () => {
    await expect(service.confirm('nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
