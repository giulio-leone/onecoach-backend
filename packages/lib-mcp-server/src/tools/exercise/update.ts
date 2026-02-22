import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { exerciseService } from '@giulio-leone/lib-exercise';
import { updateExerciseSchema } from '@giulio-leone/schemas';

const updateParameters = z.object({
  id: z.string(),
  data: updateExerciseSchema,
});

export const exerciseUpdateTool: McpTool = {
  name: 'exercise_update',
  description: 'Updates an existing exercise. Requires admin privileges.',
  parameters: updateParameters,
  execute: async (args, context: McpContext) => {
    if (!context.isAdmin) {
      throw new Error('Unauthorized: Admin access required for this operation');
    }

    const exercise = await exerciseService.update(args.id, args.data, {
      userId: context.userId,
      locale: 'en', // Default locale for updates context if needed, though service handles it
      includeTranslations: true,
    });
    return exercise;
  },
};
