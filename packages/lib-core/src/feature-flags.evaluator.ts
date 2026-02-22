/**
 * Vercel Flags SDK Setup
 *
 * This file defines feature flags and their evaluation logic.
 * Flags are stored in Edge Config for fast, global access.
 */

import { getEdgeConfigValue } from './edge-config.service';
import { prisma } from './prisma';
import type { UserRole } from '@giulio-leone/types';

import { logger } from '@giulio-leone/lib-shared';
/**
 * Rollout strategy configuration
 */
interface RolloutConfig {
  roles?: UserRole[];
  percentage?: number;
  betaOnly?: boolean;
  userId?: string;
}

/**
 * Flag definition from database
 */
interface FlagDefinition {
  key: string;
  enabled: boolean;
  strategy: string;
  config?: RolloutConfig;
}

/**
 * Hash function for consistent percentage rollout
 */
function hashUserId(userId: string, flagKey: string): number {
  let hash = 0;
  const str = `${userId}-${flagKey}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % 100;
}

/**
 * Evaluate rollout strategy for a user
 */
async function evaluateRollout(
  strategy: string,
  config: RolloutConfig | undefined,
  userId: string | undefined,
  userRole: UserRole | undefined
): Promise<boolean> {
  if (strategy === 'ALL') {
    return true;
  }

  if (!userId || !userRole) {
    return false;
  }

  if (strategy === 'ROLE_BASED' && config?.roles) {
    return config.roles.includes(userRole);
  }

  if (strategy === 'PERCENTAGE' && config?.percentage !== undefined) {
    const hash = hashUserId(userId, 'percentage');
    return hash < config.percentage;
  }

  if (strategy === 'RANDOM') {
    return Math.random() < 0.5;
  }

  if (strategy === 'BETA_USERS' && config?.betaOnly) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { betaEnabled: true },
    });
    return user?.betaEnabled ?? false;
  }

  if (strategy === 'COMBINED' && config) {
    // For combined strategy, all conditions must be met
    let result = true;

    if (config.roles && !config.roles.includes(userRole)) {
      result = false;
    }

    if (config.percentage !== undefined) {
      const hash = hashUserId(userId, 'percentage');
      if (hash >= config.percentage) {
        result = false;
      }
    }

    if (config.betaOnly) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { betaEnabled: true },
      });
      if (!user?.betaEnabled) {
        result = false;
      }
    }

    return result;
  }

  return false;
}

/**
 * Main decision function for feature flags
 * Reads from Edge Config first (fast), falls back to database
 */
export async function decide(
  flagKey: string,
  context?: {
    userId?: string;
    userRole?: UserRole;
  }
): Promise<boolean> {
  try {
    // Try to read from Edge Config first
    const edgeConfigFlags =
      await getEdgeConfigValue<Record<string, FlagDefinition>>('feature_flags');

    let flagDef: FlagDefinition | undefined;

    if (edgeConfigFlags && edgeConfigFlags[flagKey]) {
      flagDef = edgeConfigFlags[flagKey];
    } else {
      // Fallback to database
      const dbFlag = await prisma.feature_flags.findUnique({
        where: { key: flagKey },
      });

      if (!dbFlag) {
        return false;
      }

      flagDef = {
        key: dbFlag.key,
        enabled: dbFlag.enabled,
        strategy: dbFlag.strategy,
        config: dbFlag.config as RolloutConfig | undefined,
      };
    }

    if (!flagDef.enabled) {
      return false;
    }

    // Evaluate rollout strategy
    return await evaluateRollout(
      flagDef.strategy,
      flagDef.config,
      context?.userId,
      context?.userRole
    );
  } catch (error: unknown) {
    logger.error(`Error evaluating flag ${flagKey}:`, error);
    return false;
  }
}

/**
 * Get all active flags from Edge Config or database
 */
export async function getAllFlags(): Promise<Record<string, FlagDefinition>> {
  try {
    const edgeConfigFlags =
      await getEdgeConfigValue<Record<string, FlagDefinition>>('feature_flags');

    if (edgeConfigFlags) {
      return edgeConfigFlags;
    }

    // Fallback to database
    const dbFlags = await prisma.feature_flags.findMany({
      where: { enabled: true },
    });

    const flags: Record<string, FlagDefinition> = {};
    for (const flag of dbFlags) {
      flags[flag.key] = {
        key: flag.key,
        enabled: flag.enabled,
        strategy: flag.strategy,
        config: flag.config as RolloutConfig | undefined,
      };
    }

    return flags;
  } catch (error: unknown) {
    logger.error('Error getting all flags:', error);
    return {};
  }
}
