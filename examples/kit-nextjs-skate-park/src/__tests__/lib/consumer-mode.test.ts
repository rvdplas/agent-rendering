import { detectConsumerMode } from 'lib/consumer/consumer-mode';

const headersWithUserAgent = (userAgent: string): Headers =>
  new Headers({ 'user-agent': userAgent });

describe('detectConsumerMode', () => {
  it('returns default for a normal browser User-Agent', () => {
    const headers = headersWithUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
    );
    expect(detectConsumerMode(headers)).toEqual({ mode: 'default' });
  });

  it.each([
    'GPTBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-Web',
    'anthropic-ai',
    'PerplexityBot',
    'Google-Extended',
    'FacebookBot',
    'cohere-ai',
  ])('returns agent for known AI User-Agent "%s"', (userAgent) => {
    expect(detectConsumerMode(headersWithUserAgent(userAgent))).toEqual({ mode: 'agent' });
  });

  it.each(['Googlebot', 'Bingbot', 'DuckDuckBot', 'Slurp', 'YandexBot', 'Baiduspider'])(
    'returns default for search-engine crawler "%s" (excluded from agent mode)',
    (userAgent) => {
      expect(detectConsumerMode(headersWithUserAgent(userAgent))).toEqual({ mode: 'default' });
    }
  );

  it('returns default when the User-Agent header is missing', () => {
    expect(detectConsumerMode(new Headers())).toEqual({ mode: 'default' });
  });
});
