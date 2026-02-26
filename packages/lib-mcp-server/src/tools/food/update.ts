import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { foodService } from '@giulio-leone/lib-food';
import { updateFoodSchema } from '@giulio-leone/schemas';

const updateParameters = z.object({
  id: z.string(),
  data: updateFoodSchema,
});

export const foodUpdateTool: McpTool = {
  name: 'food_update',
  description: 'Updates an existing food item. Requires admin privileges.',
  parameters: updateParameters,
  execute: async (args, context: McpContext) => {
    if (!context.isAdmin) {
      throw new Error('Unauthorized: Admin access required for this operation');
    }

    const food = await foodService.updateFood(args.id, args.data);
    return food;
  },
};
