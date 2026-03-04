import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { getDbClient } from '@giulio-leone/core';
const prisma = getDbClient() as import('@prisma/client').PrismaClient;

const batchDeleteParameters = z.object({
  ids: z.array(z.string()).max(100),
});

export const foodBatchDeleteTool: McpTool = {
  name: 'food_batch_delete',
  description: 'Deletes multiple food items by ID. Requires admin privileges.',
  parameters: batchDeleteParameters,
  execute: async (args, context: McpContext) => {
    if (!context.isAdmin) {
      throw new Error('Unauthorized: Admin access required for this operation');
    }

    if (args.ids.length === 0) return { count: 0 };

    const result = await prisma.food_items.deleteMany({
      where: { id: { in: args.ids } },
    });

    return { success: true, count: result.count };
  },
};
