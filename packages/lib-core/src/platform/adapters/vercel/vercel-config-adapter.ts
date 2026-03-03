/**
 * Vercel Config Adapter
 *
 * Implements ConfigProvider using @vercel/edge-config.
 * This is the adapter for Vercel-hosted deployments.
 */

import { createClient } from '@vercel/edge-config';
import { logError } from '@giulio-leone/lib-shared';
import type { ConfigProvider, ConfigProviderWriteResult } from '../../ports/config-provider';

export class VercelConfigAdapter implements ConfigProvider {
  readonly name = 'vercel-edge-config';
  private client: ReturnType<typeof createClient> | null = null;

  private getClient(): ReturnType<typeof createClient> {
    if (this.client) return this.client;

    const connectionString = process.env.EDGE_CONFIG;
    if (!connectionString) {
      throw new Error(
        'EDGE_CONFIG environment variable is not set. Configure Edge Config in Vercel Dashboard.'
      );
    }

    this.client = createClient(connectionString);
    return this.client;
  }

  private extractConfigId(connectionString: string): string {
    const url = new URL(connectionString);
    const configId = url.pathname.split('/').filter(Boolean).pop();
    if (!configId) throw new Error('Invalid EDGE_CONFIG format');
    return configId;
  }

  private validateWriteEnv(): { authToken: string; configId: string } {
    const authToken = process.env.EDGE_CONFIG_AUTH_TOKEN;
    const connectionString = process.env.EDGE_CONFIG;
    if (!authToken) throw new Error('EDGE_CONFIG_AUTH_TOKEN is not set.');
    if (!connectionString) throw new Error('EDGE_CONFIG is not set.');
    return { authToken, configId: this.extractConfigId(connectionString) };
  }

  private async patchItems(
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
      logError('Failed to update Edge Config', { status: response.status, error: errorText });
      throw new Error(`Failed to update Edge Config: ${response.statusText}`);
    }
  }

  async get<T = unknown>(key: string): Promise<T | undefined> {
    try {
      return await this.getClient().get<T>(key);
    } catch (error: unknown) {
      logError(`[VercelConfigAdapter] Failed to get key: ${key}`, error);
      return undefined;
    }
  }

  async getAll(): Promise<Record<string, unknown>> {
    try {
      return (await this.getClient().getAll()) || {};
    } catch (error: unknown) {
      logError('[VercelConfigAdapter] Failed to getAll', error);
      return {};
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      return (await this.getClient().has(key)) ?? false;
    } catch {
      return false;
    }
  }

  async set(key: string, value: unknown): Promise<ConfigProviderWriteResult> {
    try {
      const { authToken, configId } = this.validateWriteEnv();
      await this.patchItems(configId, authToken, [{ operation: 'update', key, value }]);
      return { success: true };
    } catch (error: unknown) {
      logError(`[VercelConfigAdapter] Failed to set key: ${key}`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async setMany(items: Record<string, unknown>): Promise<ConfigProviderWriteResult> {
    try {
      const { authToken, configId } = this.validateWriteEnv();
      const patchItems = Object.entries(items).map(([key, value]) => ({
        operation: 'update',
        key,
        value,
      }));
      await this.patchItems(configId, authToken, patchItems);
      return { success: true };
    } catch (error: unknown) {
      logError('[VercelConfigAdapter] Failed to setMany', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete(key: string): Promise<ConfigProviderWriteResult> {
    try {
      const { authToken, configId } = this.validateWriteEnv();
      await this.patchItems(configId, authToken, [{ operation: 'delete', key }]);
      return { success: true };
    } catch (error: unknown) {
      logError(`[VercelConfigAdapter] Failed to delete key: ${key}`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
