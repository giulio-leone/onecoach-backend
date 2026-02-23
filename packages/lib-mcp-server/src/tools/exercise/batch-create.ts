import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { ExerciseAdminService } from '@giulio-leone/one-workout';
import { createExerciseSchema } from '@giulio-leone/schemas';

// We need to add approvalStatus which is in ExerciseImportPayload but not createExerciseSchema
const importItemSchema = createExerciseSchema.and(
  z.object({
    approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  })
);

const batchCreateParameters = z.object({
  items: z.array(importItemSchema).max(100),
});

export const exerciseBatchCreateTool: McpTool = {
  name: 'exercise_batch_create',
  description: 'Creates multiple exercises in batch. Requires admin privileges.',
  parameters: batchCreateParameters,
  execute: async (args, context: McpContext) => {
    if (!context.isAdmin) {
      throw new Error('Unauthorized: Admin access required for this operation');
    }

    const result = await ExerciseAdminService.import(args.items, {
      userId: context.userId,
      mergeExisting: false, // Create only
      autoApprove: true,
    });

    return result;
  },
};
