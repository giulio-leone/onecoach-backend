/**
 * Prisma Client Singleton
 *
 * Prevents multiple instances of Prisma Client during Next.js hot reload
 * Lazy initialization to avoid Prisma 7.0.0 constructor issues
 *
 * This file is server-only and should never be imported in client components.
 * Use dynamic imports when needed in server-side code that may be bundled with client code.
 */

// Note: 'server-only' import removed due to Turbopack bundler issues
// This file is inherently server-only due to Node.js dependencies (pg, @prisma/client)

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { logger } from './logger.service';
const globalForPrisma = globalThis as unknown as {
  prisma_updated: PrismaClient | undefined;
  pool: Pool | undefined;
  prismaInitLogged?: boolean;
};

// Prisma 7: Il client legge DATABASE_URL direttamente da process.env
// Assicuriamoci che sia impostato prima di creare il client
const ensureDatabaseUrl = () => {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    process.env.DATABASE_URL = 'postgresql://build:build@localhost:5432/build';
    return;
  }

  if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
    if (process.env.NODE_ENV === 'development') {
      const fallback = 'postgresql://postgres:postgres@localhost:5432/postgres?schema=public';
      logger.warn(
        `[Prisma] ⚠️  No DATABASE_URL or DIRECT_URL found! Using fallback. To fix: Configure DATABASE_URL in .env.local or .env`
      );
      process.env.DATABASE_URL = fallback;
    } else {
      throw new Error('DATABASE_URL or DIRECT_URL environment variable is required in production.');
    }
  } else if (!process.env.DATABASE_URL && process.env.DIRECT_URL) {
    process.env.DATABASE_URL = process.env.DIRECT_URL;
  }

  // Non loggare mai la DATABASE_URL per motivi di sicurezza
};

/**
 * Normalizza l'URL del database rimuovendo i parametri SSL dall'URL
 * per evitare conflitti con la configurazione SSL del Pool pg.
 * La gestione SSL per certificati self-signed viene fatta nel Pool.
 */
function normalizeDatabaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Rimuovi sslmode dall'URL - la configurazione SSL viene gestita dal Pool
    // Questo evita conflitti tra l'URL e le opzioni del Pool
    urlObj.searchParams.delete('sslmode');
    urlObj.searchParams.delete('ssl');
    urlObj.searchParams.delete('sslcert');
    urlObj.searchParams.delete('sslkey');
    urlObj.searchParams.delete('sslrootcert');

    return urlObj.toString();
  } catch {
    // Se l'URL non è valido, rimuovi i parametri SSL manualmente
    return url
      .replace(/[?&]sslmode=[^&]*/gi, '')
      .replace(/[?&]ssl=[^&]*/gi, '')
      .replace(/\?&/, '?')
      .replace(/&&/, '&')
      .replace(/\?$/, '');
  }
}

// Lazy getter per Prisma Client
function getPrismaClient(): PrismaClient {
  ensureDatabaseUrl();

  if (!globalForPrisma.prisma_updated) {
    // In serverless environments (Vercel), prefer pooled connections
    // Use DATABASE_URL (pooled) instead of DIRECT_URL to avoid connection limits
    const rawDbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

    if (!rawDbUrl) {
      throw new Error('DATABASE_URL or DIRECT_URL is required');
    }

    // Normalizza l'URL per assicurarsi che abbia i parametri SSL corretti
    const dbUrl = normalizeDatabaseUrl(rawDbUrl);

    // For serverless environments, use a very small pool size (1-2 connections)
    // Each serverless function instance should have minimal connections
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    const defaultPoolSize = isServerless ? 2 : 10;
    const connectionTimeoutMillis = Number(process.env.PG_CONNECTION_TIMEOUT_MS ?? 30000);
    const idleTimeoutMillis = Number(process.env.PG_IDLE_TIMEOUT_MS ?? 30000);

    // Log connection pool info only once per process (avoid spam during hot reloads)
    if (process.env.NODE_ENV === 'development' && !globalForPrisma.prismaInitLogged) {
      globalForPrisma.prismaInitLogged = true;
      logger.debug('[Prisma] Connection pool initialized:', {
        max: Number(process.env.PG_POOL_MAX ?? defaultPoolSize),
        connectionTimeoutMillis,
        idleTimeoutMillis,
        isServerless: !!isServerless,
      });
    }

    // Reuse a single Pool across hot reloads to avoid exhausting connections
    const pool =
      globalForPrisma.pool ??
      new Pool({
        connectionString: dbUrl,
        // Per certificati self-signed (Supabase/Vercel), rejectUnauthorized: false
        // Il parametro sslmode=require nell'URL è sufficiente, ma questo è un fallback
        ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
        max: Number(process.env.PG_POOL_MAX ?? defaultPoolSize),
        // Timeout configurazioni per evitare "pool checkout timeout"
        connectionTimeoutMillis,
        idleTimeoutMillis,
        // In development, allow waiting longer for connections
        ...(process.env.NODE_ENV === 'development' ? { allowExitOnIdle: true } : {}),
      });

    globalForPrisma.pool = pool;

    const adapter = new PrismaPg(pool);

    // Prisma 7: Il client legge DATABASE_URL direttamente da process.env
    // Assicuriamoci che l'URL normalizzato sia impostato prima di creare il client
    const originalDbUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = dbUrl;

    globalForPrisma.prisma_updated = new PrismaClient({
      adapter,
    });

    // Ripristina l'URL originale se era diverso (per compatibilità)
    if (originalDbUrl && originalDbUrl !== dbUrl) {
      process.env.DATABASE_URL = originalDbUrl;
    }
  }

  return globalForPrisma.prisma_updated;
}

// =============================================================================
// EXPORTS
// =============================================================================

// IMPORTANTE: Prisma 7 con driver adapter richiede che il PrismaClient sia
// inizializzato LAZY, cioè solo quando viene effettivamente usato.
// Questo è necessario perché:
// 1. Le variabili d'ambiente potrebbero non essere caricate al momento dell'import
// 2. Il singleton deve essere condiviso correttamente tra hot reloads
// 3. I model accessors (es. 'generation_states') sono getters sul prototype

// Singleton cache nel modulo
let _prismaInstance: PrismaClient | undefined;

/**
 * Get the singleton PrismaClient instance.
 * Creates the client on first call, then reuses it.
 */
export function getPrisma(): PrismaClient {
  if (!_prismaInstance) {
    _prismaInstance = getPrismaClient();
  }
  return _prismaInstance;
}

/**
 * Prisma client getter - LAZY initialization.
 * Uses a getter function to defer client creation until first access.
 * 
 * @example
 * import { prisma } from '@onecoach/lib-core';
 * const users = await prisma.users.findMany(); // Client created here
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export async function disconnectPrisma() {
  if (_prismaInstance) {
    await _prismaInstance.$disconnect();
    _prismaInstance = undefined;
  }
  if (globalForPrisma.prisma_updated) {
    await globalForPrisma.prisma_updated.$disconnect();
    globalForPrisma.prisma_updated = undefined;
  }
  if (globalForPrisma.pool) {
    await globalForPrisma.pool.end();
    globalForPrisma.pool = undefined;
  }
}

// Re-export Prisma types so consumers don't need @prisma/client dependency
export { Prisma } from '@prisma/client';
export type { PrismaClient } from '@prisma/client';

