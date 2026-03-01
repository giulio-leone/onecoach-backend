/**
 * Platform Factory
 *
 * Central factory that creates platform-specific adapters based on
 * the DEPLOY_PLATFORM environment variable.
 *
 * Supports: 'vercel' | 'firebase' | 'vps' (default: 'vercel')
 *
 * Usage:
 *   const config = PlatformFactory.getConfigProvider();
 *   const flags = PlatformFactory.getFeatureFlagsProvider();
 *   const cron = PlatformFactory.getCronProvider();
 */

import type { ConfigProvider } from './ports/config-provider';
import type { FeatureFlagsProvider } from './ports/feature-flags-provider';
import type { CronProvider } from './ports/cron-provider';

import { VercelConfigAdapter } from './adapters/vercel/vercel-config-adapter';
import { FirebaseConfigAdapter } from './adapters/firebase/firebase-config-adapter';
import { EnvConfigAdapter } from './adapters/env/env-config-adapter';
import { DatabaseFeatureFlagsAdapter } from './adapters/database-feature-flags-adapter';
import { NoOpCronAdapter } from './adapters/no-op-cron-adapter';

export type DeployPlatform = 'vercel' | 'firebase' | 'vps';

function getPlatform(): DeployPlatform {
  const platform = process.env.DEPLOY_PLATFORM?.toLowerCase();
  if (platform === 'firebase' || platform === 'vps') return platform;

  // Auto-detect Vercel
  if (process.env.VERCEL || process.env.VERCEL_ENV) return 'vercel';

  // Auto-detect Firebase
  if (process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_CONFIG) return 'firebase';

  // Default to env-based config (VPS / development)
  return 'vps';
}

// Singleton instances
let configProvider: ConfigProvider | null = null;
let featureFlagsProvider: FeatureFlagsProvider | null = null;
let cronProvider: CronProvider | null = null;

export const PlatformFactory = {
  /** Get the current deployment platform */
  getPlatform,

  /** Get the config provider for the current platform */
  getConfigProvider(): ConfigProvider {
    if (configProvider) return configProvider;

    const platform = getPlatform();
    switch (platform) {
      case 'vercel':
        configProvider = new VercelConfigAdapter();
        break;
      case 'firebase':
        configProvider = new FirebaseConfigAdapter();
        break;
      case 'vps':
      default:
        configProvider = new EnvConfigAdapter();
        break;
    }

    return configProvider;
  },

  /** Get the feature flags provider (database-backed, platform-agnostic) */
  getFeatureFlagsProvider(): FeatureFlagsProvider {
    if (featureFlagsProvider) return featureFlagsProvider;
    featureFlagsProvider = new DatabaseFeatureFlagsAdapter();
    return featureFlagsProvider;
  },

  /** Get the cron provider for the current platform */
  getCronProvider(): CronProvider {
    if (cronProvider) return cronProvider;

    const platform = getPlatform();
    if (platform === 'vps') {
      // VPS needs programmatic scheduling; lazy-load to avoid requiring node-cron on other platforms
      const { NodeCronAdapter } = require('./adapters/node-cron-adapter') as typeof import('./adapters/node-cron-adapter');
      const adapter = new NodeCronAdapter();
      adapter.init().catch((err: Error) => console.warn('[PlatformFactory] node-cron not available:', err.message));
      cronProvider = adapter;
    } else {
      // Vercel (vercel.json) and Firebase (Cloud Scheduler) handle crons externally
      cronProvider = new NoOpCronAdapter();
    }

    return cronProvider;
  },

  /** Reset all singletons (useful for testing) */
  reset(): void {
    configProvider = null;
    featureFlagsProvider = null;
    cronProvider = null;
  },
} as const;
