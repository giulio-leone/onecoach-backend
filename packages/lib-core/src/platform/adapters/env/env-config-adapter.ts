/**
 * Environment Config Adapter
 *
 * Implements ConfigProvider using environment variables.
 * Fallback adapter for VPS / self-hosted deployments.
 *
 * Config keys map to env vars with prefix: ONECOACH_CONFIG_<KEY>
 * Values are JSON-encoded strings.
 */

import { logError } from '@giulio-leone/lib-shared';
import type { ConfigProvider, ConfigProviderWriteResult } from '../ports/config-provider';

const ENV_PREFIX = 'ONECOACH_CONFIG_';

function envKey(key: string): string {
  return `${ENV_PREFIX}${key.toUpperCase().replace(/[.-]/g, '_')}`;
}

export class EnvConfigAdapter implements ConfigProvider {
  readonly name = 'env-config';

  async get<T = unknown>(key: string): Promise<T | undefined> {
    try {
      const raw = process.env[envKey(key)];
      if (raw === undefined) return undefined;
      return JSON.parse(raw) as T;
    } catch (error: unknown) {
      logError(`[EnvConfigAdapter] Failed to parse key: ${key}`, error);
      return process.env[envKey(key)] as T | undefined;
    }
  }

  async getAll(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (k.startsWith(ENV_PREFIX) && v !== undefined) {
        const configKey = k.slice(ENV_PREFIX.length).toLowerCase().replace(/_/g, '.');
        try {
          result[configKey] = JSON.parse(v);
        } catch {
          result[configKey] = v;
        }
      }
    }
    return result;
  }

  async has(key: string): Promise<boolean> {
    return process.env[envKey(key)] !== undefined;
  }

  async set(_key: string, _value: unknown): Promise<ConfigProviderWriteResult> {
    return {
      success: false,
      error: 'EnvConfigAdapter is read-only. Set environment variables directly.',
    };
  }

  async setMany(_items: Record<string, unknown>): Promise<ConfigProviderWriteResult> {
    return {
      success: false,
      error: 'EnvConfigAdapter is read-only. Set environment variables directly.',
    };
  }

  async delete(_key: string): Promise<ConfigProviderWriteResult> {
    return {
      success: false,
      error: 'EnvConfigAdapter is read-only. Remove environment variables directly.',
    };
  }
}
