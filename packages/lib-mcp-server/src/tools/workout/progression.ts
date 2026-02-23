/**
 * MCP Tool: Workout Progression
 *
 * Tools for managing and applying workout progressions.
 *
 * @module lib-mcp-server/tools/workout/progression
 */

import { z } from 'zod';
import type { McpTool } from '../../types';
import {
  WorkoutProgressionService,
  ProgressionTemplateService,
  type ProgressionParams,
} from '@giulio-leone/one-workout';
import { aiWorkoutProgramSchema } from '@giulio-leone/schemas';
import { normalizeWorkoutProgram } from './program-normalizer';

/**
 * Schema for Progression Parameters
 */
const ProgressionParamsSchema = z.object({
  type: z.enum(['linear_weight', 'linear_reps', 'percentage', 'rpe']),
  startValue: z.number(),
  increment: z.number(),
  frequency: z.number(),
  targetSetIndex: z.number().optional(),
});

/**
 * Apply Progression Tool
 */
const applyProgressionParamsSchema = z.object({
  program: aiWorkoutProgramSchema,
  targetExerciseName: z
    .string()
    .describe('Name of the exercise to apply progression to (fuzzy match)'),
  params: ProgressionParamsSchema,
});

type ApplyProgressionParams = z.infer<typeof applyProgressionParamsSchema>;

export const workoutApplyProgressionTool: McpTool<ApplyProgressionParams> = {
  name: 'workout_apply_progression',
  description:
    'Applies a progression logic to a specific exercise across the entire workout program.',
  parameters: applyProgressionParamsSchema,
  execute: async (args) => {
    const { program, targetExerciseName, params } = args;
    const normalizedProgram = normalizeWorkoutProgram(program);

    // 1. Group exercises to find the target
    const groups = WorkoutProgressionService.groupExercises(normalizedProgram);
    const targetGroup = groups.find(
      (g) =>
        g.name.toLowerCase().includes(targetExerciseName.toLowerCase()) ||
        g.exerciseId.toLowerCase().includes(targetExerciseName.toLowerCase())
    );

    if (!targetGroup) {
      return {
        success: false,
        error: `Exercise '${targetExerciseName}' not found in the program.`,
      };
    }

    // 2. Calculate preview (apply to all occurrences by default for AI automation)
    const allIndices = targetGroup.occurrences.map((_, i) => i);
    const updates = WorkoutProgressionService.previewProgression(
      targetGroup.occurrences,
      params as ProgressionParams,
      allIndices
    );

    // 3. Apply updates
    const updatedProgram = WorkoutProgressionService.applyToProgram(normalizedProgram, updates);

    return {
      success: true,
      program: updatedProgram,
      appliedTo: targetGroup.name,
      occurrencesCount: updates.length,
    };
  },
};

/**
 * Granular Modification Tool
 */
const granularUpdateParamsSchema = z.object({
  program: aiWorkoutProgramSchema,
  targetExerciseName: z.string(),
  weekNumber: z.number(),
  dayNumber: z.number(), // To identify the specific session
  modifications: z.object({
    weight: z.number().optional(),
    reps: z.number().optional(),
    sets: z.number().optional(),
    rpe: z.number().optional(),
    intensityPercent: z.number().optional(),
    rest: z.number().optional(),
  }),
});

type GranularUpdateParams = z.infer<typeof granularUpdateParamsSchema>;

export const workoutGranularUpdateTool: McpTool<GranularUpdateParams> = {
  name: 'workout_granular_update',
  description:
    'Modifies a specific exercise session (granular update). e.g. "Increase sets to 4 in Week 2 Day 1 for Bench Press".',
  parameters: granularUpdateParamsSchema,
  execute: async (args) => {
    const { program, targetExerciseName, weekNumber, dayNumber, modifications } = args;
    const normalizedProgram = normalizeWorkoutProgram(program);

    // 1. Group to find occurrences
    const groups = WorkoutProgressionService.groupExercises(normalizedProgram);
    const targetGroup = groups.find(
      (g) =>
        g.name.toLowerCase().includes(targetExerciseName.toLowerCase()) ||
        g.exerciseId.toLowerCase().includes(targetExerciseName.toLowerCase())
    );

    if (!targetGroup) {
      return { success: false, error: `Exercise '${targetExerciseName}' not found.` };
    }

    // 2. Find specific occurrence index
    const occurrence = targetGroup.occurrences.find(
      (o) => o.weekNumber === weekNumber && o.dayNumber === dayNumber
    );

    if (!occurrence) {
      return {
        success: false,
        error: `Session Week ${weekNumber} Day ${dayNumber} not found for this exercise.`,
      };
    }

    // 3. Construct Update
    // We need to modify the occurrence deeply
    const newOcc = JSON.parse(JSON.stringify(occurrence)) as typeof occurrence;
    const group = newOcc.exercise.setGroups?.[0];

    if (!group) {
      return {
        success: false,
        error: 'No set group available for the selected exercise occurrence.',
      };
    }

    if (modifications.sets !== undefined) {
      WorkoutProgressionService.resizeSetGroup(group, modifications.sets);
    }

    // Apply other mods to all sets
    const { sets, ...setData } = modifications;
    if (Object.keys(setData).length > 0) {
      group.baseSet = { ...group.baseSet, ...setData };
      group.sets = (group.sets ?? []).map((s) => ({ ...s, ...setData }));
    }

    // 4. Apply
    const updatedProgram = WorkoutProgressionService.applyToProgram(normalizedProgram, [newOcc]);

    return {
      success: true,
      program: updatedProgram,
      message: `Updated ${targetExerciseName} in Week ${weekNumber} Day ${dayNumber}`,
    };
  },
};

/**
 * Save Template Tool
 */
const saveTemplateParamsSchema = ProgressionParamsSchema.extend({
  name: z.string(),
  description: z.string().optional(),
});

type SaveTemplateParams = z.infer<typeof saveTemplateParamsSchema>;

export const workoutSaveProgressionTemplateTool: McpTool<SaveTemplateParams> = {
  name: 'workout_save_progression_template',
  description: 'Saves a progression configuration as a reusable template.',
  parameters: saveTemplateParamsSchema,
  execute: async (args, context) => {
    if (!context.userId) throw new Error('Authentication required');

    const { name, description, ...params } = args;
    const template = await ProgressionTemplateService.create(context.userId, {
      name,
      description,
      ...params,
    });
    return {
      success: true,
      templateId: template.id,
    };
  },
};

/**
 * List Templates Tool
 */
export const workoutListProgressionTemplatesTool: McpTool<Record<string, never>> = {
  name: 'workout_list_progression_templates',
  description: 'Lists all saved progression templates.',
  parameters: z.object({}),
  execute: async (_, context) => {
    if (!context.userId) throw new Error('Authentication required');

    const templates = await ProgressionTemplateService.list(context.userId);
    return {
      success: true,
      templates,
    };
  },
};
