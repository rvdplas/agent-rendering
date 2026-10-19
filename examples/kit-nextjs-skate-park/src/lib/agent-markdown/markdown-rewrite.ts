/**
 * Add this rewrite to your existing next.config.ts `rewrites()` result.
 *
 * Next.js recommends a header-based rewrite for straightforward HTTP content
 * negotiation. Proxy is only needed when the negotiation logic becomes more
 * advanced.
 */
export const markdownContentNegotiationRewrite = {
  source: '/:path*',
  destination: '/agent-markdown/:path*',
  has: [
    {
      type: 'header',
      key: 'accept',
      value: '(.*)text/markdown(.*)',
    },
  ],
} as const;

export function advertiseMarkdownRepresentation(headers: Headers, url: URL): void {
  if (
    /^\/(?:api|_next|sitecore|healthz|ai|agent-markdown|\.well-known|-)(?:\/|$)/.test(
      url.pathname
    ) ||
    /\.[^/]+$/.test(url.pathname)
  ) {
    return;
  }

  const alternate = `<${url.pathname}${url.search}>; rel="alternate"; type="text/markdown"`;
  headers.append('Link', alternate);
}
