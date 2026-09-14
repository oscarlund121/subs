/**
 * Normalise a service name so the same merchant is recognised across receipts
 * that spell it differently: `Apple TV+`, `apple tv +` and `APPLE TV+` all
 * collapse to `appletv`.
 */
export function nameKey(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
