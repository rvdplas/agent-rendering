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
  turndown.remove([
    'head',
    'script',
    'style',
    'noscript',
    'template',
  ]);

  turndown.addRule('remove-svg', {
  filter: (node) => node.nodeName === 'SVG',
  replacement: () => '',
});

  const markdown = turndown.turndown(html);

  return normalizeMarkdown(markdown);
}

function normalizeMarkdown(markdown: string): string {
  return markdown
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .concat('\n');
}
