/**
 * Add this rewrite to your existing next.config.ts `rewrites()` result.
 *
 * Next.js recommends a header-based rewrite for straightforward HTTP content
 * negotiation. Proxy is only needed when the negotiation logic becomes more
 * advanced.
 */
export const markdownContentNegotiationRewrite = {
  source: '/:path*',
  destination: '/__agent-markdown/:path*',
  has: [
    {
      type: 'header',
      key: 'accept',
      value: '(.*)text/markdown(.*)',
    },
  ],
} as const;
