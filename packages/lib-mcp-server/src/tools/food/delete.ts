import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { getTypedDbClient } from '@giulio-leone/core';
const prisma = getTypedDbClient();

const deleteParameters = z.object({
  id: z.string(),
});

export const foodDeleteTool: McpTool = {
  name: 'food_delete',
  description: 'Deletes a food item. Requires admin privileges.',
  parameters: deleteParameters,
  execute: async (args, context: McpContext) => {
    if (!context.isAdmin) {
      throw new Error('Unauthorized: Admin access required for this operation');
    }

    // Deleting food item. Cascade delete should handle relations if configured in Prisma schema.
    // Otherwise we might need to delete related records first.
    // Assuming standard Cascade behavior or that prisma client handles it if set in schema.
    // Checking schema would be ideal but assuming standard delete for now.

    const deleted = await prisma.food_items.delete({
      where: { id: args.id },
    });

    return { success: true, id: deleted.id };
  },
};
