// Known AI-agent User-Agent substrings, distinct from the search-engine crawlers
// allowed in src/app/api/robots/route.ts (those must not trigger agent mode).
export const AI_AGENT_USER_AGENTS = [
  'GPTBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'FacebookBot',
  'cohere-ai',
] as const;

export const isAiAgentUserAgent = (userAgent: string): boolean => {
  if (!userAgent) {
    return false;
  }

  const normalized = userAgent.toLowerCase();
  return AI_AGENT_USER_AGENTS.some((agent) => normalized.includes(agent.toLowerCase()));
};
