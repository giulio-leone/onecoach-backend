import { z } from 'zod';
import type { McpTool, McpContext, BatchResult } from '../../types';
import { foodService } from '@giulio-leone/one-nutrition';
import { updateFoodSchema } from '@giulio-leone/schemas';

const batchUpdateParameters = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        data: updateFoodSchema,
      })
    )
    .max(100),
});

export const foodBatchUpdateTool: McpTool = {
  name: 'food_batch_update',
  description: 'Updates multiple food items by ID. Requires admin privileges.',
  parameters: batchUpdateParameters,
  execute: async (args, context: McpContext) => {
    if (!context.isAdmin) {
      throw new Error('Unauthorized: Admin access required for this operation');
    }

    const results: BatchResult[] = [];

    for (const item of args.items) {
      try {
        const updated = await foodService.updateFood(item.id, item.data);
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
