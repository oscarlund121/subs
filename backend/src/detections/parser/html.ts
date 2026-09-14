const BLOCK_TAGS =
  /<\/?(?:p|div|br|tr|td|th|li|ul|ol|table|h[1-6]|section|header|footer)\b[^>]*>/gi;

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  euro: '€', pound: '£', dollar: '$', hellip: '…', mdash: '—', ndash: '–',
  aring: 'å', Aring: 'Å', oslash: 'ø', Oslash: 'Ø', aelig: 'æ', AElig: 'Æ',
};

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name: string) => ENTITIES[name] ?? match);
}

/**
 * Flatten an HTML email into plain text good enough to run regexes over.
 * Deliberately dependency-free: we only need readable text, not a DOM.
 */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      // Anything inside these carries no reader-visible text.
      .replace(/<(script|style|head|title)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(BLOCK_TAGS, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t  ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
