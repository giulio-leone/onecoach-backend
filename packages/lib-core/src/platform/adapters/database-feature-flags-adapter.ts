/**
 * Database Feature Flags Adapter
 *
 * Implements FeatureFlagsProvider using Prisma database.
 * Platform-agnostic — works on any deployment target.
 */

import { prisma } from '../../prisma';
import { logError } from '@giulio-leone/lib-shared';
import type { FeatureFlagsProvider, FlagDefinition } from '../ports/feature-flags-provider';

export class DatabaseFeatureFlagsAdapter implements FeatureFlagsProvider {
  readonly name = 'database-feature-flags';

  async getFlags(): Promise<FlagDefinition[]> {
    try {
      const flags = await prisma.feature_flags.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return flags.map((flag) => ({
        key: flag.key,
        name: flag.name,
        description: flag.description || undefined,
        enabled: flag.enabled,
        origin: process.env.NEXT_PUBLIC_APP_URL || 'https://onecoach.app',
        options: [
          { value: false, label: 'Disabled' },
          { value: true, label: 'Enabled' },
        ],
      }));
    } catch (error: unknown) {
      logError('[DatabaseFeatureFlagsAdapter] Failed to get flags', error);
      return [];
    }
  }

  async getFlag(key: string): Promise<FlagDefinition | undefined> {
    try {
      const flag = await prisma.feature_flags.findUnique({ where: { key } });
      if (!flag) return undefined;

      return {
        key: flag.key,
        name: flag.name,
        description: flag.description || undefined,
        enabled: flag.enabled,
        origin: process.env.NEXT_PUBLIC_APP_URL || 'https://onecoach.app',
        options: [
          { value: false, label: 'Disabled' },
          { value: true, label: 'Enabled' },
        ],
      };
    } catch (error: unknown) {
      logError(`[DatabaseFeatureFlagsAdapter] Failed to get flag: ${key}`, error);
      return undefined;
    }
  }

  async isEnabled(key: string): Promise<boolean> {
    try {
      const flag = await prisma.feature_flags.findUnique({
        where: { key },
        select: { enabled: true },
      });
      return flag?.enabled ?? false;
    } catch (error: unknown) {
      logError(`[DatabaseFeatureFlagsAdapter] Failed to check flag: ${key}`, error);
      return false;
    }
  }
}
