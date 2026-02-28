/**
 * Workout Modification Tool
 *
 * Generated using createAgenticTool factory with domain-specific action handlers.
 * Replaces the legacy workoutApplyModificationTool with a framework-based approach.
 *
 * @module lib-mcp-server/tools/workout/workout.tool
 */

import { z } from 'zod';
import { prisma } from '@giulio-leone/lib-core';
import { toPrismaJsonValue } from '@giulio-leone/lib-shared';
import { normalizeWorkoutProgram } from './program-normalizer';
import { workoutActions, type WorkoutProgramData, type AgenticActionHandler } from './workout.actions';
import type { McpTool, McpContext } from '../../types';

/** Factory that builds an McpTool from domain-specific action handlers */
function createAgenticTool<TEntity>(config: {
  name: string;
  domain: string;
  entityIdField: string;
  description: string;
  resolveEntity: (id: string, context: McpContext) => Promise<TEntity | null>;
  saveEntity: (id: string, entity: TEntity, context: McpContext) => Promise<void>;
  actions: Record<string, AgenticActionHandler<TEntity>>;
  validateEntity?: (entity: TEntity) => boolean | string;
}): McpTool {
  const actionNames = Object.keys(config.actions) as [string, ...string[]];

  const parametersSchema = z
    .object({
      action: z.enum(actionNames).describe('Action to perform'),
      target: z.record(z.string(), z.unknown()).optional().describe('Target specifier'),
      changes: z.record(z.string(), z.unknown()).optional().describe('Changes to apply'),
      newData: z.record(z.string(), z.unknown()).optional().describe('New data to add'),
    })
    .passthrough();

  return {
    name: config.name,
    description: config.description,
    parameters: parametersSchema,
    execute: async (args: Record<string, unknown>, context: McpContext) => {
      const entityId = args[config.entityIdField] as string;
      const { action, target, changes, newData } = args as {
        action: string;
        target?: unknown;
        changes?: unknown;
        newData?: unknown;
      };

      const entity = await config.resolveEntity(entityId, context);
      if (!entity) throw new Error(`${config.domain} entity not found: ${entityId}`);

      const handler = config.actions[action];
      if (!handler) throw new Error(`Unknown action: ${action}`);

      const result = await handler.execute(entity, { target: target || {}, changes, newData }, context);

      if (config.validateEntity) {
        const validation = config.validateEntity(result);
        if (validation !== true) {
          throw new Error(typeof validation === 'string' ? validation : 'Validation failed');
        }
      }

      await config.saveEntity(entityId, result, context);
      return { content: [{ type: 'text' as const, text: `${action} applied successfully` }] };
    },
  } as McpTool;
}

// =====================================================
// Tool Configuration
// =====================================================

/**
 * Workout Apply Modification Tool
 *
 * Uses the Agentic Framework to provide a standardized interface for
 * workout program modifications. Supports all granular operations:
 * - update_setgroup, add_setgroup, remove_setgroup
 * - update_exercise, add_exercise, remove_exercise
 *
 * @example
 * ```json
 * {
 *   "programId": "abc-123",
 *   "action": "update_setgroup",
 *   "target": { "exerciseName": "squat", "setgroupIndex": 0 },
 *   "changes": { "count": 5, "reps": 5, "intensityPercent": 80 }
 * }
 * ```
 */
export const workoutApplyModificationTool = createAgenticTool<WorkoutProgramData>({
  name: 'workout_apply_modification',
  domain: 'workout',
  entityIdField: 'programId',

  description: `Applies granular modifications to a workout program using DIFF-based approach.

EFFICIENT: You only specify WHAT to change, not the entire program.
The backend fetches the program, applies your changes, and saves.

SUPPORTED ACTIONS:
- update_setgroup: Update reps, sets, weight, intensity, rest, rpe
- add_setgroup: Add a new setgroup to an exercise
- remove_setgroup: Remove a setgroup from an exercise
- update_exercise: Update exercise properties (name, notes, technique)
- add_exercise: Add a new exercise to a day
- remove_exercise: Remove an exercise from a day

TARGETING:
- Use weekIndex/dayIndex/exerciseIndex for precise targeting
- OR use exerciseName for fuzzy matching (e.g. "squat" matches "Squat con bilanciere")

⚠️ CRITICAL: For update actions, the "changes" object MUST contain at least one field!

UNDERSTANDING "5x5" NOTATION:
The notation "5x5" means 5 sets × 5 reps each. You MUST include BOTH:
- "count": 5 → First number = number of SETS
- "reps": 5 → Second number = reps PER SET

CHANGES FIELD MAPPING (for update_setgroup):
| User Request | changes Object |
|--------------|----------------|
| "5x5 at 80%" | {"count": 5, "reps": 5, "intensityPercent": 80} |
| "3x10" | {"count": 3, "reps": 10} |
| "weight 100kg" | {"weight": 100} |
| "rest 90 seconds" | {"rest": 90} |
| "RPE 8" | {"rpe": 8} |`,

  resolveEntity: async (
    programId: string,
    _context: McpContext
  ): Promise<WorkoutProgramData | null> => {
    console.log('[workout.tool] 📥 Fetching program:', programId);

    const existingProgram = await prisma.workout_programs.findUnique({
      where: { id: programId },
    });

    if (!existingProgram) {
      console.log('[workout.tool] ❌ Program not found:', programId);
      return null;
    }

    const weeks = existingProgram.weeks as WorkoutProgramData['weeks'];
    if (!weeks || weeks.length === 0) {
      console.log('[workout.tool] ⚠️ Program has no weeks');
      return null;
    }

    // Normalize for consistent structure
    const normalized = normalizeWorkoutProgram({
      name: existingProgram.name,
      description: existingProgram.description || '',
      difficulty: 'intermediate',
      durationWeeks: weeks.length,
      weeks,
      goals: [],
    });

    console.log('[workout.tool] ✅ Loaded program with', normalized.weeks.length, 'weeks');

    return { weeks: normalized.weeks as unknown as WorkoutProgramData['weeks'] };
  },

  saveEntity: async (
    programId: string,
    entity: WorkoutProgramData,
    _context: McpContext
  ): Promise<void> => {
    console.log('[workout.tool] 💾 Saving program:', programId);

    await prisma.workout_programs.update({
      where: { id: programId },
      data: {
        weeks: toPrismaJsonValue(entity.weeks as unknown[]),
        updatedAt: new Date(),
      },
    });

    console.log('[workout.tool] ✅ Saved successfully');
  },

  actions: workoutActions,

  validateEntity: (entity: WorkoutProgramData): boolean | string => {
    if (!entity.weeks || entity.weeks.length === 0) {
      return 'Program must have at least one week';
    }
    return true;
  },
});
