import { generateFoods } from '@giulio-leone/one-nutrition';
import { createGenerationHandler } from '@giulio-leone/lib-api';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const aiRequestSchema = z.object({
  prompt: z.string().trim().min(10, 'Fornire un prompt dettagliato (minimo 10 caratteri)'),
  mergeExisting: z.boolean().optional().default(false),
});

/**
 * POST /api/admin/foods/ai
 *
 * Generate foods with SDK 3.1
 */
export const POST = createGenerationHandler({
  requestSchema: aiRequestSchema,
  executeGeneration: async ({ input }) => {
    // Parse prompt to extract count (default 5)
    const prompt = input.prompt;
    const countMatch = prompt.match(/(\d+)\s*(nuovi\s*)?(alimenti|foods?)/i);
    const count = countMatch && countMatch[1] ? parseInt(countMatch[1], 10) : 5;

    const result = await generateFoods({
      count,
      description: prompt,
    });

    if (!result.success) {
      throw new Error(result.error?.message || 'Errore nella generazione alimenti');
    }

    const foods = result.output?.foods || [];
    return {
      summary: `Generati ${foods.length} alimenti`,
      createResult: {
        created: foods.length,
        updated: 0,
        skipped: 0,
        createdItems: foods.map(f => ({ name: f.name })),
        updatedItems: [],
        skippedSlugs: [],
        errors: [],
      },
    };
  },
  errorMessage: 'Errore durante la generazione alimenti con AI',
});


