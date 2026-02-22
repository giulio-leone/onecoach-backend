/**
 * MCP Tool: Workout Statistics
 *
 * Calcola statistiche dettagliate per un programma di allenamento.
 * Utile per Copilot per rispondere a domande su volume, intensità, bilanciamento, ecc.
 *
 * @module lib-mcp-server/tools/workout/statistics
 */

import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { WorkoutStatisticsService } from '@giulio-leone/one-workout';
// Importiamo lo schema Zod per validare l'input
import { aiWorkoutProgramSchema } from '@giulio-leone/schemas';
import { normalizeWorkoutProgram } from './program-normalizer';

/**
 * Schema per i parametri del tool
 */
const workoutStatisticsParamsSchema = z.object({
  program: aiWorkoutProgramSchema.describe('The full workout program object to analyze'),
});

type WorkoutStatisticsParams = z.infer<typeof workoutStatisticsParamsSchema>;

/**
 * MCP Tool per il calcolo delle statistiche di un workout
 */
export const workoutStatisticsTool: McpTool<WorkoutStatisticsParams> = {
  name: 'workout_calculate_statistics',
  description: `Calculates detailed statistics for a workout program.
  
  Returns:
  - Global stats: Total Sets, Total Volume Load, Avg Intensity, Avg RPE
  - Muscle Analysis: Breakdown by muscle group (sets, volume, frequency)
  - Exercise Analysis: Breakdown by exercise (frequency, volume, max weight)
  - Weekly Stats: Progression over weeks
  
  Use this tool when the user asks about the volume, intensity, or balance of a workout program.`,

  parameters: workoutStatisticsParamsSchema,

  execute: async (args: WorkoutStatisticsParams, _context: McpContext) => {
    try {
      const program = normalizeWorkoutProgram(args.program);
      const stats = WorkoutStatisticsService.calculate(program);
      return {
        success: true,
        stats,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error calculating statistics',
      };
    }
  },
};
