import type { NextRequest } from 'next/server';

import { htmlToMarkdown } from 'lib/agent-markdown/html-to-markdown';
import { renderAgentPageAsHtml } from 'lib/agent-markdown/render-agent-page';

type RouteParams = {
  path?: string[];
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
): Promise<Response> {
  // This route is an implementation detail. The normal entry point is the
  // original public URL with Accept: text/markdown.
  if (!acceptsMarkdown(request)) {
    return new Response('Not found', { status: 404 });
  }

  const { path = [] } = await context.params;
  const originalPathname = `/${path.map(encodeURIComponent).join('/')}`;

  try {
    const htmlResponse = await renderAgentPageAsHtml(
      request,
      originalPathname
    );

    const contentType = htmlResponse.headers.get('content-type') ?? '';

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

        // Required for content negotiation. User-Agent is included because
        // your HTML representation is selected by agent detection.
        Vary: 'Accept, User-Agent',

        // Safe initial behaviour while the agent representation may contain
        // request-time enrichment. Relax this later if you establish a
        // suitable caching/revalidation strategy.
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
