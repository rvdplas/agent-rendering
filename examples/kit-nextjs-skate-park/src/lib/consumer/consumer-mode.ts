import { isAiAgentUserAgent } from './ai-user-agents';

export type ConsumerMode = 'default' | 'agent';

export interface ConsumerContext {
  mode: ConsumerMode;
}

const DEFAULT_CONSUMER_CONTEXT: ConsumerContext = { mode: 'default' };

// Detects consumer mode from the request. User-Agent only for now;
// Accept-header based negotiation (e.g. text/markdown) is a future extension point.
export const detectConsumerMode = (headers: Headers): ConsumerContext => {
  const userAgent = headers.get('user-agent') ?? '';

  return isAiAgentUserAgent(userAgent) ? { mode: 'agent' } : { mode: 'default' };
};

// Reads consumer mode off a Sitecore `page` object without requiring callers
// (e.g. useSitecore() consumers) to know about the app's extended Page type.
export const getConsumerMode = (page: unknown): ConsumerMode => {
  const consumer = (page as { consumer?: ConsumerContext } | undefined)?.consumer;
  return consumer?.mode ?? DEFAULT_CONSUMER_CONTEXT.mode;
};
