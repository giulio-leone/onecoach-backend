import { z } from 'zod';
import type { McpTool, McpContext, BatchResult } from '../../types';
import { exerciseService } from '@giulio-leone/one-workout';
import { updateExerciseSchema } from '@giulio-leone/schemas';

const batchUpdateParameters = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        data: updateExerciseSchema,
      })
    )
    .max(100),
});

export const exerciseBatchUpdateTool: McpTool = {
  name: 'exercise_batch_update',
  description: 'Updates multiple exercises by ID. Requires admin privileges.',
  parameters: batchUpdateParameters,
  execute: async (args, context: McpContext) => {
    if (!context.isAdmin) {
      throw new Error('Unauthorized: Admin access required for this operation');
    }

    const results: BatchResult[] = [];

    for (const item of args.items) {
      try {
        const updated = await exerciseService.update(item.id, item.data, {
          userId: context.userId,
          includeTranslations: true,
        });
        results.push({ success: true, id: item.id, data: updated });
      } catch (error: unknown) {
        results.push({
          success: false,
          id: item.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  },
};
