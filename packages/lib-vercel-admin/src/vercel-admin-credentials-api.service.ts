/**
 * Vercel Admin Credentials Service (Edge Config-based)
 *
 * Servizio per sincronizzare le credenziali admin e super admin in Edge Config
 * Permette aggiornamenti in tempo reale senza redeploy
 *
 * Principi: KISS, SOLID, DRY, YAGNI
 */import { logger } from '@giulio-leone/lib-core';


function logError(message: string, error: unknown) {
  logger.error(`[VercelAdminCredentials] ${message}`, error);
}

export interface AdminCredentials {
  email: string;
  password: string;
  name?: string;
  credits?: number;
}

export interface UpdateCredentialsResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Aggiorna un valore in Edge Config
 * Usa il servizio se disponibile, altrimenti API diretta
 */
async function updateEdgeConfigValue(key: string, value: string): Promise<void> {
  // Prova prima il servizio Next.js
  try {
    const edgeConfigModule = await import('@giulio-leone/lib-core/edge-config.service');
    if (edgeConfigModule.setEdgeConfigValue) {
      const result = await edgeConfigModule.setEdgeConfigValue(key, value);
      if (result.success) return;
      throw new Error(result.error || "Errore nell'aggiornamento Edge Config");
    }
  } catch (_error: unknown) {
    // Fallback a API diretta
  }

  // Fallback: API Vercel diretta
  const authToken = process.env.EDGE_CONFIG_AUTH_TOKEN;
  const connectionString = process.env.EDGE_CONFIG;

  if (!authToken || !connectionString) {
    throw new Error('EDGE_CONFIG_AUTH_TOKEN e EDGE_CONFIG devono essere configurati');
  }

  const configIdMatch = connectionString.match(/edge-config\.vercel\.com\/([^?]+)/);
  if (!configIdMatch) {
    throw new Error('Formato EDGE_CONFIG non valido');
  }

  const response = await fetch(`https://api.vercel.com/v1/edge-config/${configIdMatch[1]}/items`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items: [{ operation: 'update', key, value }] }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Errore ${response.status}: ${errorText}`);
  }
}

/**
 * Aggiorna credenziali in Edge Config (funzione generica - DRY)
 * Se password è vuota, non aggiorna la password in Edge Config
 */
async function updateCredentialsInEdgeConfig(
  prefix: 'ADMIN' | 'SUPER_ADMIN',
  credentials: AdminCredentials
): Promise<UpdateCredentialsResult> {
  try {
    const updates: Array<{ key: string; value: string }> = [
      { key: `${prefix}_EMAIL`, value: credentials.email },
      {
        key: `${prefix}_DEFAULT_NAME`,
        value: credentials.name || (prefix === 'ADMIN' ? 'Admin onecoach' : 'Super Admin onecoach'),
      },
    ];

    // Aggiorna password solo se fornita
    if (credentials.password) {
      updates.push({ key: `${prefix}_DEFAULT_PASSWORD`, value: credentials.password });
    }

    if (credentials.credits !== undefined) {
      updates.push({ key: `${prefix}_DEFAULT_CREDITS`, value: credentials.credits.toString() });
    }

    const results: string[] = [];
    for (const { key, value } of updates) {
      await updateEdgeConfigValue(key, value);
      results.push(key);
    }

    return {
      success: true,
      message: `Credenziali ${prefix.toLowerCase().replace('_', ' ')} aggiornate in Edge Config: ${results.join(', ')}`,
    };
  } catch (error: unknown) {
    logError(`Errore nell'aggiornamento credenziali ${prefix} in Edge Config`, error);
    return {
      success: false,
      message: "Errore nell'aggiornamento delle credenziali in Edge Config",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Aggiorna le credenziali admin in Edge Config
 */
export async function updateVercelAdminCredentials(
  credentials: AdminCredentials
): Promise<UpdateCredentialsResult> {
  return updateCredentialsInEdgeConfig('ADMIN', credentials);
}

/**
 * Aggiorna le credenziali super admin in Edge Config
 */
export async function updateVercelSuperAdminCredentials(
  credentials: AdminCredentials
): Promise<UpdateCredentialsResult> {
  return updateCredentialsInEdgeConfig('SUPER_ADMIN', credentials);
}
