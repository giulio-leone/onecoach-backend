
import { generateExercises } from '@giulio-leone/one-workout';
import { createGenerationHandler } from '@giulio-leone/lib-api';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const aiRequestSchema = z.object({
  prompt: z.string().trim().min(10, 'Fornire un prompt dettagliato (minimo 10 caratteri)'),
  autoApprove: z.boolean().default(false),
  mergeExisting: z.boolean().default(false),
});

/**
 * POST /api/admin/exercises/ai
 *
 * Generate exercises with SDK 3.1
 */
export const POST = createGenerationHandler({
  requestSchema: aiRequestSchema,
  executeGeneration: async ({ input }) => {
    const countMatch = input.prompt.match(/(\d+)\s*(nuovi\s*)?(esercizi|exercises?)/i);
    const count = countMatch && countMatch[1] ? parseInt(countMatch[1], 10) : 5;

    const result = await generateExercises({
      count,
      description: input.prompt,
    });

    if (!result.success) {
      throw new Error(result.error?.message || 'Errore nella generazione esercizi');
    }

    const exercises = result.output?.exercises || [];
    return {
      summary: `Generati ${exercises.length} esercizi`,
      createResult: {
        created: exercises.length,
        updated: 0,
        skipped: 0,
        createdItems: exercises.map(e => ({ name: e.name, typeId: e.typeId })),
        updatedItems: [],
        skippedSlugs: [],
        errors: [],
      },
    };
  },
  errorMessage: "Errore durante l'esecuzione del piano AI",
});

