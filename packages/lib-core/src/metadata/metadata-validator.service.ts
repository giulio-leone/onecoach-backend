/**
 * Metadata Validator Service
 *
 * Validates metadata names (localized or English) and returns their IDs.
 * This service ensures that all metadata references use IDs from the database,
 * preventing inconsistencies from manual input or AI-generated variations.
 */

import { prisma } from '../prisma';
import { logger } from '../logger.service';
import { Prisma } from '@prisma/client';
import { toSlug, createId, SimpleCache } from '@giulio-leone/lib-shared';
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

// Cache for name → ID lookups
const nameToIdCache = new SimpleCache<string, string>({
  max: 1000,
  ttl: CACHE_TTL_MS,
});

/**
 * Normalize a string for comparison (trim, lowercase)
 */
function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Fuzzy match a name against a list of names (case-insensitive, handles minor variations)
 */
function findBestMatch(
  searchName: string,
  candidates: Array<{ name: string; id: string }>
): string | null {
  const normalized = normalizeName(searchName);

  // Exact match
  const exact = candidates.find((c: any) => normalizeName(c.name) === normalized);
  if (exact) return exact.id;

  // Contains match (fuzzy)
  const contains = candidates.find((c: any) => normalizeName(c.name).includes(normalized) || normalized.includes(normalizeName(c.name))
  );
  if (contains) return contains.id;

  return null;
}

/**
 * Validate equipment names and return their IDs
 * @param names Array of equipment names (can be localized or English)
 * @returns Array of valid equipment IDs (same order, filters out invalid names)
 */
export async function validateEquipmentByName(names: string[]): Promise<string[]> {
  if (names.length === 0) return [];

  // Check cache first - try individual lookups
  const cachedIds: string[] = [];
  let allCached = true;
  for (const name of names) {
    const idKey = `equipment:${normalizeName(name)}`;
    const cached = nameToIdCache.get(idKey);
    if (cached) {
      cachedIds.push(cached as string);
    } else {
      allCached = false;
      break;
    }
  }

  if (allCached && cachedIds.length === names.length) {
    return cachedIds;
  }

  // Fetch all equipment from database
  const allEquipment = await prisma.equipments.findMany({
    select: { id: true, name: true },
  });

  // Build a map for quick lookup
  const nameToIdMap = new Map<string, string>();
  allEquipment.forEach((eq: any) => {
    nameToIdMap.set(normalizeName(eq.name), eq.id);
  });

  // Also check translations (English is default, but check for other locales too)
  const translations = await prisma.equipment_translations.findMany({
    where: {
      name: {
        in: names.map(normalizeName),
      },
    },
    include: {
      equipments: {
        select: { id: true },
      },
    },
  });

  translations.forEach((trans: any) => {
    nameToIdMap.set(normalizeName(trans.name), trans.equipments.id);
  });

  // Validate each name and get ID, create if not exists
  const ids: string[] = [];
  for (const name of names) {
    const normalized = normalizeName(name);
    let id = nameToIdMap.get(normalized) || findBestMatch(name, allEquipment);

    // If not found, create new equipment with generated ID
    if (!id) {
      const trimmedName = name.trim();
      try {
        const newEquipment = await prisma.equipments.create({
          data: {
            id: createId(),
            name: trimmedName, // Use original name (English)
            slug: toSlug(trimmedName),
          },
        });
        id = newEquipment.id;
        nameToIdCache.set(`equipment:${normalized}`, id ?? '');
      } catch (error: unknown) {
        // Handle unique constraint violation (race condition)
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          Array.isArray(error.meta?.target) &&
          error.meta?.target.includes('name')
        ) {
          // Another call created the same equipment, fetch it
          const existing = await prisma.equipments.findFirst({
            where: {
              name: {
                equals: trimmedName,
                mode: 'insensitive',
              },
            },
            select: { id: true },
          });
          if (existing) {
            id = existing.id;
            nameToIdCache.set(`equipment:${normalized}`, id ?? '');
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    } else {
      // Cache individual mappings
      nameToIdCache.set(`equipment:${normalized}`, id);
    }

    ids.push(id ?? '');
  }

  // Cache individual mappings
  for (let i = 0; i < names.length && i < ids.length; i++) {
    const name = names[i];
    const id = ids[i];
    if (name && id) {
      nameToIdCache.set(`equipment:${normalizeName(name)}`, id);
    }
  }

  return ids;
}

/**
 * Validate muscle names and return their IDs
 */
export async function validateMusclesByName(names: string[]): Promise<string[]> {
  if (names.length === 0) return [];

  // Check cache first - try individual lookups
  const cachedIds: string[] = [];
  let allCached = true;
  for (const name of names) {
    const idKey = `muscle:${normalizeName(name)}`;
    const cached = nameToIdCache.get(idKey);
    if (cached) {
      cachedIds.push(cached as string);
    } else {
      allCached = false;
      break;
    }
  }

  if (allCached && cachedIds.length === names.length) {
    return cachedIds;
  }

  const allMuscles = await prisma.muscles.findMany({
    select: { id: true, name: true },
  });

  const nameToIdMap = new Map<string, string>();
  allMuscles.forEach((m: any) => {
    nameToIdMap.set(normalizeName(m.name), m.id);
  });

  const translations = await prisma.muscle_translations.findMany({
    where: {
      name: {
        in: names.map(normalizeName),
      },
    },
    include: {
      muscles: {
        select: { id: true },
      },
    },
  });

  translations.forEach((trans: any) => {
    nameToIdMap.set(normalizeName(trans.name), trans.muscles.id);
  });

  const ids: string[] = [];
  for (const name of names) {
    const normalized = normalizeName(name);
    let id = nameToIdMap.get(normalized) || findBestMatch(name, allMuscles);

    // If not found, create new muscle with generated ID
    if (!id) {
      const trimmedName = name.trim();
      try {
        const newMuscle = await prisma.muscles.create({
          data: {
            id: createId(),
            name: trimmedName, // Use original name (English)
            slug: toSlug(trimmedName),
          },
        });
        id = newMuscle.id;
        nameToIdCache.set(`muscle:${normalized}`, id ?? '');
      } catch (error: unknown) {
        // Handle unique constraint violation (race condition)
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          Array.isArray(error.meta?.target) &&
          error.meta?.target.includes('name')
        ) {
          // Another call created the same muscle, fetch it
          const existing = await prisma.muscles.findFirst({
            where: {
              name: {
                equals: trimmedName,
                mode: 'insensitive',
              },
            },
            select: { id: true },
          });
          if (existing) {
            id = existing.id;
            nameToIdCache.set(`muscle:${normalized}`, id ?? '');
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    } else {
      nameToIdCache.set(`muscle:${normalized}`, id);
    }

    ids.push(id ?? '');
  }
  return ids;
}

/**
 * Validate body part names and return their IDs
 */
export async function validateBodyPartsByName(names: string[]): Promise<string[]> {
  if (names.length === 0) return [];

  // Check cache first - try individual lookups
  const cachedIds: string[] = [];
  let allCached = true;
  for (const name of names) {
    const idKey = `bodypart:${normalizeName(name)}`;
    const cached = nameToIdCache.get(idKey);
    if (cached) {
      cachedIds.push(cached as string);
    } else {
      allCached = false;
      break;
    }
  }

  if (allCached && cachedIds.length === names.length) {
    return cachedIds;
  }

  const allBodyParts = await prisma.body_parts.findMany({
    select: { id: true, name: true },
  });

  const nameToIdMap = new Map<string, string>();
  allBodyParts.forEach((bp: any) => {
    nameToIdMap.set(normalizeName(bp.name), bp.id);
  });

  const translations = await prisma.body_part_translations.findMany({
    where: {
      name: {
        in: names.map(normalizeName),
      },
    },
    include: {
      body_parts: {
        select: { id: true },
      },
    },
  });

  translations.forEach((trans: any) => {
    nameToIdMap.set(normalizeName(trans.name), trans.body_parts.id);
  });

  const ids: string[] = [];
  for (const name of names) {
    const normalized = normalizeName(name);
    let id = nameToIdMap.get(normalized) || findBestMatch(name, allBodyParts);

    // If not found, create new body part with generated ID
    if (!id) {
      const trimmedName = name.trim();
      try {
        const newBodyPart = await prisma.body_parts.create({
          data: {
            id: createId(),
            name: trimmedName, // Use original name (English)
            slug: toSlug(trimmedName),
          },
        });
        id = newBodyPart.id;
        nameToIdCache.set(`bodypart:${normalized}`, id ?? '');
      } catch (error: unknown) {
        // Handle unique constraint violation (race condition)
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          Array.isArray(error.meta?.target) &&
          error.meta?.target.includes('name')
        ) {
          // Another call created the same body part, fetch it
          const existing = await prisma.body_parts.findFirst({
            where: {
              name: {
                equals: trimmedName,
                mode: 'insensitive',
              },
            },
            select: { id: true },
          });
          if (existing) {
            id = existing.id;
            nameToIdCache.set(`bodypart:${normalized}`, id ?? '');
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    } else {
      nameToIdCache.set(`bodypart:${normalized}`, id);
    }

    ids.push(id ?? '');
  }

  // Cache individual mappings
  for (let i = 0; i < names.length && i < ids.length; i++) {
    const name = names[i];
    const id = ids[i];
    if (name && id) {
      nameToIdCache.set(`bodypart:${normalizeName(name)}`, id);
    }
  }
  return ids;
}

/**
 * Validate exercise type name and return its ID
 * @param name - Exercise type name to validate
 * @param sharedContext - Optional shared context from OneAgent SDK to avoid duplicate creation across parallel batches
 */
export async function validateExerciseTypeByName(
  name: string,
  sharedContext?: { metadata?: { createdExerciseTypes?: Record<string, string> } }
): Promise<string | null> {
  if (!name) return null;

  const normalized = normalizeName(name);
  const cacheKey = `exercisetype:${normalized}`;
  const cached = nameToIdCache.get(cacheKey);
  if (cached) return cached as string;

  // Check shared context first to avoid duplicate creation across parallel batches
  if (sharedContext?.metadata?.createdExerciseTypes) {
    try {
      const contextId = sharedContext.metadata.createdExerciseTypes[normalized];
      if (contextId) {
        logger.warn(
          `[MetadataValidator] Found exercise type "${name}" in shared context: ${contextId}`
        );
        nameToIdCache.set(cacheKey, contextId);
        return contextId;
      }
    } catch (error: unknown) {
      logger.warn(`[MetadataValidator] Error accessing shared context for "${name}":`, { error });
    }
  }

  const trimmedName = name.trim();

  // Check direct name (case-insensitive)
  const exerciseType = await prisma.exercise_types.findFirst({
    where: {
      name: {
        equals: trimmedName,
        mode: 'insensitive',
      },
    },
    select: { id: true, name: true },
  });

  if (exerciseType) {
    nameToIdCache.set(cacheKey, exerciseType.id);
    return exerciseType.id;
  }

  // Check translations
  const translation = await prisma.exercise_type_translations.findFirst({
    where: {
      name: {
        equals: trimmedName,
        mode: 'insensitive',
      },
    },
    include: {
      exercise_types: {
        select: { id: true },
      },
    },
  });

  if (translation) {
    nameToIdCache.set(cacheKey, translation.exercise_types.id);
    return translation.exercise_types.id;
  }

  // If not found, try to create new exercise type with generated ID
  // Use upsert pattern to handle race conditions where multiple calls try to create the same type
  try {
    const newExerciseType = await prisma.exercise_types.create({
      data: {
        id: createId(),
        name: trimmedName, // Use trimmed name (English)
      },
    });

    // Store in shared context to avoid duplicate creation in parallel batches
    if (sharedContext?.metadata?.createdExerciseTypes) {
      try {
        sharedContext.metadata.createdExerciseTypes[normalized] = newExerciseType.id;
        logger.warn(
          `[MetadataValidator] Stored exercise type "${name}" in shared context: ${newExerciseType.id}`
        );
      } catch (error: unknown) {
        logger.warn(
          `[MetadataValidator] Error storing exercise type "${name}" in shared context:`,
          { error }
        );
      }
    }

    nameToIdCache.set(cacheKey, newExerciseType.id);
    return newExerciseType.id;
  } catch (error: unknown) {
    // Handle unique constraint violation (race condition)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      Array.isArray(error.meta?.target) &&
      error.meta?.target.includes('name')
    ) {
      // Another call created the same exercise type, fetch it
      const existingType = await prisma.exercise_types.findFirst({
        where: {
          name: {
            equals: trimmedName,
            mode: 'insensitive',
          },
        },
        select: { id: true },
      });

      if (existingType) {
        // Store in shared context for future reference
        if (sharedContext?.metadata?.createdExerciseTypes) {
          sharedContext.metadata.createdExerciseTypes[normalized] = existingType.id;
        }
        nameToIdCache.set(cacheKey, existingType.id);
        return existingType.id;
      }

      // If still not found, re-throw the error
      throw error;
    }
    throw error;
  }
}
