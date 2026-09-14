import { describe, expect, it } from 'vitest';
import { extractBody } from './mime.js';

const b64 = (text: string) =>
  Buffer.from(text, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

describe('extractBody', () => {
  it('reads a simple text/plain body', () => {
    expect(
      extractBody({ mimeType: 'text/plain', body: { data: b64('Total 129 kr') } }),
    ).toBe('Total 129 kr');
  });

  it('finds text/plain nested inside multipart/alternative', () => {
    // The shape real receipts arrive in: mixed > alternative > plain + html.
    const body = extractBody({
      mimeType: 'multipart/mixed',
      parts: [
        {
          mimeType: 'multipart/alternative',
          parts: [
            { mimeType: 'text/plain', body: { data: b64('Next billing date: 5 April 2026') } },
            { mimeType: 'text/html', body: { data: b64('<p>ignored</p>') } },
          ],
        },
      ],
    });

    expect(body).toBe('Next billing date: 5 April 2026');
  });

  it('falls back to converting HTML when there is no plain part', () => {
    const html =
      '<html><head><style>p{color:red}</style></head><body>' +
      '<p>Total charged</p><p>129,00&nbsp;kr</p></body></html>';

    const body = extractBody({
      mimeType: 'multipart/alternative',
      parts: [{ mimeType: 'text/html', body: { data: b64(html) } }],
    });

    expect(body).toContain('Total charged');
    expect(body).toContain('129,00 kr');
    expect(body).not.toContain('color:red');
    expect(body).not.toContain('<p>');
  });

  it('ignores attachments', () => {
    const body = extractBody({
      mimeType: 'multipart/mixed',
      parts: [
        { mimeType: 'text/plain', body: { data: b64('See invoice attached.') } },
        {
          mimeType: 'application/pdf',
          filename: 'invoice.pdf',
          body: { data: b64('%PDF-1.4 binary junk') },
        },
      ],
    });

    expect(body).toBe('See invoice attached.');
  });

  it('prefers HTML over an empty plain part', () => {
    const body = extractBody({
      mimeType: 'multipart/alternative',
      parts: [
        { mimeType: 'text/plain', body: { data: b64('   ') } },
        { mimeType: 'text/html', body: { data: b64('<div>Renews on 1 May 2026</div>') } },
      ],
    });

    expect(body).toBe('Renews on 1 May 2026');
  });

  it('returns empty string for a payload with no body', () => {
    expect(extractBody(undefined)).toBe('');
    expect(extractBody({ mimeType: 'multipart/mixed', parts: [] })).toBe('');
  });
});
