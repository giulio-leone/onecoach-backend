/**
 * Environment Variables Helper
 *
 * Provides static access to environment variables for Vercel compatibility.
 * Dynamic access like process.env[key] doesn't work on Vercel because
 * Next.js inlines env vars at build time only for static property access.
 */

/**
 * Get AI Provider API Key
 * Uses static property access for Vercel compatibility
 */
export function getAIProviderKey(provider: string): string | undefined {
  switch (provider.toLowerCase()) {
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY;
    case 'openai':
      return process.env.OPENAI_API_KEY;
    case 'google':
      // Support both GOOGLE_AI_API_KEY and GOOGLE_GENERATIVE_AI_API_KEY
      return process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    case 'xai':
      return process.env.XAI_API_KEY;
    case 'openrouter':
      return process.env.OPENROUTER_API_KEY;
    case 'minimax':
      return process.env.MINIMAX_API_KEY;
    default:
      return undefined;
  }
}

/**
 * Get OpenRouter configuration
 */
export function getOpenRouterConfig() {
  return {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: process.env.OPENROUTER_BASE_URL,
    siteUrl: process.env.OPENROUTER_SITE_URL,
    appName: process.env.OPENROUTER_APP_NAME,
  };
}

/**
 * Get all configured AI provider keys
 */
export function getAllAIProviderKeys() {
  return {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    google: process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    xai: process.env.XAI_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
  };
}

/**
 * Check if any AI provider key is configured
 */
export function hasAnyAIProviderKey(): boolean {
  const keys = getAllAIProviderKeys();
  return Object.values(keys).some((key) => Boolean(key));
}
