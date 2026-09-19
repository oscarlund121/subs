import type { Cycle } from './types.js';

export interface Merchant {
  name: string;
  category: string;
  /** Registrable domains the billing mail arrives from. */
  domains: string[];
  /** Used when the email states a price but no billing period. */
  defaultCycle?: Cycle;
  /**
   * Product names to look for in the subject/body when one sender bills for
   * several services (Apple, Google). Longest match wins.
   */
  products?: string[];
}

/**
 * Known subscription senders. A hit here is the single strongest signal that
 * an email is subscription billing, and it gives us a clean service name and
 * category instead of whatever the From header happens to say.
 *
 * Nowhere near exhaustive — it covers the common Danish/EU/US services and is
 * meant to grow. Everything else falls back to sender-domain heuristics.
 */
export const MERCHANTS: Merchant[] = [
  // Streaming — video
  { name: 'Netflix', category: 'Streaming', domains: ['netflix.com'], defaultCycle: 'monthly' },
  { name: 'Disney+', category: 'Streaming', domains: ['disneyplus.com', 'disney.com'], defaultCycle: 'monthly' },
  { name: 'HBO Max', category: 'Streaming', domains: ['hbomax.com', 'max.com', 'wbd.com'], defaultCycle: 'monthly' },
  { name: 'Viaplay', category: 'Streaming', domains: ['viaplay.com', 'viaplay.dk'], defaultCycle: 'monthly' },
  { name: 'TV 2 Play', category: 'Streaming', domains: ['tv2.dk', 'play.tv2.dk'], defaultCycle: 'monthly' },
  { name: 'Nordisk Film+', category: 'Streaming', domains: ['nordiskfilmplus.dk'], defaultCycle: 'monthly' },
  { name: 'Amazon Prime Video', category: 'Streaming', domains: ['primevideo.com'], defaultCycle: 'monthly' },
  { name: 'YouTube Premium', category: 'Streaming', domains: ['youtube.com'], defaultCycle: 'monthly' },
  { name: 'Curiosity Stream', category: 'Streaming', domains: ['curiositystream.com'], defaultCycle: 'yearly' },
  { name: 'Crunchyroll', category: 'Streaming', domains: ['crunchyroll.com'], defaultCycle: 'monthly' },

  // Music & audio
  { name: 'Spotify', category: 'Music', domains: ['spotify.com'], defaultCycle: 'monthly' },
  { name: 'Tidal', category: 'Music', domains: ['tidal.com'], defaultCycle: 'monthly' },
  { name: 'SoundCloud', category: 'Music', domains: ['soundcloud.com'], defaultCycle: 'monthly' },
  { name: 'Podimo', category: 'Music', domains: ['podimo.com'], defaultCycle: 'monthly' },
  { name: 'Storytel', category: 'Music', domains: ['storytel.com', 'storytel.dk'], defaultCycle: 'monthly' },
  { name: 'Mofibo', category: 'Music', domains: ['mofibo.com'], defaultCycle: 'monthly' },
  { name: 'Audible', category: 'Music', domains: ['audible.com', 'audible.co.uk'], defaultCycle: 'monthly' },

  // Apple and Google bill many products from one domain — see `products`.
  {
    name: 'Apple',
    category: 'Software',
    domains: ['apple.com'],
    defaultCycle: 'monthly',
    products: [
      'Apple TV+', 'Apple Music', 'Apple Arcade', 'Apple One',
      'Apple Fitness+', 'Apple News+', 'iCloud+', 'iCloud',
    ],
  },

  // Software & productivity
  { name: 'Adobe Creative Cloud', category: 'Software', domains: ['adobe.com'], defaultCycle: 'monthly' },
  { name: 'Microsoft 365', category: 'Software', domains: ['microsoft.com'], defaultCycle: 'yearly' },
  {
    name: 'Google',
    category: 'Cloud',
    domains: ['google.com'],
    defaultCycle: 'monthly',
    products: ['Google One', 'YouTube Premium', 'Google Workspace', 'Google Play Pass', 'Nest Aware'],
  },
  { name: 'Dropbox', category: 'Cloud', domains: ['dropbox.com'], defaultCycle: 'monthly' },
  { name: 'Notion', category: 'Productivity', domains: ['notion.so', 'makenotion.com'], defaultCycle: 'monthly' },
  { name: 'Slack', category: 'Productivity', domains: ['slack.com'], defaultCycle: 'monthly' },
  { name: 'Figma', category: 'Software', domains: ['figma.com'], defaultCycle: 'monthly' },
  { name: 'Canva', category: 'Software', domains: ['canva.com'], defaultCycle: 'yearly' },
  { name: '1Password', category: 'Software', domains: ['1password.com', 'agilebits.com'], defaultCycle: 'yearly' },
  { name: 'LastPass', category: 'Software', domains: ['lastpass.com'], defaultCycle: 'yearly' },
  { name: 'NordVPN', category: 'Software', domains: ['nordvpn.com'], defaultCycle: 'yearly' },
  { name: 'ExpressVPN', category: 'Software', domains: ['expressvpn.com'], defaultCycle: 'yearly' },
  { name: 'Evernote', category: 'Productivity', domains: ['evernote.com'], defaultCycle: 'yearly' },
  { name: 'Todoist', category: 'Productivity', domains: ['todoist.com', 'doist.com'], defaultCycle: 'yearly' },

  // Developer & AI
  { name: 'GitHub', category: 'Developer', domains: ['github.com'], defaultCycle: 'monthly' },
  { name: 'Vercel', category: 'Developer', domains: ['vercel.com'], defaultCycle: 'monthly' },
  { name: 'Linear', category: 'Developer', domains: ['linear.app'], defaultCycle: 'monthly' },
  { name: 'JetBrains', category: 'Developer', domains: ['jetbrains.com'], defaultCycle: 'yearly' },
  { name: 'Claude', category: 'AI', domains: ['anthropic.com'], defaultCycle: 'monthly' },
  { name: 'ChatGPT', category: 'AI', domains: ['openai.com'], defaultCycle: 'monthly' },
  { name: 'Midjourney', category: 'AI', domains: ['midjourney.com'], defaultCycle: 'monthly' },

  // Gaming
  { name: 'PlayStation Plus', category: 'Gaming', domains: ['playstation.com', 'sony.com'], defaultCycle: 'monthly' },
  { name: 'Xbox Game Pass', category: 'Gaming', domains: ['xbox.com'], defaultCycle: 'monthly' },
  { name: 'Nintendo Switch Online', category: 'Gaming', domains: ['nintendo.com', 'nintendo.net'], defaultCycle: 'yearly' },
  { name: 'Steam', category: 'Gaming', domains: ['steampowered.com'], defaultCycle: 'monthly' },

  // Fitness & health
  { name: 'Strava', category: 'Fitness', domains: ['strava.com'], defaultCycle: 'yearly' },
  { name: 'Whoop', category: 'Fitness', domains: ['whoop.com'], defaultCycle: 'monthly' },
  { name: 'Fitness World', category: 'Fitness', domains: ['fitnessworld.com', 'fitnessworld.dk'], defaultCycle: 'monthly' },
  { name: 'SATS', category: 'Fitness', domains: ['sats.com', 'sats.dk'], defaultCycle: 'monthly' },
  { name: 'Headspace', category: 'Fitness', domains: ['headspace.com'], defaultCycle: 'monthly' },
  { name: 'Calm', category: 'Fitness', domains: ['calm.com'], defaultCycle: 'yearly' },

  // News & reading
  { name: 'Medium', category: 'News', domains: ['medium.com'], defaultCycle: 'monthly' },
  { name: 'The New York Times', category: 'News', domains: ['nytimes.com'], defaultCycle: 'monthly' },
  { name: 'Politiken', category: 'News', domains: ['politiken.dk'], defaultCycle: 'monthly' },
  { name: 'Berlingske', category: 'News', domains: ['berlingske.dk'], defaultCycle: 'monthly' },
  { name: 'Zetland', category: 'News', domains: ['zetland.dk'], defaultCycle: 'monthly' },
  { name: 'Substack', category: 'News', domains: ['substack.com'], defaultCycle: 'monthly' },

  // Telecom & utilities
  { name: 'Telenor', category: 'Telecom', domains: ['telenor.dk'], defaultCycle: 'monthly' },
  { name: 'TDC', category: 'Telecom', domains: ['tdc.dk'], defaultCycle: 'monthly' },
  { name: 'Telia', category: 'Telecom', domains: ['telia.dk'], defaultCycle: 'monthly' },
  { name: '3 (Tre)', category: 'Telecom', domains: ['3.dk'], defaultCycle: 'monthly' },
];

/** Mail-infrastructure subdomains that say nothing about the brand. */
const NOISE_SUBDOMAINS = new Set([
  'mail', 'email', 'e', 'em', 'news', 'newsletter', 'notifications', 'notify',
  'billing', 'invoice', 'receipts', 'no-reply', 'noreply', 'noreply2', 'send',
  'smtp', 'mailer', 'info', 'support', 'account', 'accounts', 'my', 'secure',
  'go', 'link', 'links', 'cs', 'srv', 'mktg', 'marketing', 'reply', 't', 'sg',
]);

/** Pull the domain out of a From header such as `Netflix <info@netflix.com>`. */
export function extractDomain(from: string): string | null {
  const match = from.match(/[\w.+-]+@([\w.-]+\.[a-z]{2,})/i);
  return match ? match[1].toLowerCase() : null;
}

/** Pull the display name out of `Netflix <info@netflix.com>`. */
export function extractDisplayName(from: string): string | null {
  const withAngle = from.match(/^\s*"?([^"<]+?)"?\s*</);
  if (withAngle) {
    const name = withAngle[1].trim();
    return name.length ? name : null;
  }
  return null;
}

/**
 * Strip mail subdomains and the public suffix to get a brandable label:
 * `email.news.spotify.com` -> `spotify`, `mail.tv2.dk` -> `tv2`.
 */
export function brandFromDomain(domain: string): string | null {
  const parts = domain.split('.').filter(Boolean);
  if (parts.length < 2) return null;

  // Drop the public suffix — one label, or two for co.uk / com.au style.
  const suffixLen =
    parts.length >= 3 && /^(co|com|org|net|gov|ac)$/.test(parts[parts.length - 2])
      ? 2
      : 1;
  const labels = parts.slice(0, parts.length - suffixLen);

  for (let i = labels.length - 1; i >= 0; i--) {
    const label = labels[i];
    if (!NOISE_SUBDOMAINS.has(label)) return label;
  }
  return labels[labels.length - 1] ?? null;
}

/**
 * Multi-product / notification-heavy senders whose *billing* mail always
 * carries an explicit "receipt" / "invoice" / "subscription" subject. Pulling
 * these into the watcher via `from:` would only drag in their security-alert,
 * notification and marketing mail (all of which the parser then has to spend a
 * fetch + parse rejecting). They stay reachable through the subject clause.
 */
export const QUERY_UMBRELLA_DOMAINS = new Set([
  'google.com',
  'microsoft.com',
  'apple.com',
  'youtube.com',
  'github.com',
  'sony.com',
  'playstation.com',
  'xbox.com',
  'nintendo.com',
  'nintendo.net',
  'steampowered.com',
]);

/**
 * Every billing domain the watcher should pull regardless of subject, deduped
 * and free of the umbrella platforms above. Kept in lockstep with `MERCHANTS`
 * so adding a merchant automatically widens the Gmail query.
 */
export function merchantQueryDomains(): string[] {
  return [...new Set(MERCHANTS.flatMap((m) => m.domains))]
    .filter((d) => !QUERY_UMBRELLA_DOMAINS.has(d))
    .sort();
}

/** Find the registry entry whose domain matches (or is a parent of) the sender. */
export function matchMerchant(from: string): Merchant | null {
  const domain = extractDomain(from);
  if (!domain) return null;

  let best: Merchant | null = null;
  let bestLen = 0;
  for (const merchant of MERCHANTS) {
    for (const candidate of merchant.domains) {
      const hit = domain === candidate || domain.endsWith(`.${candidate}`);
      if (hit && candidate.length > bestLen) {
        best = merchant;
        bestLen = candidate.length;
      }
    }
  }
  return best;
}

/**
 * For senders that bill several products, pick the specific one named in the
 * email. Longest match wins so `Apple TV+` beats a bare `Apple`.
 */
export function refineServiceName(
  merchant: Merchant,
  text: string,
): string {
  if (!merchant.products?.length) return merchant.name;
  const haystack = text.toLowerCase();
  let best: string | null = null;
  for (const product of merchant.products) {
    if (haystack.includes(product.toLowerCase())) {
      if (!best || product.length > best.length) best = product;
    }
  }
  return best ?? merchant.name;
}
