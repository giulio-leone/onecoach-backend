/**
 * @giulio-leone/lib-vercel-admin
 *
 * Servizi per gestione Vercel admin (credentials, env vars)
 */

export * from './vercel-admin-credentials-api.service';
export * from './vercel-env-vars-api.service';

// Named exports for convenience
export {
  createEnvVar,
  getEnvVarByKey,
  updateEnvVar,
  deleteEnvVar,
  envVarExists,
} from './vercel-env-vars-api.service';
export type { VercelEnvironment, VercelEnvVar } from './vercel-env-vars-api.service';
