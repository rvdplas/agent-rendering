import type { NextRequest } from 'next/server';

export async function renderAgentPageAsHtml(
  request: NextRequest,
  originalPathname: string
): Promise<Response> {
  const targetUrl = new URL(
    originalPathname,
    request.nextUrl.origin
  );

  targetUrl.search = request.nextUrl.search;

  console.log('TargetURL:', targetUrl.href);

  const headers = new Headers();

  copyHeader(request, headers, 'user-agent');
  copyHeader(request, headers, 'accept-language');
  copyHeader(request, headers, 'cookie');
  copyHeader(request, headers, 'authorization');

  // Force the internal request through the normal HTML rendering path.
  headers.set('accept', 'text/html,application/xhtml+xml');

  // Prevent this internal request from being rewritten back
  // into the Markdown handler.
  headers.set('x-agent-markdown-render', '1');

  return fetch(targetUrl, {
    method: 'GET',
    headers,
    cache: 'no-store',
    redirect: 'follow',
  });
}

function copyHeader(
  request: NextRequest,
  target: Headers,
  name: string
): void {
  const value = request.headers.get(name);

  if (value) {
    target.set(name, value);
  }
}