/**
 * MCP Exercise Create Tool
 *
 * Crea un nuovo esercizio usando nomi leggibili che vengono automaticamente
 * risolti in ID dal database.
 *
 * DESIGN RATIONALE:
 * - Schema MCP-specifico con descrizioni per guidare l'AI
 * - Risoluzione automatica name → ID per tutti i campi metadata
 * - Validazione completa prima della creazione
 * - Enum stricti per muscles e bodyParts per evitare valori inventati
 */

import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { exerciseService } from '@giulio-leone/one-workout';
import { MuscleRole } from '@prisma/client';
import {
  validateExerciseTypeByName,
  validateMusclesByName,
  validateBodyPartsByName,
  validateEquipmentByName,
} from '@giulio-leone/lib-core';

/**
 * Valid muscle names from the database catalog.
 * IMPORTANT: Do NOT invent new values - use only these exact strings.
 */
export const VALID_MUSCLES = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Abs',
  'Forearms',
] as const;

export type ValidMuscle = (typeof VALID_MUSCLES)[number];

/**
 * Valid body part names from the database catalog.
 * IMPORTANT: Do NOT invent new values - use only these exact strings.
 */
export const VALID_BODY_PARTS = ['Upper Body', 'Lower Body', 'Core', 'Full Body'] as const;

export type ValidBodyPart = (typeof VALID_BODY_PARTS)[number];

/**
 * Valid exercise type names from the database catalog.
 */
export const VALID_EXERCISE_TYPES = [
  'Strength',
  'Cardio',
  'Flexibility',
  'Balance',
  'compound',
  'isolation',
  'plyometric',
  'stretching',
  'bodyweight',
  'weighted',
] as const;

export type ValidExerciseType = (typeof VALID_EXERCISE_TYPES)[number];

/**
 * Valid equipment names from the database catalog.
 */
export const VALID_EQUIPMENT = [
  'Barbell',
  'Dumbbell',
  'Kettlebell',
  'Resistance Band',
  'Pull-up Bar',
  'Bench',
  'Cable Machine',
  'Bodyweight',
] as const;

export type ValidEquipment = (typeof VALID_EQUIPMENT)[number];

/**
 * Schema MCP con descrizioni per l'AI
 *
 * NOTA: Usa nomi leggibili invece di ID.
 * Il sistema risolve automaticamente i nomi in ID.
 * IMPORTANTE: Usa SOLO i valori enum specificati per muscles, bodyParts, exerciseType, equipment.
 */
const mcpExerciseCreateSchema = z.object({
  name: z.string().min(1).describe('Exercise name in English (e.g., "Push-up", "Bench Press")'),

  exerciseType: z
    .enum(VALID_EXERCISE_TYPES)
    .describe(`Exercise type. VALID VALUES: ${VALID_EXERCISE_TYPES.join(', ')}`),

  muscles: z
    .array(
      z.object({
        name: z
          .enum(VALID_MUSCLES)
          .describe(`Muscle name. VALID VALUES ONLY: ${VALID_MUSCLES.join(', ')}`),
        role: z.nativeEnum(MuscleRole).describe('Muscle role: PRIMARY or SECONDARY'),
      })
    )
    .min(1)
    .describe(`Target muscles with their roles. VALID MUSCLE NAMES: ${VALID_MUSCLES.join(', ')}`),

  bodyParts: z
    .array(z.enum(VALID_BODY_PARTS))
    .min(1)
    .describe(`Body parts. VALID VALUES ONLY: ${VALID_BODY_PARTS.join(', ')}`),

  equipment: z
    .array(z.enum(VALID_EQUIPMENT))
    .optional()
    .describe(`Equipment needed. VALID VALUES: ${VALID_EQUIPMENT.join(', ')}`),

  overview: z
    .string()
    .max(16000)
    .optional()
    .describe('Brief exercise description explaining what the exercise is and its benefits'),

  instructions: z
    .array(z.string().min(1).max(2000))
    .optional()
    .describe('Step-by-step execution instructions'),

  exerciseTips: z
    .array(z.string().min(1).max(2000))
    .optional()
    .describe('Tips for proper form and common mistakes to avoid'),

  variations: z
    .array(z.string().min(1).max(2000))
    .optional()
    .describe('Exercise variations and progressions'),

  keywords: z.array(z.string()).optional().describe('Search keywords for the exercise'),

  locale: z.string().default('en').describe('Language for translations (default: "en")'),
});

type McpExerciseCreateInput = z.infer<typeof mcpExerciseCreateSchema>;

export const exerciseCreateTool: McpTool = {
  name: 'exercise_create',
  description: `Creates a new exercise in the database. Requires admin privileges.

CRITICAL: You MUST use ONLY the valid values listed below. Do NOT invent new values.

VALID MUSCLES (use exact capitalization):
  - Chest, Back, Shoulders, Biceps, Triceps, Quadriceps, Hamstrings, Glutes, Calves, Abs, Forearms

VALID BODY PARTS (use exact strings):
  - "Upper Body", "Lower Body", "Core", "Full Body"

VALID EXERCISE TYPES:
  - Strength, Cardio, Flexibility, Balance, compound, isolation, plyometric, stretching, bodyweight, weighted

VALID EQUIPMENT:
  - Barbell, Dumbbell, Kettlebell, "Resistance Band", "Pull-up Bar", Bench, "Cable Machine", Bodyweight

EXAMPLE JSON:
{
  "name": "Dumbbell Bicep Curl",
  "exerciseType": "isolation",
  "muscles": [
    { "name": "Biceps", "role": "PRIMARY" },
    { "name": "Forearms", "role": "SECONDARY" }
  ],
  "bodyParts": ["Upper Body"],
  "equipment": ["Dumbbell"],
  "overview": "An isolation exercise targeting the biceps.",
  "instructions": ["Stand with dumbbells at sides", "Curl weights to shoulders", "Lower with control"],
  "exerciseTips": ["Keep elbows stationary", "Don't swing the weights"],
  "variations": ["Hammer Curl", "Concentration Curl"]
}

The tool handles ID resolution automatically. Do NOT use database IDs directly.`,

  parameters: mcpExerciseCreateSchema,

  execute: async (args: McpExerciseCreateInput, context: McpContext) => {
    if (!context.isAdmin) {
      throw new Error('Unauthorized: Admin access required for this operation');
    }

    // Resolve exerciseType name → ID
    const exerciseTypeId = await validateExerciseTypeByName(args.exerciseType);
    if (!exerciseTypeId) {
      throw new Error(
        `Invalid exercise type: "${args.exerciseType}". Use valid types like "compound", "isolation", "plyometric", "stretching", "bodyweight".`
      );
    }

    // Resolve muscle names → IDs
    const muscleNames = args.muscles.map((m: any) => m.name);
    const muscleIds = await validateMusclesByName(muscleNames);

    if (muscleIds.length !== muscleNames.length) {
      const missingMuscles = muscleNames.filter((_, i) => !muscleIds[i]);
      throw new Error(
        `Some muscles could not be resolved: ${missingMuscles.join(', ')}. Use English muscle names like "pectoralis major", "biceps brachii", "quadriceps".`
      );
    }

    const muscles = args.muscles.map((m, i) => ({
      id: muscleIds[i]!,
      role: m.role,
    }));

    // Resolve body part names → IDs
    const bodyPartIds = await validateBodyPartsByName(args.bodyParts);

    if (bodyPartIds.length !== args.bodyParts.length) {
      const missingBodyParts = args.bodyParts.filter((_, i) => !bodyPartIds[i]);
      throw new Error(
        `Some body parts could not be resolved: ${missingBodyParts.join(', ')}. Use English names like "chest", "arms", "back", "legs".`
      );
    }

    // Resolve equipment names → IDs (optional field)
    let equipmentIds: string[] = [];
    if (args.equipment && args.equipment.length > 0) {
      equipmentIds = await validateEquipmentByName(args.equipment);
    }

    // Build translations array with English as required
    const translations = [
      {
        locale: args.locale || 'en',
        name: args.name,
        description: args.overview,
        searchTerms: args.keywords || [],
      },
    ];

    // Create exercise with resolved IDs
    const exercise = await exerciseService.create(
      {
        exerciseTypeId,
        translations,
        muscles,
        bodyPartIds,
        equipmentIds: equipmentIds.length > 0 ? equipmentIds : undefined,
        overview: args.overview,
        instructions: args.instructions ?? [],
        exerciseTips: args.exerciseTips ?? [],
        variations: args.variations ?? [],
        keywords: args.keywords ?? [],
      },
      {
        userId: context.userId,
        autoApprove: true, // Auto-approve if created by admin
      }
    );

    return exercise;
  },
};
