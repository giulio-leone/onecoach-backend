/**
 * Workout Granular Utilities
 *
 * Contains utility tools for workout modifications.
 * The main modification tool (workoutApplyModificationTool) has been
 * migrated to workout.tool.ts using the Agentic Framework.
 *
 * This file retains only:
 * - workoutCopyProgressionPatternTool - Copy progression patterns between exercises
 * - workoutPersistProgramTool - Explicit save tool for backwards compatibility
 *
 * @module lib-mcp-server/tools/workout/granular
 */

import { z } from 'zod';
import type { McpTool } from '../../types';
import { GranularSessionService } from '@giulio-leone/one-workout';
import { workoutProgramSchema } from '@giulio-leone/schemas';
import { normalizeWorkoutProgram } from './program-normalizer';
import { getDbClient } from '@giulio-leone/core';
const prisma = getDbClient() as any;
import { toPrismaJsonValue } from '@giulio-leone/lib-shared';

// =====================================================
// MCP-Safe Schema (JSON-compatible for AI SDK)
// =====================================================

const mcpWorkoutProgramSchema = workoutProgramSchema.extend({
  createdAt: z.string().optional().describe('ISO 8601 timestamp'),
  updatedAt: z.string().optional().describe('ISO 8601 timestamp'),
});

// =====================================================
// Tool: Copy Progression Pattern
// =====================================================

const copyProgressionPatternParams = z.object({
  program: mcpWorkoutProgramSchema,
  sourceExerciseName: z.string().describe('Name of the exercise to copy pattern from'),
  targetExerciseName: z.string().describe('Name of the exercise to apply pattern to'),
});

type CopyProgressionPatternParams = z.infer<typeof copyProgressionPatternParams>;

export const workoutCopyProgressionPatternTool: McpTool<CopyProgressionPatternParams> = {
  name: 'workout_copy_progression_pattern',
  description: `Copies the progression pattern (set counts) from one exercise to another.
  
Use this for:
- Applying consistent volume patterns
- Synchronizing exercise progressions`,
  parameters: copyProgressionPatternParams,
  execute: async (args) => {
    const { program, sourceExerciseName, targetExerciseName } = args;
    const normalizedProgram = normalizeWorkoutProgram(program);

    const result = GranularSessionService.copyProgressionPattern(
      normalizedProgram,
      sourceExerciseName,
      targetExerciseName
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      program: result.program,
      message: `Copied progression pattern from "${sourceExerciseName}" to "${targetExerciseName}"`,
    };
  },
};

// =====================================================
// Tool: Persist Program (Save Granular Changes)
// =====================================================

const persistProgramParams = z.object({
  programId: z.string().describe('The ID of the program to persist'),
  program: mcpWorkoutProgramSchema.describe('The modified program object to save'),
});

type PersistProgramParams = z.infer<typeof persistProgramParams>;

export const workoutPersistProgramTool: McpTool<PersistProgramParams> = {
  name: 'workout_persist_program',
  description: `Persists a modified workout program to the database.
  
IMPORTANT: Use this tool AFTER making granular modifications to save changes.

Workflow:
1. Use workout_get_program to retrieve the program
2. Apply modifications
3. Call this tool with the modified program to persist changes`,
  parameters: persistProgramParams,
  execute: async (args) => {
    console.log('[MCP:workout_persist_program] 📥 Called with:', {
      programId: args.programId,
      weeksCount: args.program?.weeks?.length,
    });

    const { programId, program } = args;
    const normalizedProgram = normalizeWorkoutProgram(program);

    // Verify program exists
    const existingProgram = await prisma.workout_programs.findUnique({
      where: { id: programId },
      select: { id: true },
    });

    if (!existingProgram) {
      return {
        success: false,
        error: `Program with ID ${programId} not found`,
      };
    }

    // PATCH: Only update the weeks structure
    await prisma.workout_programs.update({
      where: { id: programId },
      data: {
        weeks: toPrismaJsonValue(normalizedProgram.weeks as unknown[]),
        updatedAt: new Date(),
      },
    });

    console.log('[MCP:workout_persist_program] ✅ Saved:', { programId });

    return {
      success: true,
      programId,
      message: `Program ${programId} saved successfully with ${normalizedProgram.weeks.length} week(s)`,
    };
  },
};
