/**
 * MCP Input Schemas
 *
 * RE-EXPORTED FROM @giulio-leone/schemas/ai
 *
 * Schemi Zod tipizzati per validazione input MCP tools.
 * Spostati in @giulio-leone/schemas per evitare cicli.
 *
 * @module lib-mcp-server/schemas
 */

import {
  MacrosSchema,
  CompleteMacrosSchema,
  FoodSchema,
  MealSchema,
  NutritionDaySchema,
  NutritionWeekSchema,
  // AI Schemas
  NutritionPlanInputSchema,
  AIOutputNutritionPlanSchema,
  // Workout
  ExerciseSetSchema,
  SetProgressionSchema,
  SetGroupSchema,
  ExerciseSchema,
  WorkoutDaySchema,
  WorkoutWeekSchema,
  WorkoutProgramInputSchema,
  AIOutputWorkoutProgramSchema,
  // Validation helpers
  validateNutritionPlan,
  validateWorkoutProgram,
} from '@giulio-leone/schemas';

// Re-export constants
export {
  MacrosSchema,
  CompleteMacrosSchema,
  FoodSchema,
  MealSchema,
  NutritionDaySchema,
  NutritionWeekSchema,
  NutritionPlanInputSchema,
  AIOutputNutritionPlanSchema,
  ExerciseSetSchema,
  SetProgressionSchema,
  SetGroupSchema,
  ExerciseSchema,
  WorkoutDaySchema,
  WorkoutWeekSchema,
  WorkoutProgramInputSchema,
  AIOutputWorkoutProgramSchema,
  validateNutritionPlan,
  validateWorkoutProgram,
};

// Re-export inferred types via utility types (using typeof ZodSchema) or import types if exported from schemas
// Since we exported types in mcp-output.schemas.ts too (implicit? No I used type aliases but not exported all)
// The original file exported types like `NutritionPlanInput`.
// I should export them too.

import type { z } from 'zod';

export type NutritionPlanInput = z.infer<typeof NutritionPlanInputSchema>;
export type WorkoutProgramInput = z.infer<typeof WorkoutProgramInputSchema>;
export type FoodInput = z.infer<typeof FoodSchema>;
export type MealInput = z.infer<typeof MealSchema>;
export type NutritionDayInput = z.infer<typeof NutritionDaySchema>;
export type NutritionWeekInput = z.infer<typeof NutritionWeekSchema>;
export type ExerciseInput = z.infer<typeof ExerciseSchema>;
export type WorkoutDayInput = z.infer<typeof WorkoutDaySchema>;
export type WorkoutWeekInput = z.infer<typeof WorkoutWeekSchema>;
export type SetGroupInput = z.infer<typeof SetGroupSchema>;
export type ExerciseSetInput = z.infer<typeof ExerciseSetSchema>;
