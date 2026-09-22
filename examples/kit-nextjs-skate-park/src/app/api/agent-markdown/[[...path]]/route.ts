import type { NextRequest } from 'next/server';

import { htmlToMarkdown } from 'lib/agent-markdown/html-to-markdown';
import { renderAgentPageAsHtml } from 'lib/agent-markdown/render-agent-page';

export async function GET(
  request: NextRequest
): Promise<Response> {
  console.log(
    'MARKDOWN HANDLER HIT',
    request.nextUrl.pathname,
    'Accept:',
    request.headers.get('accept'),
    'User-Agent:',
    request.headers.get('user-agent')
  );

  // This is an internal implementation route.
  // It should only be entered through the Accept: text/markdown rewrite.
  if (!acceptsMarkdown(request)) {
    return new Response('Not Found', {
      status: 404,
    });
  }

  // Important:
  // Use the original public pathname from the request.
  // Do not reconstruct it from route params, because Sitecore's internal
  // routing may have injected site/locale segments there.
  const originalPathname = request.nextUrl.pathname;

  console.log('Original pathname:', originalPathname);

  try {
    const htmlResponse = await renderAgentPageAsHtml(
      request,
      originalPathname
    );

    const contentType = htmlResponse.headers.get('content-type') ?? '';

    console.log(
      'Agent HTML response:',
      htmlResponse.status,
      contentType
    );

    // Preserve failures from the original page instead of turning them into
    // a successful Markdown response.
    if (!htmlResponse.ok) {
      const body = await htmlResponse.text();

      return new Response(body, {
        status: htmlResponse.status,
        headers: {
          'Content-Type': contentType || 'text/plain; charset=utf-8',
          'Cache-Control': 'private, no-store',
          Vary: 'Accept, User-Agent',
        },
      });
    }

    if (!contentType.includes('text/html')) {
      return new Response(
        `Expected the agent render to return HTML, but received "${contentType || 'unknown'}".`,
        {
          status: 502,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'private, no-store',
            Vary: 'Accept, User-Agent',
          },
        }
      );
    }

    const html = await htmlResponse.text();
    const markdown = htmlToMarkdown(html);

    return new Response(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        Vary: 'Accept, User-Agent',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Failed to render agent page as Markdown', error);

    return new Response('Failed to render Markdown representation.', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'private, no-store',
        Vary: 'Accept, User-Agent',
      },
    });
  }
}

function acceptsMarkdown(request: NextRequest): boolean {
  return (request.headers.get('accept') ?? '')
    .toLowerCase()
    .includes('text/markdown');
}