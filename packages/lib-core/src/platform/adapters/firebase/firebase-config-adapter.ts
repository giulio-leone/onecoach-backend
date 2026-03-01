/**
 * Firebase Config Adapter
 *
 * Implements ConfigProvider using Firebase Remote Config (Admin SDK).
 * For Firebase-hosted deployments.
 *
 * Requires: firebase-admin package and GOOGLE_APPLICATION_CREDENTIALS env var.
 */

import { logError } from '@giulio-leone/lib-shared';
import type { ConfigProvider, ConfigProviderWriteResult } from '../ports/config-provider';

/**
 * Firebase Remote Config adapter.
 *
 * Uses Firebase Admin SDK's Remote Config for server-side config management.
 * Falls back to environment variables if Firebase Admin is not available.
 */
export class FirebaseConfigAdapter implements ConfigProvider {
  readonly name = 'firebase-remote-config';
  private remoteConfig: any = null;
  private initialized = false;

  private async getRemoteConfig() {
    if (this.initialized) return this.remoteConfig;
    this.initialized = true;

    try {
      // Dynamic import to avoid requiring firebase-admin when not on Firebase
      const admin = await import('firebase-admin');
      if (!admin.apps.length) {
        admin.initializeApp();
      }
      this.remoteConfig = admin.remoteConfig();
      return this.remoteConfig;
    } catch (error: unknown) {
      logError('[FirebaseConfigAdapter] Firebase Admin not available', error);
      return null;
    }
  }

  async get<T = unknown>(key: string): Promise<T | undefined> {
    try {
      const rc = await this.getRemoteConfig();
      if (!rc) return undefined;

      const template = await rc.getTemplate();
      const param = template.parameters?.[key];
      if (!param?.defaultValue) return undefined;

      const raw = (param.defaultValue as any).value;
      if (raw === undefined) return undefined;

      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as T;
      }
    } catch (error: unknown) {
      logError(`[FirebaseConfigAdapter] Failed to get key: ${key}`, error);
      return undefined;
    }
  }

  async getAll(): Promise<Record<string, unknown>> {
    try {
      const rc = await this.getRemoteConfig();
      if (!rc) return {};

      const template = await rc.getTemplate();
      const result: Record<string, unknown> = {};

      for (const [key, param] of Object.entries(template.parameters || {})) {
        const raw = (param as any)?.defaultValue?.value;
        if (raw !== undefined) {
          try {
            result[key] = JSON.parse(raw);
          } catch {
            result[key] = raw;
          }
        }
      }
      return result;
    } catch (error: unknown) {
      logError('[FirebaseConfigAdapter] Failed to getAll', error);
      return {};
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  async set(key: string, value: unknown): Promise<ConfigProviderWriteResult> {
    try {
      const rc = await this.getRemoteConfig();
      if (!rc) return { success: false, error: 'Firebase Admin not available' };

      const template = await rc.getTemplate();
      template.parameters[key] = {
        defaultValue: { value: JSON.stringify(value) },
      };
      await rc.publishTemplate(template);
      return { success: true };
    } catch (error: unknown) {
      logError(`[FirebaseConfigAdapter] Failed to set key: ${key}`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async setMany(items: Record<string, unknown>): Promise<ConfigProviderWriteResult> {
    try {
      const rc = await this.getRemoteConfig();
      if (!rc) return { success: false, error: 'Firebase Admin not available' };

      const template = await rc.getTemplate();
      for (const [key, value] of Object.entries(items)) {
        template.parameters[key] = {
          defaultValue: { value: JSON.stringify(value) },
        };
      }
      await rc.publishTemplate(template);
      return { success: true };
    } catch (error: unknown) {
      logError('[FirebaseConfigAdapter] Failed to setMany', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete(key: string): Promise<ConfigProviderWriteResult> {
    try {
      const rc = await this.getRemoteConfig();
      if (!rc) return { success: false, error: 'Firebase Admin not available' };

      const template = await rc.getTemplate();
      delete template.parameters[key];
      await rc.publishTemplate(template);
      return { success: true };
    } catch (error: unknown) {
      logError(`[FirebaseConfigAdapter] Failed to delete key: ${key}`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
