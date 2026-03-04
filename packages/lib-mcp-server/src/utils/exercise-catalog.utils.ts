/**
 * Exercise Catalog Utilities
 *
 * Server-side functions for resolving exercise names to catalog IDs.
 * Used by MCP tools to fuzzy match exercises when AI provides only a name.
 *
 * Schema: exercises has no 'name' field - names are in exercise_translations
 */

import { getDbClient } from '@giulio-leone/core';
const prisma = getDbClient() as import('@prisma/client').PrismaClient;

// ============================================================================
// Types
// ============================================================================

export interface ResolvedExercise {
  catalogExerciseId: string;
  name: string;
  nameIt?: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
}

// ============================================================================
// Fuzzy Search Functions
// ============================================================================

/**
 * Normalize text for fuzzy matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .trim();
}

/**
 * Calculate similarity score between two strings
 * Returns 0-100 (higher = more similar)
 */
function similarityScore(a: string, b: string): number {
  const aNorm = normalizeText(a);
  const bNorm = normalizeText(b);

  if (aNorm === bNorm) return 100;
  if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) return 80;

  const aWords = aNorm.split(/\s+/);
  const bWords = bNorm.split(/\s+/);
  const matchingWords = aWords.filter((w: any) => bWords.some((bw) => bw.includes(w) || w.includes(bw)));

  if (matchingWords.length > 0) {
    return 50 + (matchingWords.length / Math.max(aWords.length, bWords.length)) * 30;
  }

  return 0;
}

/**
 * Resolve an exercise by name using fuzzy matching.
 * Queries exercise_translations for the best match.
 *
 * @param name - Exercise name (can be partial, in any language)
 * @returns Resolved exercise with catalogExerciseId, or null if no match
 */
export async function resolveExerciseByName(name: string): Promise<ResolvedExercise | null> {
  console.log('[ExerciseCatalog] 🔍 Resolving exercise:', { name });

  // Query exercise_translations for matching names
  const translations = await prisma.exercise_translations.findMany({
    where: {
      name: { contains: name, mode: 'insensitive' },
    },
    include: {
      exercises: {
        include: {
          exercise_translations: true,
          exercise_muscles: {
            include: {
              muscles: true,
            },
          },
          exercise_equipments: {
            include: {
              equipments: true,
            },
          },
        },
      },
    },
    take: 20,
  });

  if (translations.length === 0) {
    console.log('[ExerciseCatalog] ❌ No matches found for:', name);
    return null;
  }

  // Score each exercise
  const rawScored = translations.map((trans: (typeof translations)[number]) => {
    const exercise = trans.exercises;
    if (!exercise) return null;

    const allNames = exercise.exercise_translations.map((t: { name: string }) => t.name);
    const maxScore = Math.max(...allNames.map((n: string) => similarityScore(n, name)));

    return { exercise, score: maxScore, translation: trans };
  });

  type ScoredItem = NonNullable<(typeof rawScored)[number]>;
  const scored = rawScored.filter((s: (typeof rawScored)[number]): s is ScoredItem => s !== null);

  if (scored.length === 0) {
    console.log('[ExerciseCatalog] ❌ No valid exercises found');
    return null;
  }

  // Sort by score descending
  scored.sort((a: (typeof scored)[number], b: (typeof scored)[number]) => b.score - a.score);

  const best = scored[0];

  if (!best || best.score < 30) {
    console.log('[ExerciseCatalog] ⚠️ Low confidence match:', {
      name,
      bestMatch: best?.translation.name,
      score: best?.score,
    });
    return null;
  }

  const ex = best.exercise!;

  // Get English and Italian translations
  const enTranslation = ex.exercise_translations.find((t: { locale: string }) => t.locale === 'en');
  const itTranslation = ex.exercise_translations.find((t: { locale: string }) => t.locale === 'it');

  const result: ResolvedExercise = {
    catalogExerciseId: ex.id,
    name: enTranslation?.name || best.translation.name,
    nameIt: itTranslation?.name,
    category: 'strength', // exercises table doesn't have category field
    muscleGroups: ex.exercise_muscles
      .map((m: { muscles?: { name?: string } }) => m.muscles?.name)
      .filter(Boolean) as string[],
    equipment: ex.exercise_equipments
      .map((e: { equipments?: { name?: string } }) => e.equipments?.name)
      .filter(Boolean) as string[],
  };

  console.log('[ExerciseCatalog] ✅ Resolved:', {
    input: name,
    output: result.name,
    catalogExerciseId: result.catalogExerciseId,
    score: best.score,
  });

  return result;
}

/**
 * Search exercises by query (for listing suggestions)
 */
export async function searchExercisesCatalog(
  query: string,
  limit = 10
): Promise<ResolvedExercise[]> {
  const translations = await prisma.exercise_translations.findMany({
    where: {
      name: { contains: query, mode: 'insensitive' },
    },
    include: {
      exercises: {
        include: {
          exercise_translations: true,
          exercise_muscles: {
            include: {
              muscles: true,
            },
          },
          exercise_equipments: {
            include: {
              equipments: true,
            },
          },
        },
      },
    },
    take: limit,
  });

  // Dedupe by exercise ID
  const seen = new Set<string>();
  const results: ResolvedExercise[] = [];

  for (const trans of translations) {
    const ex = trans.exercises;
    if (!ex || seen.has(ex.id)) continue;
    seen.add(ex.id);

    const enTranslation = ex.exercise_translations.find(
      (t: { locale: string }) => t.locale === 'en'
    );
    const itTranslation = ex.exercise_translations.find(
      (t: { locale: string }) => t.locale === 'it'
    );

    results.push({
      catalogExerciseId: ex.id,
      name: enTranslation?.name || trans.name,
      nameIt: itTranslation?.name,
      category: 'strength',
      muscleGroups: ex.exercise_muscles
        .map((m: { muscles?: { name?: string } }) => m.muscles?.name)
        .filter(Boolean) as string[],
      equipment: ex.exercise_equipments
        .map((e: { equipments?: { name?: string } }) => e.equipments?.name)
        .filter(Boolean) as string[],
    });
  }

  return results;
}
