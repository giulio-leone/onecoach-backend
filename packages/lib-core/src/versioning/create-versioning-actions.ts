'use server';

import { prisma } from '../prisma';

/**
 * Generic Versioning Actions Factory
 *
 * Creates save/get actions for any domain's version history.
 * Follows DRY principle - single implementation for Workout, Nutrition, and Projects.
 *
 * @example
 * const { saveVersion, getVersions } = createVersioningActions({
 *   tableName: 'workout_program_versions',
 *   entityIdField: 'programId',
 *   maxVersions: 20,
 * });
 */

/** Minimal Prisma delegate for dynamic table access */
type PrismaDelegate = {
  findFirst: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
  create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  count: (args: Record<string, unknown>) => Promise<number>;
  findMany: (args: Record<string, unknown>) => Promise<Record<string, unknown>[]>;
  deleteMany: (args: Record<string, unknown>) => Promise<{ count: number }>;
};

/** Access a Prisma model delegate dynamically by table name */
function getDelegate(tableName: string): PrismaDelegate {
  return (prisma as Record<string, unknown>)[tableName] as PrismaDelegate;
}

export type VersioningConfig<T> = {
  /** Prisma model name (e.g., 'workout_program_versions') */
  tableName: 'workout_program_versions' | 'nutrition_plan_versions' | 'oneagenda_project_versions';
  /** Field name for entity ID (e.g., 'programId', 'planId', 'projectId') */
  entityIdField: 'programId' | 'planId' | 'projectId';
  /** Maximum versions to retain */
  maxVersions: number;
  /** Map state to Prisma create input */
  stateToCreateInput: (
    state: T,
    entityId: string,
    version: number,
    changeLog: string,
    userId: string
  ) => Record<string, unknown>;
  /** Map DB record to VersionSnapshot-like structure */
  recordToSnapshot: (record: Record<string, unknown>) => {
    timestamp: number;
    description: string;
    state: T;
  };
};

/**
 * Saves a new version of an entity.
 */
export async function saveVersion<T>(
  config: VersioningConfig<T>,
  entityId: string,
  state: T,
  changeLog: string,
  userId: string
): Promise<{ success: boolean; version?: number; error?: string }> {
  try {
    // Get latest version number
    const lastVersion = await getDelegate(config.tableName).findFirst({
      where: { [config.entityIdField]: entityId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const nextVersion = ((lastVersion?.version as number) ?? 0) + 1;

    // Create new version
    const createData = config.stateToCreateInput(state, entityId, nextVersion, changeLog, userId);
    await getDelegate(config.tableName).create({ data: createData });

    // Prune old versions
    const count = await getDelegate(config.tableName).count({
      where: { [config.entityIdField]: entityId },
    });

    if (count > config.maxVersions) {
      const toDelete = await getDelegate(config.tableName).findMany({
        where: { [config.entityIdField]: entityId },
        orderBy: { version: 'asc' },
        take: count - config.maxVersions,
        select: { id: true },
      });

      if (toDelete.length > 0) {
        await getDelegate(config.tableName).deleteMany({
          where: { id: { in: toDelete.map((v) => v.id as string) } },
        });
      }
    }

    return { success: true, version: nextVersion };
  } catch (error) {
    console.error(`Failed to save ${config.tableName} version:`, error);
    return { success: false, error: 'Failed to save version' };
  }
}

/**
 * Retrieves version history for an entity.
 */
export async function getVersions<T>(
  config: VersioningConfig<T>,
  entityId: string
): Promise<Array<{ timestamp: number; description: string; state: T }>> {
  try {
    const records = await getDelegate(config.tableName).findMany({
      where: { [config.entityIdField]: entityId },
      orderBy: { version: 'desc' },
    });

    return records.map((r: Record<string, unknown>) => config.recordToSnapshot(r));
  } catch (error) {
    console.error(`Failed to get ${config.tableName} versions:`, error);
    return [];
  }
}
