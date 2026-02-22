import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { foodService } from '@giulio-leone/lib-food';
import { foodQuerySchema } from '@giulio-leone/schemas';

const readParameters = foodQuerySchema.extend({
  id: z.string().optional(),
  ids: z.array(z.string()).optional(),
});

export const foodReadTool: McpTool = {
  name: 'food_read',
  description: 'Reads food items by ID, IDs, or search criteria.',
  parameters: readParameters,
  execute: async (args, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User authentication required');
    }

    if (args.id) {
      return await foodService.getFoodById(args.id);
    }

    if (args.ids && args.ids.length > 0) {
      return await foodService.getFoodsByIds(args.ids);
    }

    if (args.search) {
      return await foodService.searchFoods(args.search, {
        limit: args.pageSize,
        page: args.page,
        locale: 'it', // Defaulting to Italian as per FoodService default
      });
    }

    return await foodService.list({
      page: args.page,
      pageSize: args.pageSize,
      locale: 'it', // Defaulting to Italian as per FoodService default
      // other filters from foodQuerySchema could be applied if FoodService supported them in list()
      // Currently FoodService.list only takes limit, page, pageSize, locale.
      // Advanced filtering might need a new method in FoodService or custom query here.
      // Given constraints, we stick to what FoodService exposes or simple mapping.
    });
  },
};
