/**
 * Catalog MCP Tools
 *
 * Tools for AI to search and lookup exercises/foods from the catalog.
 *
 * These tools allow Copilot to:
 * - Find exercises by name/muscle/equipment
 * - Find foods by name
 * - Get catalog IDs for adding to programs/plans
 */

import { z } from 'zod';
import { prisma } from '@giulio-leone/lib-core';
import type { McpTool } from '../../types';

// ============================================================================
// Search Exercise Catalog Tool
// ============================================================================

const searchExerciseCatalogParams = z.object({
  query: z.string().describe('Search query - exercise name or muscle group'),
  limit: z.number().optional().default(10).describe('Maximum results to return'),
});

export const searchExerciseCatalogTool: McpTool<
  z.infer<typeof searchExerciseCatalogParams>,
  unknown
> = {
  name: 'search_exercise_catalog',
  description: `Search the exercise catalog to find exercises.
Use this tool when you need to:
- Find an exercise by name (e.g., "squat", "bench press")
- Find exercises targeting a muscle group (e.g., "chest", "legs")
- Get the catalog ID needed to add an exercise to a workout

Returns matching exercises with their IDs and names.`,
  parameters: searchExerciseCatalogParams,
  execute: async ({ query, limit }) => {
    const normalizedQuery = query.toLowerCase().trim();
    const limitValue = limit ?? 10;

    try {
      // Search exercises via translations (for multi-language support)
      const exercises = await prisma.exercise_translations.findMany({
        where: {
          name: { contains: normalizedQuery, mode: 'insensitive' },
        },
        select: {
          exerciseId: true,
          locale: true,
          name: true,
          exercises: {
            select: {
              id: true,
              slug: true,
              approvalStatus: true,
              exercise_muscles: {
                select: {
                  role: true,
                  muscles: { select: { name: true } },
                },
              },
              exercise_equipments: {
                select: { equipments: { select: { name: true } } },
              },
            },
          },
        },
        take: limitValue * 2, // Get more to dedupe by exerciseId
      });

      // Dedupe by exerciseId (prefer 'it' then 'en')
      const seen = new Map<string, (typeof exercises)[0]>();
      for (const ex of exercises) {
        if (!seen.has(ex.exerciseId)) {
          seen.set(ex.exerciseId, ex);
        } else if (ex.locale === 'it') {
          seen.set(ex.exerciseId, ex);
        }
      }

      const deduped = Array.from(seen.values()).slice(0, limitValue);

      if (deduped.length === 0) {
        return {
          success: true,
          found: 0,
          message: `No exercises found matching "${query}". Try a different search term.`,
          exercises: [],
        };
      }

      return {
        success: true,
        found: deduped.length,
        exercises: deduped.map((e: any) => ({
          catalogExerciseId: e.exerciseId, // This ID is needed to add the exercise
          name: e.name,
          muscles: e.exercises.exercise_muscles.map((m: any) => m.muscles.name),
          equipment: e.exercises.exercise_equipments.map((eq: any) => eq.equipments.name),
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to search exercises: ${(error as Error).message}`,
      };
    }
  },
};

// ============================================================================
// Search Food Catalog Tool
// ============================================================================

const searchFoodCatalogParams = z.object({
  query: z.string().describe('Search query - food name'),
  limit: z.number().optional().default(10).describe('Maximum results to return'),
});

export const searchFoodCatalogTool: McpTool<z.infer<typeof searchFoodCatalogParams>, unknown> = {
  name: 'search_food_catalog',
  description: `Search the food catalog to find foods/ingredients.
Use this tool when you need to:
- Find a food by name (e.g., "chicken", "rice", "salmon")
- Get the catalog ID needed to add a food to a nutrition plan
- Get nutritional information (protein, carbs, fats per 100g)

Returns matching foods with their IDs, names, and macros.`,
  parameters: searchFoodCatalogParams,
  execute: async ({ query, limit }) => {
    const normalizedQuery = query.toLowerCase().trim();
    const limitValue = limit ?? 10;

    try {
      // Search food items by name
      const foods = await prisma.food_items.findMany({
        where: {
          OR: [
            { name: { contains: normalizedQuery, mode: 'insensitive' } },
            { nameNormalized: { contains: normalizedQuery, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          macrosPer100g: true,
          servingSize: true,
          unit: true,
        },
        take: limitValue,
      });

      if (foods.length === 0) {
        return {
          success: true,
          found: 0,
          message: `No foods found matching "${query}". Try a different search term.`,
          foods: [],
        };
      }

      return {
        success: true,
        found: foods.length,
        foods: foods.map((f: any) => {
          const macros = f.macrosPer100g as {
            protein?: number;
            carbs?: number;
            fats?: number;
            calories?: number;
          } | null;
          return {
            catalogFoodId: f.id, // This ID is needed to add the food
            name: f.name,
            serving: `${f.servingSize}${f.unit}`,
            macrosPer100g: {
              protein: macros?.protein ?? 0,
              carbs: macros?.carbs ?? 0,
              fats: macros?.fats ?? 0,
              calories: macros?.calories ?? 0,
            },
          };
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to search foods: ${(error as Error).message}`,
      };
    }
  },
};

// ============================================================================
// Export All Catalog Tools
// ============================================================================

export const catalogTools = {
  search_exercise_catalog: searchExerciseCatalogTool,
  search_food_catalog: searchFoodCatalogTool,
};
