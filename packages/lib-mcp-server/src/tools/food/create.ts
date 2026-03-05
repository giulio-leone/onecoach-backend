import type { McpTool, McpContext } from '../../types';
import { foodService } from '@giulio-leone/lib-food';
import { createFoodSchema } from '@giulio-leone/schemas';

import { logger } from '@giulio-leone/lib-core/logger.service';
export const foodCreateTool: McpTool = {
  name: 'food_create',
  description: `Creates a new food item. Requires admin privileges.
  
  IMPORTANT: You are an expert nutritionist. When using this tool:
  1. You MUST ESTIMATE the nutritional values (calories, protein, carbs, fats) based on your internal knowledge if the user doesn't provide them.
  2. Do NOT ask the user for nutritional data (macros) unless it's a very obscure food.
  3. Use a standard serving size (e.g., 100g) if not specified.
  4. Provide a helpful description including the main ingredients or nutritional characteristics.
  
  Example: If user says "Add an apple", you should call this tool with estimated macros for an apple (approx 52kcal/100g) without asking further questions.
  
  CRITICAL: After this tool executes successfully, you MUST ALWAYS provide a text response to the user explaining what was created. Include the food name, key nutritional values (calories, protein, carbs, fats), and confirm it has been added to the database. NEVER end the conversation after calling this tool without providing a human-readable summary.`,
  parameters: createFoodSchema,
  execute: async (args, context: McpContext) => {
    logger.warn('🍎 [food_create] Esecuzione tool per creare alimento');
    logger.warn('🍎 [food_create] Argomenti:', { args: JSON.stringify(args, null, 2) });
    logger.warn('🍎 [food_create] Context:', { userId: context.userId, isAdmin: context.isAdmin });

    if (!context.isAdmin) {
      logger.error('❌ [food_create] Accesso negato: non è admin');
      throw new Error('Unauthorized: Admin access required for this operation');
    }

    logger.warn('✅ [food_create] Autorizzazione OK, creazione alimento...');
    const food = await foodService.createFood(args);
    logger.warn('✅ [food_create] Alimento creato con successo');
    logger.warn('📊 [food_create] Alimento creato:', {
      data: JSON.stringify(food, null, 2).substring(0, 300),
    });

    return food;
  },
};
