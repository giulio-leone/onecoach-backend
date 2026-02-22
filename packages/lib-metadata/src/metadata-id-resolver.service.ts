/**
 * Metadata ID Resolver Service
 *
 * Resolves metadata IDs to localized names in batch for efficient display.
 * This service performs batch loading with IN clauses and uses caching
 * for improved performance.
 */

import { prisma } from '@giulio-leone/lib-core';
import { SimpleCache } from '@giulio-leone/lib-shared';

const DEFAULT_LOCALE = 'en';
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes

export interface MetadataIdInfo {
  id: string;
  name: string; // English name (canonical)
  localizedName: string; // Localized name
}

export interface MetadataIdMap {
  equipment: Record<string, MetadataIdInfo>;
  muscles: Record<string, MetadataIdInfo>;
  bodyParts: Record<string, MetadataIdInfo>;
  exerciseTypes: Record<string, MetadataIdInfo>;
}

// Cache for resolved metadata
const resolvedCache = new SimpleCache<string, MetadataIdMap>({
  max: 500,
  ttl: CACHE_TTL_MS,
});

/**
 * Build cache key from IDs and locale
 */
function buildCacheKey(type: string, ids: string[], locale: string): string {
  return `${type}:${locale}:${ids.sort().join(',')}`;
}

/**
 * Resolve equipment IDs to names
 */
async function resolveEquipmentIds(
  ids: string[],
  locale: string = DEFAULT_LOCALE
): Promise<Record<string, MetadataIdInfo>> {
  if (ids.length === 0) return {};

  const cacheKey = buildCacheKey('equipment', ids, locale);
  const cached = resolvedCache.get(cacheKey);
  if (cached?.equipment) return cached.equipment;

  const equipment = await prisma.equipments.findMany({
    where: { id: { in: ids } },
    include: {
      equipment_translations: {
        where: {
          OR: [{ locale }, { locale: DEFAULT_LOCALE }],
        },
      },
    },
  });

  const result: Record<string, MetadataIdInfo> = {};

  for (const eq of equipment) {
    const translation =
      eq.equipment_translations.find((t) => t.locale === locale) ||
      eq.equipment_translations.find((t) => t.locale === DEFAULT_LOCALE) ||
      null;

    result[eq.id] = {
      id: eq.id,
      name: eq.name,
      localizedName: translation?.name || eq.name,
    };
  }

  return result;
}

/**
 * Resolve muscle IDs to names
 */
async function resolveMuscleIds(
  ids: string[],
  locale: string = DEFAULT_LOCALE
): Promise<Record<string, MetadataIdInfo>> {
  if (ids.length === 0) return {};

  const cacheKey = buildCacheKey('muscles', ids, locale);
  const cached = resolvedCache.get(cacheKey);
  if (cached?.muscles) return cached.muscles;

  const muscles = await prisma.muscles.findMany({
    where: { id: { in: ids } },
    include: {
      muscle_translations: {
        where: {
          OR: [{ locale }, { locale: DEFAULT_LOCALE }],
        },
      },
    },
  });

  const result: Record<string, MetadataIdInfo> = {};

  for (const muscle of muscles) {
    const translation =
      muscle.muscle_translations.find((t) => t.locale === locale) ||
      muscle.muscle_translations.find((t) => t.locale === DEFAULT_LOCALE) ||
      null;

    result[muscle.id] = {
      id: muscle.id,
      name: muscle.name,
      localizedName: translation?.name || muscle.name,
    };
  }

  return result;
}

/**
 * Resolve body part IDs to names
 */
async function resolveBodyPartIds(
  ids: string[],
  locale: string = DEFAULT_LOCALE
): Promise<Record<string, MetadataIdInfo>> {
  if (ids.length === 0) return {};

  const cacheKey = buildCacheKey('bodyParts', ids, locale);
  const cached = resolvedCache.get(cacheKey);
  if (cached?.bodyParts) return cached.bodyParts;

  const bodyParts = await prisma.body_parts.findMany({
    where: { id: { in: ids } },
    include: {
      body_part_translations: {
        where: {
          OR: [{ locale }, { locale: DEFAULT_LOCALE }],
        },
      },
    },
  });

  const result: Record<string, MetadataIdInfo> = {};

  for (const bp of bodyParts) {
    const translation =
      bp.body_part_translations.find((t) => t.locale === locale) ||
      bp.body_part_translations.find((t) => t.locale === DEFAULT_LOCALE) ||
      null;

    result[bp.id] = {
      id: bp.id,
      name: bp.name,
      localizedName: translation?.name || bp.name,
    };
  }

  return result;
}

/**
 * Resolve exercise type IDs to names
 */
async function resolveExerciseTypeIds(
  ids: string[],
  locale: string = DEFAULT_LOCALE
): Promise<Record<string, MetadataIdInfo>> {
  if (ids.length === 0) return {};

  const cacheKey = buildCacheKey('exerciseTypes', ids, locale);
  const cached = resolvedCache.get(cacheKey);
  if (cached?.exerciseTypes) return cached.exerciseTypes;

  const exerciseTypes = await prisma.exercise_types.findMany({
    where: { id: { in: ids } },
    include: {
      exercise_type_translations: {
        where: {
          OR: [{ locale }, { locale: DEFAULT_LOCALE }],
        },
      },
    },
  });

  const result: Record<string, MetadataIdInfo> = {};

  for (const et of exerciseTypes) {
    const translation =
      et.exercise_type_translations.find((t) => t.locale === locale) ||
      et.exercise_type_translations.find((t) => t.locale === DEFAULT_LOCALE) ||
      null;

    result[et.id] = {
      id: et.id,
      name: et.name,
      localizedName: translation?.name || et.name,
    };
  }

  return result;
}

/**
 * Resolve metadata IDs in batch
 * @param ids Object containing arrays of IDs for each metadata type
 * @param locale Target locale for localization
 * @returns Map of ID → { id, name, localizedName } for each metadata type
 */
export async function resolveMetadataBatch(
  ids: {
    equipment?: string[];
    muscles?: string[];
    bodyParts?: string[];
    exerciseTypes?: string[];
  },
  locale: string = DEFAULT_LOCALE
): Promise<MetadataIdMap> {
  const [equipment, muscles, bodyParts, exerciseTypes] = await Promise.all([
    ids.equipment ? resolveEquipmentIds(ids.equipment, locale) : Promise.resolve({}),
    ids.muscles ? resolveMuscleIds(ids.muscles, locale) : Promise.resolve({}),
    ids.bodyParts ? resolveBodyPartIds(ids.bodyParts, locale) : Promise.resolve({}),
    ids.exerciseTypes ? resolveExerciseTypeIds(ids.exerciseTypes, locale) : Promise.resolve({}),
  ]);

  const result: MetadataIdMap = {
    equipment,
    muscles,
    bodyParts,
    exerciseTypes,
  };

  // Cache the result
  const allIds = [
    ...(ids.equipment || []),
    ...(ids.muscles || []),
    ...(ids.bodyParts || []),
    ...(ids.exerciseTypes || []),
  ];
  if (allIds.length > 0) {
    const cacheKey = buildCacheKey('all', allIds, locale);
    resolvedCache.set(cacheKey, result);
  }

  return result;
}

/**
 * Build a map of ID → English name for AI consumption
 * @param type Metadata type
 * @param ids Array of metadata IDs
 * @returns Record mapping ID → English name
 */
export async function buildIdMapForAI(
  type: 'equipment' | 'muscle' | 'bodyPart' | 'exerciseType',
  ids: string[]
): Promise<Record<string, string>> {
  if (ids.length === 0) return {};

  const locale = DEFAULT_LOCALE; // Always use English for AI
  let resolved: Record<string, MetadataIdInfo>;

  switch (type) {
    case 'equipment':
      resolved = await resolveEquipmentIds(ids, locale);
      break;
    case 'muscle':
      resolved = await resolveMuscleIds(ids, locale);
      break;
    case 'bodyPart':
      resolved = await resolveBodyPartIds(ids, locale);
      break;
    case 'exerciseType':
      resolved = await resolveExerciseTypeIds(ids, locale);
      break;
  }

  const result: Record<string, string> = {};
  for (const [id, info] of Object.entries(resolved)) {
    result[id] = info.name; // Use English name for AI
  }

  return result;
}
