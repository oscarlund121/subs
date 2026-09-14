import type { gmail_v1 } from 'googleapis';
import { htmlToText } from '../detections/parser/html.js';

function decode(data: string | null | undefined): string {
  if (!data) return '';
  return Buffer.from(
    data.replace(/-/g, '+').replace(/_/g, '/'),
    'base64',
  ).toString('utf8');
}

/**
 * Pull readable text out of a Gmail message payload.
 *
 * Receipts are typically `multipart/mixed` wrapping `multipart/alternative`,
 * and many are HTML-only — so this walks the whole MIME tree and falls back to
 * converting HTML rather than returning nothing. Attachments are skipped:
 * their bytes are never body text.
 */
export function extractBody(
  payload: gmail_v1.Schema$MessagePart | undefined,
): string {
  const plain: string[] = [];
  const html: string[] = [];

  const walk = (part: gmail_v1.Schema$MessagePart | undefined): void => {
    if (!part) return;

    const mime = part.mimeType ?? '';
    if (!part.filename && part.body?.data) {
      const text = decode(part.body.data);
      if (mime.startsWith('text/plain')) plain.push(text);
      else if (mime.startsWith('text/html')) html.push(text);
      else if (!mime) plain.push(text);
    }

    for (const child of part.parts ?? []) walk(child);
  };

  walk(payload);

  if (plain.some((t) => t.trim())) return plain.join('\n').trim();
  if (html.length) return htmlToText(html.join('\n'));
  return '';
}
