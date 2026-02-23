/**
 * Environment Variables Helper - Server Only
 *
 * Server-side functions that may use Edge Config or other server-only features.
 * This file should only be imported in server components or API routes.
 */

import 'server-only';
import { getAIProviderKey } from './env';

/**
 * Get AI Provider API Key (Async, checks Edge Config first)
 * Server-only function that can access Edge Config
 *
 * Note: Edge Config access is handled by lib-core, this function
 * provides a simple fallback to static env vars for lib-config usage
 */
export async function getDynamicAIProviderKey(provider: string): Promise<string | undefined> {
  // For now, just use static env vars
  // Edge Config access should be done through lib-core services
  return getAIProviderKey(provider);
}
