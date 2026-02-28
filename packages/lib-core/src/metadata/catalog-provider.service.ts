/**
 * Catalog Provider Service
 *
 * Provides intelligent exercise matching with duplicate prevention.
 * Manages the exercise catalog for AI agents.
 *
 * NOTE: Food creation logic is handled by FoodAutoCreationService (SSOT).
 * This service only provides food instructions helper.
 *
 * NOTE: This file does not use 'server-only' because it's exported from lib-metadata
 * which is imported by one-agent package used in client components. The service
 * methods themselves are only executed server-side when called from API routes
 * or server components.
 */

import { prisma } from '../prisma';
import { logger } from '../logger.service';
import type { ExerciseCatalogItem } from '../types/safe-types';
// Cache configuration for exercises (still useful for common exercises)
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes
let exerciseCatalogCache: ExerciseCatalogItem[] | null = null;
let exerciseCacheTime = 0;

// Exercise catalog configuration
const DEFAULT_LOCALE = 'en';
const MAX_EXERCISE_CATALOG = 200; // Exercises are finite and well-defined

export class CatalogProviderService {
  // ============================================================================
  // STRING MATCHING UTILITIES (used for exercise matching)
  // ============================================================================

  /**
   * Calculate Levenshtein distance between two strings
   * Used for fuzzy string matching in exercise catalog
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      if (matrix[0]) {
        matrix[0][j] = j;
      }
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        const row = matrix[i];
        const prevRow = matrix[i - 1];
        if (row && prevRow) {
          row[j] = Math.min(
            (prevRow[j] ?? Infinity) + 1,
            (row[j - 1] ?? Infinity) + 1,
            (prevRow[j - 1] ?? Infinity) + cost
          );
        }
      }
    }

    const result = matrix[len1]?.[len2];
    return result ?? Math.max(len1, len2);
  }

  /**
   * Calculate similarity score between two strings (0-1)
   * Higher score = more similar. Used for exercise name matching.
   */
  private static stringSimilarity(str1: string, str2: string): number {
    const normalized1 = str1.toLowerCase().trim();
    const normalized2 = str2.toLowerCase().trim();

    if (normalized1 === normalized2) return 1.0;

    const maxLen = Math.max(normalized1.length, normalized2.length);
    if (maxLen === 0) return 1.0;

    const distance = this.levenshteinDistance(normalized1, normalized2);
    return 1 - distance / maxLen;
  }

  // ============================================================================
  // EXERCISE CATALOG
  // ============================================================================

  /**
   * Get cached exercise catalog for AI agents
   * Returns approved exercises with their IDs and metadata
   * Exercises are finite and well-defined, so catalog approach works well
   */
  static async getExerciseCatalog(): Promise<ExerciseCatalogItem[]> {
    const now = Date.now();

    // Return cached data if still valid
    if (exerciseCatalogCache && now - exerciseCacheTime < CACHE_TTL_MS) {
      return exerciseCatalogCache;
    }

    try {
      // Query approved exercises - no arbitrary limit
      const exercises = await prisma.exercises.findMany({
        take: MAX_EXERCISE_CATALOG,
        where: {
          approvalStatus: 'APPROVED', // Only approved exercises
        },
        orderBy: {
          createdAt: 'asc', // Older = more common/verified
        },
        include: {
          exercise_translations: {
            where: { locale: DEFAULT_LOCALE },
            take: 1,
          },
          exercise_muscles: {
            include: {
              muscles: {
                include: {
                  muscle_translations: {
                    where: { locale: DEFAULT_LOCALE },
                    take: 1,
                  },
                },
              },
            },
          },
          exercise_equipments: {
            include: {
              equipments: {
                include: {
                  equipment_translations: {
                    where: { locale: DEFAULT_LOCALE },
                    take: 1,
                  },
                },
              },
            },
          },
          exercise_types: true,
        },
      });

      type ExerciseWithRelations = {
        id: string;
        slug: string;
        exerciseTypeId: string | null;
        exercise_translations: Array<{ name: string }>;
        exercise_muscles: Array<{
          muscles: {
            slug: string;
            muscle_translations: Array<{ name: string }>;
          };
        }>;
        exercise_equipments: Array<{
          equipments: {
            slug: string;
            equipment_translations: Array<{ name: string }>;
          };
        }>;
        exercise_types: { name: string } | null;
      };

      const catalog: ExerciseCatalogItem[] = exercises.map((exercise: ExerciseWithRelations) => {
        const translation = exercise.exercise_translations[0];
        const muscleGroups = exercise.exercise_muscles.map((em: any) => {
          const muscleTrans = em.muscles.muscle_translations[0];
          return muscleTrans?.name || em.muscles.slug;
        });
        const equipment = exercise.exercise_equipments.map((ee: any) => {
          const eqTrans = ee.equipments.equipment_translations[0];
          return eqTrans?.name || ee.equipments.slug;
        });

        // Determine difficulty from exerciseTypeId or default to INTERMEDIATE
        let difficulty = 'INTERMEDIATE';
        if (exercise.exerciseTypeId?.includes('beginner')) difficulty = 'BEGINNER';
        else if (exercise.exerciseTypeId?.includes('advanced')) difficulty = 'ADVANCED';

        // Determine category from type or default to 'strength'
        const category = exercise.exercise_types?.name?.toLowerCase() || 'strength';

        return {
          id: exercise.id,
          name: translation?.name || exercise.slug,
          muscleGroups,
          equipment,
          difficulty,
          category,
        };
      });

      exerciseCatalogCache = catalog;
      exerciseCacheTime = now;
      return catalog;
    } catch (error: unknown) {
      logger.error('[CatalogProvider] Error loading exercise catalog:', error);
      return exerciseCatalogCache ?? []; // Return stale cache on error
    }
  }

  /**
   * Format exercise catalog as string for AI prompt inclusion
   * Optimized for token efficiency
   */
  static formatExerciseCatalogForPrompt(exercises: ExerciseCatalogItem[]): string {
    if (exercises.length === 0) return '';

    const lines = exercises.map((ex: any) => {
      const muscles = ex.muscleGroups.slice(0, 3).join(', '); // Limit to 3 main muscles
      const equip = ex.equipment.length > 0 ? ex.equipment.slice(0, 2).join(', ') : 'bodyweight';
      return `- ${ex.id}: ${ex.name} [${ex.category}] (${muscles}) - ${equip}`;
    });

    return `\nAVAILABLE EXERCISES (use these IDs with exerciseId field):\n${lines.join('\n')}\n`;
  }

  /**
   * Match exercise by name from catalog
   * Uses multi-layer matching:
   * 1. Exact name match (90% threshold)
   * 2. SearchTerms match (80% threshold) - aliases and variations
   *
   * Used when AI doesn't provide exerciseId
   */
  static async matchExerciseByName(exerciseName: string): Promise<string | null> {
    try {
      // Normalize input name
      const normalizedInput = exerciseName.toLowerCase().trim();

      // First: Try exact name match from cached catalog (fast path)
      const catalog = await this.getExerciseCatalog();

      let bestMatch: ExerciseCatalogItem | null = null;
      let bestScore = 0;

      for (const exercise of catalog) {
        const score = this.stringSimilarity(exerciseName, exercise.name);

        if (score > bestScore) {
          bestScore = score;
          bestMatch = exercise;
        }
      }

      // Return if name match is good enough (90% threshold)
      if (bestMatch && bestScore >= 0.9) {
        logger.warn(
          `[CatalogProvider] Exercise match (name): "${exerciseName}" -> "${bestMatch.name}" (score: ${(bestScore * 100).toFixed(1)}%)`
        );
        return bestMatch.id;
      }

      // Second: Try searchTerms match (lower threshold - 80%)
      const searchTermsMatch = await this.matchExerciseBySearchTerms(normalizedInput);
      if (searchTermsMatch) {
        return searchTermsMatch;
      }

      // If name match has reasonable score (>= 0.75), use it as fallback
      if (bestMatch && bestScore >= 0.75) {
        logger.warn(
          `[CatalogProvider] Exercise match (fallback): "${exerciseName}" -> "${bestMatch.name}" (score: ${(bestScore * 100).toFixed(1)}%)`
        );
        return bestMatch.id;
      }

      logger.warn(`[CatalogProvider] No exercise match found for: "${exerciseName}"`);
      return null;
    } catch (error: unknown) {
      logger.error('[CatalogProvider] Error matching exercise:', error);
      return null;
    }
  }

  /**
   * Match exercise using searchTerms field (aliases/variations)
   * Queries database for exercises with searchTerms containing similar strings
   */
  private static async matchExerciseBySearchTerms(searchQuery: string): Promise<string | null> {
    try {
      const SEARCH_TERMS_THRESHOLD = 0.8; // 80% for aliases

      // Query exercises with their searchTerms
      const exercisesWithSearchTerms = await prisma.exercise_translations.findMany({
        where: {
          NOT: {
            searchTerms: {
              isEmpty: true,
            },
          },
          exercises: {
            approvalStatus: 'APPROVED',
          },
        },
        select: {
          exerciseId: true,
          name: true,
          searchTerms: true,
          locale: true,
        },
      });

      let bestMatch: { exerciseId: string; name: string; matchedTerm: string } | null = null;
      let bestScore = 0;

      for (const translation of exercisesWithSearchTerms) {
        // Check against each searchTerm
        for (const term of translation.searchTerms) {
          const normalizedTerm = term.toLowerCase().trim();
          const score = this.stringSimilarity(searchQuery, normalizedTerm);

          if (score > bestScore) {
            bestScore = score;
            bestMatch = {
              exerciseId: translation.exerciseId,
              name: translation.name,
              matchedTerm: term,
            };
          }
        }
      }

      if (bestMatch && bestScore >= SEARCH_TERMS_THRESHOLD) {
        logger.warn(
          `[CatalogProvider] Exercise match (searchTerms): "${searchQuery}" -> "${bestMatch.name}" via term "${bestMatch.matchedTerm}" (score: ${(bestScore * 100).toFixed(1)}%)`
        );
        return bestMatch.exerciseId;
      }

      return null;
    } catch (error: unknown) {
      logger.error('[CatalogProvider] Error matching by searchTerms:', error);
      return null;
    }
  }

  /**
   * Clear exercise cache (useful for testing or manual refresh)
   */
  static clearCache(): void {
    exerciseCatalogCache = null;
    exerciseCacheTime = 0;
  }
}
