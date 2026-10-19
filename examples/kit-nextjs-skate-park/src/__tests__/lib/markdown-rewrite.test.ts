/** @jest-environment node */

import { advertiseMarkdownRepresentation } from 'lib/agent-markdown/markdown-rewrite';

describe('Markdown representation discovery', () => {
  it.each(['/', '/en/about', '/products?category=audio'])(
    'advertises Markdown at the original public URL %s',
    (path) => {
      const headers = new Headers();

      advertiseMarkdownRepresentation(headers, new URL(path, 'https://example.com'));

      expect(headers.get('Link')).toBe(`<${path}>; rel="alternate"; type="text/markdown"`);
    }
  );

  it('preserves existing links and cache variation', () => {
    const headers = new Headers({ Link: '</style.css>; rel="preload"', Vary: 'RSC, accept' });

    advertiseMarkdownRepresentation(headers, new URL('https://example.com/about'));

    expect(headers.get('Link')).toBe(
      '</style.css>; rel="preload", </about>; rel="alternate"; type="text/markdown"'
    );
    expect(headers.get('Vary')).toBe('RSC, accept');
  });

  it('preserves wildcard cache variation', () => {
    const headers = new Headers({ Vary: '*' });

    advertiseMarkdownRepresentation(headers, new URL('https://example.com/about'));

    expect(headers.get('Vary')).toBe('*');
  });

  it.each([
    '/api/data',
    '/_next/static/chunk.js',
    '/sitecore/api',
    '/healthz',
    '/ai/summary.json',
    '/agent-markdown/about',
    '/.well-known/ai.txt',
    '/-/media/image',
    '/robots.txt',
    '/llms.txt',
    '/manual.pdf',
  ])(
    'does not advertise Markdown for non-page route %s',
    (path) => {
      const headers = new Headers();

      advertiseMarkdownRepresentation(headers, new URL(path, 'https://example.com'));

      expect(headers.has('Link')).toBe(false);
      expect(headers.has('Vary')).toBe(false);
    }
  );
});