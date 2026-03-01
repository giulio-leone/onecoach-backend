/**
 * Edge Config Service (Platform-Agnostic)
 *
 * Unified service for remote configuration management.
 * Uses the ConfigProvider port from the Platform Abstraction Layer.
 *
 * Automatically selects the right adapter based on DEPLOY_PLATFORM:
 * - vercel → @vercel/edge-config
 * - firebase → Firebase Remote Config
 * - vps → Environment variables
 *
 * NOTE: This file does not use 'server-only' because it's exported from lib-core
 * which may be imported in client components. The functions themselves are
 * only executed server-side when called from API routes or server components.
 */

import { PlatformFactory } from './platform';

// ============================================================================
// Public API - Reading
// ============================================================================

/**
 * Read a single config value
 */
export async function getEdgeConfigValue<T = unknown>(key: string): Promise<T | undefined> {
  return PlatformFactory.getConfigProvider().get<T>(key);
}

/**
 * Read all config values
 */
export async function getAllEdgeConfigValues(): Promise<Record<string, unknown>> {
  return PlatformFactory.getConfigProvider().getAll();
}

// ============================================================================
// Public API - Writing
// ============================================================================

/**
 * Set a single config value
 */
export async function setEdgeConfigValue(
  key: string,
  value: unknown
): Promise<{ success: boolean; error?: string }> {
  return PlatformFactory.getConfigProvider().set(key, value);
}

/**
 * Set multiple config values
 */
export async function setEdgeConfigValues(
  items: Array<{ key: string; value: unknown }>
): Promise<{ success: boolean; error?: string }> {
  const record = Object.fromEntries(items.map((item) => [item.key, item.value]));
  return PlatformFactory.getConfigProvider().setMany(record);
}

/**
 * Delete a config value
 */
export async function deleteEdgeConfigValue(
  key: string
): Promise<{ success: boolean; error?: string }> {
  return PlatformFactory.getConfigProvider().delete(key);
}

// ============================================================================
// Service Object (backward-compatible)
// ============================================================================

export const edgeConfigService = {
  async get<T = unknown>(key: string): Promise<T | undefined> {
    return getEdgeConfigValue<T>(key);
  },

  async getAll(): Promise<Record<string, unknown>> {
    return getAllEdgeConfigValues();
  },

  async set(key: string, value: unknown): Promise<void> {
    const result = await setEdgeConfigValue(key, value);
    if (!result.success) throw new Error(result.error || 'Failed to set config value');
  },

  async setMany(items: Record<string, unknown>): Promise<void> {
    const itemsArray = Object.entries(items).map(([key, value]) => ({ key, value }));
    const result = await setEdgeConfigValues(itemsArray);
    if (!result.success) throw new Error(result.error || 'Failed to set config values');
  },

  async delete(key: string): Promise<void> {
    const result = await deleteEdgeConfigValue(key);
    if (!result.success) throw new Error(result.error || 'Failed to delete config value');
  },
};
