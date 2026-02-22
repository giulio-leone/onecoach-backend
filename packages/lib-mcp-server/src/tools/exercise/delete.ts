import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { exerciseService } from '@giulio-leone/lib-exercise';

const deleteParameters = z.object({
  id: z.string(),
});

export const exerciseDeleteTool: McpTool = {
  name: 'exercise_delete',
  description: 'Deletes an exercise. Requires admin privileges.',
  parameters: deleteParameters,
  execute: async (args, context: McpContext) => {
    if (!context.isAdmin) {
      throw new Error('Unauthorized: Admin access required for this operation');
    }

    const deleted = await exerciseService.delete(args.id);
    return { success: true, id: deleted.id, slug: deleted.slug };
  },
};
