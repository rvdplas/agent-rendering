import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

/**
 * Converts the fully rendered agent HTML into Markdown.
 *
 * Important:
 * - Component flattening/enrichment happens BEFORE this function.
 * - This function is deliberately unaware of Sitecore layout data.
 * - GFM is enabled so tables and other useful structures survive conversion.
 */
export function htmlToMarkdown(html: string): string {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
  });

  turndown.use(gfm);

  // These elements never add useful agent-readable content.
  // Note: Turndown's Node-side HTML parser doesn't nest title/meta/link
  // under a real <head> element, so remove(['head']) alone does not
  // cascade to them (e.g. <title>'s text leaks as the first output line).
  turndown.remove([
    'head',
    'title',
    'meta',
    'link',
    'base',
    'script',
    'style',
    'noscript',
    'template',
  ]);

  turndown.addRule('remove-svg', {
  filter: (node) => node.nodeName === 'SVG',
  replacement: () => '',
});

  const markdown = turndown.turndown(stripHead(html));

  return normalizeMarkdown(markdown);
}

// Belt-and-suspenders: strip the <head> block outright before it ever
// reaches Turndown, since Turndown's own head handling is unreliable in Node.
function stripHead(html: string): string {
  return html.replace(/<head[^>]*>[\s\S]*?<\/head>/i, '');
}

function normalizeMarkdown(markdown: string): string {
  return markdown
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .concat('\n');
}
