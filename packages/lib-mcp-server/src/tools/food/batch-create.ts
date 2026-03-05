import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { FoodAdminService, foodImportSchema } from '@giulio-leone/lib-food';

import { logger } from '@giulio-leone/lib-core/logger.service';
const batchCreateParameters = z.object({
  items: z.array(foodImportSchema).max(100),
});

export const foodBatchCreateTool: McpTool = {
  name: 'food_batch_create',
  description: `Creates multiple food items in batch. Requires admin privileges.
  
  CRITICAL: After this tool executes successfully, you MUST ALWAYS provide a text response to the user explaining what was created. Include the number of foods created, list the food names, and confirm they have been added to the database. NEVER end the conversation after calling this tool without providing a human-readable summary.`,
  parameters: batchCreateParameters,
  execute: async (args, context: McpContext) => {
    logger.warn('🍎🍎🍎 [food_batch_create] Esecuzione tool per creare alimenti in batch');
    logger.warn('🍎🍎🍎 [food_batch_create] Numero alimenti da creare:', {
      count: args.items?.length || 0,
    });
    logger.warn('🍎🍎🍎 [food_batch_create] Context:', {
      userId: context.userId,
      isAdmin: context.isAdmin,
    });

    if (!context.isAdmin) {
      logger.error('❌ [food_batch_create] Accesso negato: non è admin');
      throw new Error('Unauthorized: Admin access required for this operation');
    }

    if (!args.items || args.items.length === 0) {
      logger.error('❌ [food_batch_create] Nessun alimento da creare');
      throw new Error('No items provided to create');
    }

    logger.warn('✅ [food_batch_create] Autorizzazione OK, creazione batch...');
    logger.warn('📋 [food_batch_create] Primi 3 alimenti:', {
      items: JSON.stringify(args.items.slice(0, 3), null, 2),
    });

    const result = await FoodAdminService.import(args.items, {
      userId: context.userId,
      mergeExisting: false, // Create only
    });

    logger.warn('✅ [food_batch_create] Batch creato con successo');
    logger.warn('📊 [food_batch_create] Risultato:', {
      result: JSON.stringify(result, null, 2).substring(0, 500),
    });
    logger.warn('📊 [food_batch_create] Alimenti creati:', { count: result.created || 0 });
    logger.warn('📊 [food_batch_create] Alimenti già esistenti:', { count: result.skipped || 0 });
    logger.warn('📊 [food_batch_create] Errori:', { count: result.errors?.length || 0 });

    return result;
  },
};
