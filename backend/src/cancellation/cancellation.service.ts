import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { CancellationGuide } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { nameKey } from '../common/name-key.js';
import { MERCHANTS } from '../detections/parser/merchants.js';
import { htmlToText } from '../detections/parser/html.js';

/** Returned to the app: a concrete guide, or a generic search fallback. */
export interface CancelGuidePayload {
  id: string;
  serviceName: string;
  cancelUrl: string;
  steps: string[];
}

export interface ResolvedGuide {
  guide: CancelGuidePayload | null;
  fallbackUrl: string;
}

/** Words that signal a page is about ending a subscription. */
const CANCEL_KEYWORDS = [
  'cancel subscription',
  'cancel your subscription',
  'cancel membership',
  'end subscription',
  'unsubscribe',
  'cancel plan',
  'cancel your plan',
  'stop subscription',
  'cancel my subscription',
  'close account',
  'afmeld',
  'opsig',
];

/**
 * Account/settings paths most likely to be where you cancel. Order matters —
 * more specific paths win, so we land the user as close to the cancel button
 * as possible before settling for a bare account page.
 */
const CANDIDATE_PATHS = [
  '/account/subscription',
  '/subscription/cancel',
  '/cancelplan',
  '/account',
  '/settings/billing',
  '/subscription',
  '/cancel',
  '/billing',
  '/membership',
  '/account/billing',
  '/settings/subscription',
  '/plan',
  '/manage',
];

const GENERIC_STEPS = [
  'Log in to your account.',
  'Open your account or subscription settings.',
  'Find the subscription or membership you want to end.',
  'Choose cancel and confirm.',
];

const REQUEST_TIMEOUT_MS = 5000;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

@Injectable()
export class CancellationService {
  private readonly logger = new Logger(CancellationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** The guide for a subscription, discovering it first if we've not seen it. */
  async resolveGuide(subscriptionId: string): Promise<ResolvedGuide> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');

    const key = nameKey(subscription.name);
    const fallbackUrl = searchFallback(subscription.name);

    const cached = await this.prisma.cancellationGuide.findUnique({
      where: { nameKey: key },
    });
    if (cached) return { guide: toPayload(cached), fallbackUrl };

    const discovered = await this.discover(subscription.name);
    if (discovered) return { guide: toPayload(discovered), fallbackUrl };

    return { guide: null, fallbackUrl };
  }

  /**
   * Run discovery for a service and cache the result. Returns null when no
   * usable cancellation page could be found. Fire-and-forget safe: every
   * network access is guarded, so a miss just means no guide.
   */
  async discover(name: string): Promise<CancellationGuide | null> {
    const key = nameKey(name);
    const { domain, known } = resolveDomain(name);
    if (!domain) return null;

    const cancelUrl = await findCancelUrl(domain, known);
    if (!cancelUrl) return null;

    // Prefer real steps from a public help page; fall back to whatever the
    // account page exposes; else a generic sequence the user can follow.
    let steps = await extractStepsFromUrl(cancelUrl);
    if (!steps) {
      const helpUrl = await findHelpPage(domain);
      if (helpUrl) steps = await extractStepsFromUrl(helpUrl);
    }
    steps ??= GENERIC_STEPS;

    const guide = await this.prisma.cancellationGuide.upsert({
      where: { nameKey: key },
      create: {
        nameKey: key,
        serviceName: name,
        cancelUrl,
        steps: JSON.stringify(steps),
        lastVerifiedAt: new Date(),
      },
      update: {
        serviceName: name,
        cancelUrl,
        steps: JSON.stringify(steps),
        lastVerifiedAt: new Date(),
      },
    });

    this.logger.log(`Discovered cancel guide for "${name}" → ${cancelUrl}`);
    return guide;
  }

  listGuides(): Promise<CancellationGuide[]> {
    return this.prisma.cancellationGuide.findMany({
      orderBy: { serviceName: 'asc' },
    });
  }
}

/** Map a service name to a domain we can probe. */
function resolveDomain(name: string): { domain: string | null; known: boolean } {
  const key = nameKey(name);
  for (const merchant of MERCHANTS) {
    if (nameKey(merchant.name) === key) {
      return { domain: merchant.domains[0] ?? null, known: true };
    }
  }
  // Fuzzy: the subscription name contains a known brand (e.g. "Netflix Premium").
  for (const merchant of MERCHANTS) {
    const mk = nameKey(merchant.name);
    if (mk.length >= 4 && key.includes(mk)) {
      return { domain: merchant.domains[0] ?? null, known: true };
    }
  }
  // Last resort: guess `name.com`. Verified by the keyword checks downstream.
  if (/^[a-z0-9]{2,}$/.test(key)) return { domain: `${key}.com`, known: false };
  return { domain: null, known: false };
}

function searchFallback(name: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`how to cancel ${name}`)}`;
}

/**
 * First account/subscription path on the domain that actually answers.
 * For known merchants we also accept the domain root as a last resort; for
 * guessed domains we don't, so a parked `.com` never becomes a "guide".
 */
async function findCancelUrl(
  domain: string,
  known: boolean,
): Promise<string | null> {
  const bases = [`https://www.${domain}`, `https://${domain}`];
  for (const base of bases) {
    for (const path of CANDIDATE_PATHS) {
      const url = `${base}${path}`;
      if (await pageExists(url)) return url;
    }
  }
  if (known) {
    for (const base of bases) {
      if (await pageExists(base)) return base;
    }
  }
  return null;
}

/** A public help page describing how to cancel, used to extract real steps. */
async function findHelpPage(domain: string): Promise<string | null> {
  const bases = [`https://www.${domain}`, `https://${domain}`];

  for (const base of bases) {
    const xml = await fetchText(`${base}/sitemap.xml`);
    if (!xml) continue;
    const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1]);
    const candidates = locs
      .filter((u) =>
        /(cancel|unsubscribe|subscription|billing|membership|account|help|support)/i.test(
          u,
        ),
      )
      .sort((a, b) => sitemapScore(b) - sitemapScore(a))
      .slice(0, 4);
    for (const u of candidates) {
      const body = await fetchText(u);
      if (body && hasCancelKeywords(body)) return u;
    }
  }

  for (const base of bases) {
    const home = await fetchText(base);
    if (!home) continue;
    const links = [
      ...home.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi),
    ];
    for (const [, href, text] of links) {
      const label = htmlToText(text).replace(/\s+/g, ' ').trim().toLowerCase();
      if (/(cancel|unsubscribe|subscription|membership|billing)/.test(label)) {
        const abs = new URL(href, base).toString();
        const body = await fetchText(abs);
        if (body && hasCancelKeywords(body)) return abs;
      }
    }
  }
  return null;
}

/** True when the URL answers with something other than a 404/410/5xx. */
async function pageExists(url: string): Promise<boolean> {
  const status = await fetchStatus(url);
  return status !== null && status !== 404 && status !== 410 && status < 500;
}

async function fetchStatus(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { 'User-Agent': USER_AGENT },
    });
    return res.status;
  } catch {
    return null;
  }
}

async function extractStepsFromUrl(url: string): Promise<string[] | null> {
  const html = await fetchText(url);
  return html ? extractStepsFromHtml(html) : null;
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function toPayload(g: CancellationGuide): CancelGuidePayload {
  let steps: string[] = [];
  try {
    const parsed = JSON.parse(g.steps);
    if (Array.isArray(parsed)) steps = parsed.filter((s) => typeof s === 'string');
  } catch {
    steps = [];
  }
  return { id: g.id, serviceName: g.serviceName, cancelUrl: g.cancelUrl, steps };
}

/** Pull a short set of steps out of a page, or null when none are obvious. */
function extractStepsFromHtml(html: string): string[] | null {
  const list = html.match(/<(ol|ul)\b[^>]*>([\s\S]*?)<\/\1>/i);
  if (list) {
    const items = [...list[2].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
      .map((m) => htmlToText(m[1]).replace(/\s+/g, ' ').trim())
      .filter((s) => s.length > 0 && s.length < 220);
    if (items.length >= 2) return items.slice(0, 6);
  }
  const headings = [...html.matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/gi)]
    .map((m) => htmlToText(m[1]).replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 0 && s.length < 220);
  if (headings.length >= 2) return headings.slice(0, 6);
  return null;
}

function hasCancelKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return CANCEL_KEYWORDS.some((k) => lower.includes(k));
}

function sitemapScore(url: string): number {
  const u = url.toLowerCase();
  let s = 0;
  if (/cancel|unsubscribe/.test(u)) s += 3;
  if (/subscription|membership|billing/.test(u)) s += 2;
  if (/account|help|support/.test(u)) s += 1;
  return s;
}
