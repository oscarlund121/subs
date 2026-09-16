import { beforeEach, describe, expect, it } from 'vitest';
import { SubscriptionsService } from './subscriptions.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { CancellationService } from '../cancellation/cancellation.service.js';

/**
 * Minimal in-memory stand-in for the single query `remindAboutEndingTrials`
 * runs, so these tests stay about the reminder rules rather than about Prisma.
 */
function fakePrisma() {
  const subscriptions = new Map<string, any>();

  const prisma = {
    subscription: {
      findMany: ({ where, orderBy }: any) => {
        let rows = [...subscriptions.values()];
        if (where?.status) rows = rows.filter((s) => s.status === where.status);
        if (where?.trialEndsAt?.gt) {
          rows = rows.filter((s) => s.trialEndsAt > where.trialEndsAt.gt);
        }
        if (where?.trialEndsAt?.lte) {
          rows = rows.filter((s) => s.trialEndsAt <= where.trialEndsAt.lte);
        }
        if (where?.trialRemindedAt === null) {
          rows = rows.filter((s) => s.trialRemindedAt == null);
        }
        if (orderBy?.trialEndsAt) {
          rows.sort((a, b) => a.trialEndsAt - b.trialEndsAt);
        }
        return Promise.resolve(rows);
      },
      update: ({ where: { id }, data }: any) => {
        const updated = { ...subscriptions.get(id), ...data };
        subscriptions.set(id, updated);
        return Promise.resolve(updated);
      },
    },
  };

  return { prisma, subscriptions };
}

function trial(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-1',
    name: 'Netflix',
    price: 129,
    currency: 'DKK',
    status: 'trial',
    trialEndsAt: new Date(Date.now() + 86_400_000),
    trialRemindedAt: null,
    ...overrides,
  };
}

describe('SubscriptionsService.remindAboutEndingTrials', () => {
  let store: ReturnType<typeof fakePrisma>;
  let service: SubscriptionsService;
  const now = new Date('2026-09-16T08:00:00Z');

  beforeEach(() => {
    store = fakePrisma();
    service = new SubscriptionsService(
      store.prisma as unknown as PrismaService,
      {} as CancellationService,
    );
  });

  it('flags a trial ending within the window', async () => {
    store.subscriptions.set(
      'sub-1',
      trial({ trialEndsAt: new Date(now.getTime() + 2 * 86_400_000) }),
    );

    const flagged = await service.remindAboutEndingTrials(now);

    expect(flagged).toBe(1);
    expect(store.subscriptions.get('sub-1').trialRemindedAt).toEqual(now);
  });

  it('does not re-flag a trial that was already reminded', async () => {
    store.subscriptions.set(
      'sub-1',
      trial({ trialRemindedAt: new Date('2026-09-15T08:00:00Z') }),
    );

    expect(await service.remindAboutEndingTrials(now)).toBe(0);
  });

  it('ignores trials ending beyond the window', async () => {
    store.subscriptions.set(
      'sub-1',
      trial({ trialEndsAt: new Date(now.getTime() + 10 * 86_400_000) }),
    );

    expect(await service.remindAboutEndingTrials(now)).toBe(0);
  });

  it('ignores a trial that already ended', async () => {
    store.subscriptions.set(
      'sub-1',
      trial({ trialEndsAt: new Date(now.getTime() - 86_400_000) }),
    );

    expect(await service.remindAboutEndingTrials(now)).toBe(0);
  });

  it('ignores non-trial subscriptions', async () => {
    store.subscriptions.set('sub-1', trial({ status: 'active' }));

    expect(await service.remindAboutEndingTrials(now)).toBe(0);
  });

  it('only flags once per trial across runs', async () => {
    store.subscriptions.set(
      'sub-1',
      trial({ trialEndsAt: new Date(now.getTime() + 2 * 86_400_000) }),
    );

    expect(await service.remindAboutEndingTrials(now)).toBe(1);
    expect(await service.remindAboutEndingTrials(now)).toBe(0);
  });
});
