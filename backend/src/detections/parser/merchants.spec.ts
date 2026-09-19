import { describe, expect, it } from 'vitest';
import { MERCHANTS, merchantQueryDomains, QUERY_UMBRELLA_DOMAINS } from './merchants.js';

describe('merchantQueryDomains', () => {
  it('stays in lockstep with MERCHANTS', () => {
    // Every domain the query knows about must come from the registry, so
    // adding a merchant widens the Gmail query automatically.
    const registered = new Set(MERCHANTS.flatMap((m) => m.domains));
    for (const d of merchantQueryDomains()) {
      expect(registered.has(d)).toBe(true);
    }
  });

  it('includes a known billing domain', () => {
    expect(merchantQueryDomains()).toContain('netflix.com');
  });

  it('excludes umbrella platforms whose billing mail is subject-worded', () => {
    const domains = merchantQueryDomains();
    for (const d of QUERY_UMBRELLA_DOMAINS) {
      expect(domains).not.toContain(d);
    }
  });

  it('is deduped and sorted', () => {
    const domains = merchantQueryDomains();
    expect(new Set(domains).size).toBe(domains.length);
    expect([...domains].sort()).toEqual(domains);
  });
});
