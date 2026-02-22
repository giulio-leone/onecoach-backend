import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { exerciseService } from '@giulio-leone/lib-exercise';

import { logger } from '@giulio-leone/lib-core';
const batchDeleteParameters = z.object({
  ids: z.array(z.string()).max(100),
});

export const exerciseBatchDeleteTool: McpTool = {
  name: 'exercise_batch_delete',
  description: 'Deletes multiple exercises by ID. Requires admin privileges.',
  parameters: batchDeleteParameters,
  execute: async (args, context: McpContext) => {
    if (!context.isAdmin) {
      throw new Error('Unauthorized: Admin access required for this operation');
    }

    let deleted = 0;
    for (const id of args.ids) {
      try {
        await exerciseService.delete(id);
        deleted += 1;
      } catch (error) {
        // continue deleting others; collect minimal info
        logger.warn(`[exercise_batch_delete] Failed to delete ${id}:`, { error });
      }
    }

    return { success: true, count: deleted };
  },
};
