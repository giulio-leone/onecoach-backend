/**
 * Environment Variables Helper - Server Only
 *
 * Server-side functions that may use Edge Config or other server-only features.
 * This file should only be imported in server components or API routes.
 */

import 'server-only';
import { z } from 'zod';
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

/**
 * Server-side environment variable validation.
 * Import this at app startup (e.g., instrumentation.ts) to fail fast on missing config.
 */
const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Auth
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),

  // AI Providers
  OPENROUTER_API_KEY: z.string().min(1).optional(),

  // Email
  RESEND_API_KEY: z.string().min(1).optional(),
  SENDGRID_API_KEY: z.string().min(1).optional(),

  // Google Calendar
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

  // Microsoft Calendar
  MICROSOFT_CLIENT_ID: z.string().min(1).optional(),
  MICROSOFT_CLIENT_SECRET: z.string().min(1).optional(),

  // Cron / Webhooks
  VERCEL_CRON_SECRET: z.string().min(1).optional(),
  ACCOUNTING_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Runtime
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let _env: ServerEnv | null = null;

/**
 * Validates and returns server environment variables.
 * Caches the result after first call.
 * Throws on invalid/missing required vars.
 */
export function getServerEnv(): ServerEnv {
  if (_env) return _env;

  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`❌ Invalid environment variables:\n${formatted}`);
  }

  _env = result.data;
  return _env;
}
