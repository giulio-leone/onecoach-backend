/**
 * Feature Flags Service
 *
 * Service for managing feature flags and syncing with Edge Config.
 * Handles CRUD operations and ensures database and Edge Config stay in sync.
 */

import { prisma } from './prisma';
import { setEdgeConfigValue } from './edge-config.service';
import type { RolloutStrategy, FlagEventType } from '@giulio-leone/types';

import { logger } from '@giulio-leone/lib-shared';
/**
 * Rollout configuration interface
 */
export interface RolloutConfig {
  roles?: string[];
  percentage?: number;
  betaOnly?: boolean;
}

/**
 * Feature flag data interface
 */
export interface FeatureFlagData {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  strategy: RolloutStrategy;
  config?: RolloutConfig;
  metadata?: Record<string, unknown>;
}

/**
 * Feature flag metrics data
 */
export interface FlagMetricData {
  flagKey: string;
  userId?: string;
  event: FlagEventType;
  value?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Feature flag feedback data
 */
export interface FlagFeedbackData {
  flagKey: string;
  userId: string;
  rating: number;
  comment?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Sync feature flags to Edge Config
 * This should be called whenever flags are created, updated, or deleted
 */
async function syncToEdgeConfig(): Promise<void> {
  try {
    const flags = await prisma.feature_flags.findMany({
      where: { enabled: true },
    });

    const edgeConfigFlags: Record<string, unknown> = {};

    for (const flag of flags) {
      edgeConfigFlags[flag.key] = {
        key: flag.key,
        enabled: flag.enabled,
        strategy: flag.strategy,
        config: flag.config,
      };
    }

    await setEdgeConfigValue('feature_flags', edgeConfigFlags);
  } catch (error: unknown) {
    logger.error('Failed to sync flags to Edge Config:', error);
    throw error;
  }
}

/**
 * Create a new feature flag
 */
export async function createFeatureFlag(data: FeatureFlagData, createdBy: string): Promise<string> {
  const flag = await prisma.feature_flags.create({
    data: {
      key: data.key,
      name: data.name,
      description: data.description,
      enabled: data.enabled,
      strategy: data.strategy,
      config: data.config as object | undefined,
      metadata: data.metadata as object | undefined,
      createdBy,
    },
  });

  // Sync to Edge Config
  await syncToEdgeConfig();

  return flag.id;
}

/**
 * Update an existing feature flag
 */
export async function updateFeatureFlag(
  key: string,
  data: Partial<FeatureFlagData>,
  updatedBy: string
): Promise<void> {
  await prisma.feature_flags.update({
    where: { key },
    data: {
      name: data.name,
      description: data.description,
      enabled: data.enabled,
      strategy: data.strategy,
      config: data.config as object | undefined,
      metadata: data.metadata as object | undefined,
      updatedBy,
    },
  });

  // Sync to Edge Config
  await syncToEdgeConfig();
}

/**
 * Delete a feature flag
 */
export async function deleteFeatureFlag(key: string): Promise<void> {
  await prisma.feature_flags.delete({
    where: { key },
  });

  // Sync to Edge Config
  await syncToEdgeConfig();
}

/**
 * Get a feature flag by key
 */
export async function getFeatureFlag(key: string) {
  return prisma.feature_flags.findUnique({
    where: { key },
  });
}

/**
 * Get all feature flags
 */
export async function getAllFeatureFlags() {
  return prisma.feature_flags.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Toggle a feature flag on/off
 */
export async function toggleFeatureFlag(key: string, updatedBy: string): Promise<boolean> {
  const flag = await prisma.feature_flags.findUnique({
    where: { key },
  });

  if (!flag) {
    throw new Error('Flag not found');
  }

  const newEnabledState = !flag.enabled;

  await prisma.feature_flags.update({
    where: { key },
    data: {
      enabled: newEnabledState,
      updatedBy,
    },
  });

  // Sync to Edge Config
  await syncToEdgeConfig();

  return newEnabledState;
}

/**
 * Track a feature flag metric event
 */
export async function trackFlagMetric(data: FlagMetricData): Promise<void> {
  await prisma.feature_flag_metrics.create({
    data: {
      flagKey: data.flagKey,
      userId: data.userId,
      event: data.event,
      value: data.value,
      metadata: data.metadata as object | undefined,
    },
  });
}

/**
 * Get metrics for a specific flag
 */
export async function getFlagMetrics(
  flagKey: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  }
) {
  const where: {
    flagKey: string;
    timestamp?: { gte?: Date; lte?: Date };
    userId?: string;
  } = {
    flagKey,
  };

  if (options?.startDate || options?.endDate) {
    where.timestamp = {};
    if (options.startDate) {
      where.timestamp.gte = options.startDate;
    }
    if (options.endDate) {
      where.timestamp.lte = options.endDate;
    }
  }

  if (options?.userId) {
    where.userId = options.userId;
  }

  return prisma.feature_flag_metrics.findMany({
    where,
    orderBy: { timestamp: 'desc' },
  });
}

/**
 * Get aggregated metrics for a flag
 */
export async function getFlagMetricsAggregated(flagKey: string) {
  const metrics = await prisma.feature_flag_metrics.findMany({
    where: { flagKey },
  });

  const totalEvents = metrics.length;
  const enabledCount = metrics.filter((m) => m.event === 'ENABLED').length;
  const disabledCount = metrics.filter((m) => m.event === 'DISABLED').length;
  const evaluatedCount = metrics.filter((m) => m.event === 'EVALUATED').length;
  const errorCount = metrics.filter((m) => m.event === 'ERROR').length;

  const uniqueUsers = new Set(metrics.filter((m) => m.userId).map((m) => m.userId)).size;

  return {
    totalEvents,
    enabledCount,
    disabledCount,
    evaluatedCount,
    errorCount,
    uniqueUsers,
  };
}

/**
 * Submit feedback for a feature flag
 */
export async function submitFlagFeedback(data: FlagFeedbackData): Promise<void> {
  await prisma.feature_flag_feedback.create({
    data: {
      flagKey: data.flagKey,
      userId: data.userId,
      rating: data.rating,
      comment: data.comment,
      metadata: data.metadata as object | undefined,
    },
  });
}

/**
 * Get feedback for a specific flag
 */
export async function getFlagFeedback(
  flagKey: string,
  options?: {
    minRating?: number;
    maxRating?: number;
  }
) {
  const where: {
    flagKey: string;
    rating?: { gte?: number; lte?: number };
  } = {
    flagKey,
  };

  if (options?.minRating !== undefined || options?.maxRating !== undefined) {
    where.rating = {};
    if (options.minRating !== undefined) {
      where.rating.gte = options.minRating;
    }
    if (options.maxRating !== undefined) {
      where.rating.lte = options.maxRating;
    }
  }

  return prisma.feature_flag_feedback.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get average rating for a flag
 */
export async function getFlagAverageRating(flagKey: string): Promise<number | null> {
  const feedback = await prisma.feature_flag_feedback.findMany({
    where: { flagKey },
    select: { rating: true },
  });

  if (feedback.length === 0) {
    return null;
  }

  const sum = feedback.reduce((acc, f) => acc + f.rating, 0);
  return sum / feedback.length;
}

/**
 * Update beta status for a user
 */
export async function updateUserBetaStatus(userId: string, betaEnabled: boolean): Promise<void> {
  await prisma.users.update({
    where: { id: userId },
    data: { betaEnabled },
  });
}

/**
 * Get all beta users
 */
export async function getBetaUsers() {
  return prisma.users.findMany({
    where: { betaEnabled: true },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      betaEnabled: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Service object for dependency injection
 */
export const featureFlagsService = {
  createFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag,
  getFeatureFlag,
  getAllFeatureFlags,
  toggleFeatureFlag,
  trackFlagMetric,
  getFlagMetrics,
  getFlagMetricsAggregated,
  submitFlagFeedback,
  getFlagFeedback,
  getFlagAverageRating,
  updateUserBetaStatus,
  getBetaUsers,
  syncToEdgeConfig,
};
