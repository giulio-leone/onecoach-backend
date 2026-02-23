import { createClient } from '@vercel/edge-config';
import { logError } from '@giulio-leone/lib-shared';

/**
 * Edge Config Service
 *
 * Servizio unificato per gestire Vercel Edge Config.
 * Permette di aggiornare configurazioni e secrets dinamicamente senza redeploy.
 *
 * NOTE: This file does not use 'server-only' because it's exported from lib-core
 * which may be imported in client components. The functions themselves are
 * only executed server-side when called from API routes or server components.
 * Files that import this directly (like feature-flags.service.ts) have 'server-only'.
 */

// Singleton client
let edgeConfigClient: ReturnType<typeof createClient> | null = null;

/**
 * Ottiene il client Edge Config (singleton pattern)
 */
function getClient() {
  if (edgeConfigClient) {
    return edgeConfigClient;
  }

  const connectionString = process.env.EDGE_CONFIG;
  if (!connectionString) {
    throw new Error(
      'EDGE_CONFIG environment variable is not set. Please configure Edge Config in Vercel Dashboard.'
    );
  }

  try {
    edgeConfigClient = createClient(connectionString);
    return edgeConfigClient;
  } catch (error: unknown) {
    logError('Failed to create Edge Config client', error);
    throw new Error('Failed to initialize Edge Config client');
  }
}

/**
 * Estrae l'ID del config dalla connection string
 */
function extractConfigId(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const configId = url.pathname.split('/').filter(Boolean).pop();
    if (!configId) {
      throw new Error('Invalid EDGE_CONFIG format');
    }
    return configId;
  } catch (_error: unknown) {
    throw new Error('Invalid EDGE_CONFIG format. Expected URL with config ID.');
  }
}

/**
 * Valida le variabili d'ambiente necessarie per operazioni di scrittura
 *
 * NOTA: EDGE_CONFIG_AUTH_TOKEN è diverso da VERCEL_API_TOKEN:
 * - EDGE_CONFIG_AUTH_TOKEN: Token di scrittura per Edge Config (usato dal codice runtime)
 * - VERCEL_API_TOKEN: Token API Vercel generale (usato solo dagli script di setup)
 */
function validateWriteEnv(): { authToken: string; configId: string } {
  const authToken = process.env.EDGE_CONFIG_AUTH_TOKEN;
  const connectionString = process.env.EDGE_CONFIG;

  if (!authToken) {
    throw new Error(
      'EDGE_CONFIG_AUTH_TOKEN is not set. Required for write operations. ' +
        'Configure it in Vercel Dashboard > Project Settings > Environment Variables.'
    );
  }

  if (!connectionString) {
    throw new Error(
      'EDGE_CONFIG is not set. Edge Config connection string is required. ' +
        'It should be automatically added when Edge Config is created in Vercel Dashboard.'
    );
  }

  return { authToken, configId: extractConfigId(connectionString) };
}

/**
 * Esegue una richiesta PATCH all'API Vercel per aggiornare Edge Config
 */
async function patchEdgeConfigItems(
  configId: string,
  authToken: string,
  items: Array<{ operation: string; key: string; value?: unknown }>
): Promise<void> {
  const response = await fetch(`https://api.vercel.com/v1/edge-config/${configId}/items`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logError('Failed to update Edge Config', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(`Failed to update Edge Config: ${response.statusText}`);
  }
}

// ============================================================================
// Public API - Lettura
// ============================================================================

/**
 * Legge un valore da Edge Config
 */
export async function getEdgeConfigValue<T = unknown>(key: string): Promise<T | undefined> {
  try {
    const client = getClient();
    return await client.get<T>(key);
  } catch (error: unknown) {
    logError(`Failed to get Edge Config value for key: ${key}`, error);
    return undefined;
  }
}

/**
 * Legge tutti i valori da Edge Config
 */
export async function getAllEdgeConfigValues(): Promise<Record<string, unknown>> {
  try {
    const client = getClient();
    return (await client.getAll()) || {};
  } catch (error: unknown) {
    logError('Failed to get all Edge Config values', error);
    return {};
  }
}

// ============================================================================
// Public API - Scrittura
// ============================================================================

/**
 * Aggiorna un valore in Edge Config
 */
export async function setEdgeConfigValue(
  key: string,
  value: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const { authToken, configId } = validateWriteEnv();
    await patchEdgeConfigItems(configId, authToken, [{ operation: 'update', key, value }]);
    return { success: true };
  } catch (error: unknown) {
    logError(`Failed to set Edge Config value for key: ${key}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Aggiorna multiple valori in Edge Config
 */
export async function setEdgeConfigValues(
  items: Array<{ key: string; value: unknown }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { authToken, configId } = validateWriteEnv();
    await patchEdgeConfigItems(
      configId,
      authToken,
      items.map((item: { key: string; value: unknown }) => ({
        operation: 'update',
        key: item.key,
        value: item.value,
      }))
    );
    return { success: true };
  } catch (error: unknown) {
    logError('Failed to set multiple Edge Config values', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Elimina un valore da Edge Config
 */
export async function deleteEdgeConfigValue(
  key: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { authToken, configId } = validateWriteEnv();
    await patchEdgeConfigItems(configId, authToken, [{ operation: 'delete', key }]);
    return { success: true };
  } catch (error: unknown) {
    logError(`Failed to delete Edge Config value for key: ${key}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Service Object (per compatibilità con API routes esistenti)
// ============================================================================

/**
 * Edge Config Service Object
 * Wrapper per compatibilità con codice esistente
 */
export const edgeConfigService = {
  async get<T = unknown>(key: string): Promise<T | undefined> {
    return getEdgeConfigValue<T>(key);
  },

  async getAll(): Promise<Record<string, unknown>> {
    return getAllEdgeConfigValues();
  },

  async set(key: string, value: unknown): Promise<void> {
    const result = await setEdgeConfigValue(key, value);
    if (!result.success) {
      throw new Error(result.error || 'Failed to set Edge Config value');
    }
  },

  async setMany(items: Record<string, unknown>): Promise<void> {
    const itemsArray = Object.entries(items).map(([key, value]) => ({ key, value }));
    const result = await setEdgeConfigValues(itemsArray);
    if (!result.success) {
      throw new Error(result.error || 'Failed to set Edge Config values');
    }
  },

  async delete(key: string): Promise<void> {
    const result = await deleteEdgeConfigValue(key);
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete Edge Config value');
    }
  },
};
