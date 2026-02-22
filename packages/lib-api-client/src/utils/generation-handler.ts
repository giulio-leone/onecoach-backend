/**
 * Generation Handler Utility
 *
 * Utility condivisa per endpoint non-streaming:
 * - Autenticazione
 * - Validazione Zod
 * - Chiamata service
 * - Error handling
 *
 * Principi: KISS, SOLID (Single Responsibility), DRY
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

/**
 * Configurazione per generation handler
 */
export interface GenerationHandlerConfig<TInput, TOutput> {
  /** Schema Zod per validazione request body */
  requestSchema: z.ZodSchema<TInput>;
  /** Funzione per eseguire generazione */
  executeGeneration: (params: { input: TInput; userId: string }) => Promise<TOutput>;
  /** Messaggio errore personalizzato (opzionale) */
  errorMessage?: string;
}

/**
 * Crea handler per endpoint non-streaming
 *
 * @param config Configurazione handler
 * @returns Handler function per Next.js route
 */
export function createGenerationHandler<TInput, TOutput>(
  config: GenerationHandlerConfig<TInput, TOutput>
) {
  return async function handler(_req: NextRequest): Promise<NextResponse> {
    const adminOrError = await requireAdmin();

    if (adminOrError instanceof NextResponse) {
      return adminOrError;
    }
    const adminUser = adminOrError as { id: string };

    try {
      const body = await _req.json();

      const parsed = config.requestSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          {
            error: 'Dati di input non validi',
            code: 'VALIDATION_ERROR',
            details: parsed.error.flatten(),
          },
          { status: 400 }
        );
      }

      const result = await config.executeGeneration({
        input: parsed.data,
        userId: adminUser.id,
      });

      return NextResponse.json({
        success: true,
        result,
      });
    } catch (error: unknown) {
      const errorMsg = config.errorMessage || 'Errore durante la generazione';
      logError(errorMsg, error);
      const { response, status } = mapErrorToApiResponse(error);
      return NextResponse.json(response, { status });
    }
  };
}
