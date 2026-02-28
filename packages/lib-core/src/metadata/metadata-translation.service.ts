/**
 * Metadata Translation Service
 *
 * Service for managing translations of exercise metadata entities:
 * - ExerciseTypes
 * - Muscles
 * - BodyParts
 * - Equipment
 * - WorkoutGoals
 *
 * NOTE: This file does not use 'server-only' because it's exported from lib-metadata
 * which may be imported in client components. The service methods themselves are
 * only executed server-side when called from API routes or server components.
 */

import { prisma } from '../prisma';
import { createId } from '@giulio-leone/lib-shared';

const DEFAULT_LOCALE = 'en';

/**
 * Generic metadata with translations
 */
export interface MetadataWithTranslations {
  name: string;
  slug?: string;
  imageUrl?: string | null;
  translations?: Array<{
    locale: string;
    name: string;
    description?: string | null;
  }>;
}

/**
 * Get localized name for metadata entity
 * Uses a map for O(1) lookup instead of multiple array iterations
 */
export function getLocalizedName(
  entity: MetadataWithTranslations,
  locale: string = DEFAULT_LOCALE
): string {
  if (!entity.translations || entity.translations.length === 0) {
    return entity.name;
  }

  // Create a lookup map for O(1) access
  const translationMap = new Map(entity.translations.map((t: any) => [t.locale, t.name]));

  // Try exact locale match
  if (translationMap.has(locale)) {
    return translationMap.get(locale)!;
  }

  // Try language prefix match (e.g., 'it' for 'it-IT')
  const languageCode = locale.split('-')[0];
  if (languageCode) {
    for (const [key, value] of translationMap.entries()) {
      if (key.startsWith(languageCode)) {
        return value;
      }
    }
  }

  // Fall back to English
  if (translationMap.has('en')) {
    return translationMap.get('en')!;
  }

  // Fall back to entity name
  return entity.name;
}

/**
 * Get all ExerciseTypes with translations
 */
export async function getExerciseTypesWithTranslations(locale?: string) {
  const types = await prisma.exercise_types.findMany({
    include: {
      exercise_type_translations: locale
        ? {
            where: {
              OR: [{ locale }, { locale: DEFAULT_LOCALE }],
            },
          }
        : true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return types.map((type: any) => {
    const translations = type.exercise_type_translations;
    const localizedName = locale
      ? getLocalizedName({ name: type.name, translations }, locale)
      : type.name;

    return {
      id: type.id,
      name: type.name,
      slug: undefined,
      imageUrl: type.imageUrl,
      localizedName,
      translations,
    };
  });
}

/**
 * Get all Muscles with translations
 */
export async function getMusclesWithTranslations(locale?: string) {
  try {
    const muscles = await prisma.muscles.findMany({
      include: {
        muscle_translations: locale
          ? {
              where: {
                OR: [{ locale }, { locale: DEFAULT_LOCALE }],
              },
            }
          : true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return muscles.map((muscle: any) => {
      const translations = muscle.muscle_translations;
      const localizedName = locale
        ? getLocalizedName({ name: muscle.name, translations }, locale)
        : muscle.name;

      return {
        id: muscle.id,
        name: muscle.name,
        slug: muscle.slug,
        imageUrl: muscle.imageUrl,
        localizedName,
        translations,
      };
    });
  } catch (_error: unknown) {
    throw _error; // Re-throw to be caught by caller
  }
}

/**
 * Get all BodyParts with translations
 */
export async function getBodyPartsWithTranslations(locale?: string) {
  const bodyParts = await prisma.body_parts.findMany({
    include: {
      body_part_translations: locale
        ? {
            where: {
              OR: [{ locale }, { locale: DEFAULT_LOCALE }],
            },
          }
        : true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return bodyParts.map((bodyPart: any) => {
    const translations = bodyPart.body_part_translations;
    const localizedName = locale
      ? getLocalizedName({ name: bodyPart.name, translations }, locale)
      : bodyPart.name;

    return {
      id: bodyPart.id,
      name: bodyPart.name,
      slug: bodyPart.slug,
      imageUrl: bodyPart.imageUrl,
      localizedName,
      translations,
    };
  });
}

/**
 * Get all Equipment with translations
 */
export async function getEquipmentWithTranslations(locale?: string) {
  const equipment = await prisma.equipments.findMany({
    include: {
      equipment_translations: locale
        ? {
            where: {
              OR: [{ locale }, { locale: DEFAULT_LOCALE }],
            },
          }
        : true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return equipment.map((equip: any) => {
    const translations = equip.equipment_translations;
    const localizedName = locale
      ? getLocalizedName({ name: equip.name, translations }, locale)
      : equip.name;

    return {
      id: equip.id,
      name: equip.name,
      slug: equip.slug,
      imageUrl: equip.imageUrl,
      localizedName,
      translations,
    };
  });
}

/**
 * Get all WorkoutGoals with translations
 */
export async function getWorkoutGoalsWithTranslations(locale?: string) {
  try {
    const goals = await prisma.workout_goals.findMany({
      include: {
        workout_goal_translations: locale
          ? {
              where: {
                OR: [{ locale }, { locale: DEFAULT_LOCALE }],
              },
            }
          : true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return goals.map((goal: any) => {
      const translations = goal.workout_goal_translations;
      const localizedName = locale
        ? getLocalizedName({ name: goal.name, translations }, locale)
        : goal.name;

      return {
        id: goal.id,
        name: goal.name,
        slug: goal.slug || '',
        localizedName,
        translations,
      };
    });
  } catch (_error: unknown) {
    // Return empty array instead of throwing to prevent breaking the entire metadata endpoint
    // The frontend will handle empty arrays gracefully
    return [];
  }
}

/**
 * Create or update ExerciseType translation
 */
export async function upsertExerciseTypeTranslation(
  exerciseTypeId: string,
  locale: string,
  name: string,
  description?: string
) {
  return prisma.exercise_type_translations.upsert({
    where: {
      exerciseTypeId_locale: {
        exerciseTypeId,
        locale,
      },
    },
    update: {
      name,
      description,
    },
    create: {
      id: createId(),
      exerciseTypeId,
      locale,
      name,
      description,
      updatedAt: new Date(),
    },
  });
}

/**
 * Create or update Muscle translation
 */
export async function upsertMuscleTranslation(
  muscleId: string,
  locale: string,
  name: string,
  description?: string
) {
  return prisma.muscle_translations.upsert({
    where: {
      muscleId_locale: {
        muscleId,
        locale,
      },
    },
    update: {
      name,
      description,
    },
    create: {
      id: createId(),
      muscleId,
      locale,
      name,
      description,
      updatedAt: new Date(),
    },
  });
}

/**
 * Create or update BodyPart translation
 */
export async function upsertBodyPartTranslation(
  bodyPartId: string,
  locale: string,
  name: string,
  description?: string
) {
  return prisma.body_part_translations.upsert({
    where: {
      bodyPartId_locale: {
        bodyPartId,
        locale,
      },
    },
    update: {
      name,
      description,
    },
    create: {
      id: createId(),
      bodyPartId,
      locale,
      name,
      description,
      updatedAt: new Date(),
    },
  });
}

/**
 * Create or update Equipment translation
 */
export async function upsertEquipmentTranslation(
  equipmentId: string,
  locale: string,
  name: string,
  description?: string
) {
  return prisma.equipment_translations.upsert({
    where: {
      equipmentId_locale: {
        equipmentId,
        locale,
      },
    },
    update: {
      name,
      description,
    },
    create: {
      id: createId(),
      equipmentId,
      locale,
      name,
      description,
      updatedAt: new Date(),
    },
  });
}

/**
 * Verifica se una stringa è un ID (CUID) o un nome
 * I CUIDs tipicamente iniziano con 'c' e hanno una lunghezza di ~25 caratteri
 * I workout goal IDs iniziano con 'clx_goal_'
 */
export function isMetadataId(value: string, prefix?: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  // Se specificato un prefix (es. 'clx_goal_'), verifica che inizi con quello
  if (prefix) {
    return value.startsWith(prefix);
  }

  // Verifica se è un CUID standard (inizia con 'c' e ha ~25 caratteri)
  if (/^c[a-z0-9]{24,}$/i.test(value)) {
    return true;
  }

  // Verifica se è un workout goal ID
  if (value.startsWith('clx_goal_')) {
    return true;
  }

  return false;
}

/**
 * Converte array di workout goal names → IDs
 * Se alcuni valori sono già ID, li mantiene.
 * Se alcuni valori sono nomi, li converte in ID cercando per name nel database.
 * @param values - Array di nomi o ID di workout goals
 * @returns Array di ID di workout goals
 */
export async function convertWorkoutGoalNamesToIds(values: string[]): Promise<string[]> {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }

  // Separare ID e nomi
  const ids: string[] = [];
  const names: string[] = [];

  for (const value of values) {
    if (!value || typeof value !== 'string') {
      continue;
    }

    if (isMetadataId(value, 'clx_goal_')) {
      // Già un ID, mantenerlo
      ids.push(value);
    } else {
      // Sembra un nome, da convertire
      names.push(value);
    }
  }

  // Se non ci sono nomi da convertire, ritorna gli ID
  if (names.length === 0) {
    return ids;
  }

  // Carica tutti i workout goals dal database per fare la conversione
  try {
    const workoutGoals = await getWorkoutGoalsWithTranslations('en');

    // Crea una mappa name → id (case-insensitive per robustezza)
    const nameToIdMap = new Map<string, string>();
    for (const goal of workoutGoals) {
      // Mappa sia il name che eventuali localizedName
      nameToIdMap.set(goal.name.toUpperCase(), goal.id);
      if (goal.localizedName && goal.localizedName !== goal.name) {
        nameToIdMap.set(goal.localizedName.toUpperCase(), goal.id);
      }
    }

    // Converti i nomi in ID
    const convertedIds = names
      .map((name: any) => {
        const normalizedName = name.toUpperCase();
        return nameToIdMap.get(normalizedName);
      })
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    // Ritorna tutti gli ID (quelli già ID + quelli convertiti)
    return Array.from(new Set([...ids, ...convertedIds]));
  } catch (_error: unknown) {
    // In caso di errore, ritorna almeno gli ID già presenti
    return ids;
  }
}

/**
 * Get all metadata for a locale (for dropdown/selector components)
 */
export async function getAllMetadataForLocale(locale: string = DEFAULT_LOCALE) {
  try {
    const [exerciseTypes, muscles, bodyParts, equipment, workoutGoals] = await Promise.all([
      getExerciseTypesWithTranslations(locale).catch(() => []),
      getMusclesWithTranslations(locale).catch(() => []),
      getBodyPartsWithTranslations(locale).catch(() => []),
      getEquipmentWithTranslations(locale).catch(() => []),
      getWorkoutGoalsWithTranslations(locale).catch(() => []),
    ]);

    return {
      exerciseTypes,
      muscles,
      bodyParts,
      equipment,
      workoutGoals,
    };
  } catch (_error: unknown) {
    // Return empty structure instead of throwing to prevent breaking the API
    return {
      exerciseTypes: [],
      muscles: [],
      bodyParts: [],
      equipment: [],
      workoutGoals: [],
    };
  }
}
