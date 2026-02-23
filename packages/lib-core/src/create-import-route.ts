/**
 * Import Route Factory
 *
 * Creates standardized Next.js API route handlers for file imports
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger as baseLogger } from '@giulio-leone/lib-shared';
import { requireAuth } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';
import type { AuthenticatedUser } from '@giulio-leone/types/core';
import { randomUUID } from 'crypto';

import {
  IMPORT_LIMITS,
  createTrackedAIContext,
  type AIParseContext,
  type ImportFile,
  type ImportProgress,
  type BaseImportResult,
  type ImportContext,
} from '@giulio-leone/lib-import-core';

// ==================== TYPES ====================

/**
 * Configuration for creating an import route
 */
export interface ImportRouteConfig<
  TParsed extends object,
  TService,
  TResult extends BaseImportResult,
> {
  /** Domain name for logging (e.g., 'Workout', 'Nutrition', 'OneAgenda') */
  domain: string;

  /** Factory to create AI context delegate with userId for credit validation */
  createAIDelegate: (userId: string) => AIParseContext<TParsed>;

  /** Factory to create the import service */
  createService: (config: {
    aiContext: AIParseContext<TParsed>;
    onProgress: (progress: ImportProgress) => void;
    context: ImportContext;
  }) => TService;

  /** Execute import using the service */
  executeImport: (
    service: TService,
    files: ImportFile[],
    userId: string,
    options: Record<string, unknown> | undefined
  ) => Promise<TResult>;

  /** Transform successful result for API response */
  transformResult: (result: TResult, requestId: string) => Record<string, unknown>;
}

// ==================== SCHEMAS ====================

/**
 * Base import request schema
 */
const BaseImportRequestSchema = z.object({
  files: z
    .array(
      z.object({
        name: z.string(),
        mimeType: z.string().optional(),
        content: z.string(),
        size: z.number().optional(),
      })
    )
    .min(1, 'Almeno un file richiesto')
    .max(IMPORT_LIMITS.MAX_FILES, `Massimo ${IMPORT_LIMITS.MAX_FILES} file`),
  options: z.record(z.string(), z.unknown()).optional(),
  requestId: z.string().min(6).max(64).optional(),
});

// ==================== FACTORY ====================

/**
 * Creates a standardized import API route handler.
 *
 * Handles:
 * - Authentication (requireAuth)
 * - Request validation
 * - AI context creation with logging
 * - Service instantiation
 * - Error handling and response mapping
 *
 * @example
 * ```typescript
 * // apps/next/app/api/nutrition/import/route.ts
 * import { createImportRoute } from '@/lib/import/create-import-route';
 * import { normalizeNutritionPlan } from '@giulio-leone/one-nutrition';
 *
 * export const dynamic = 'force-dynamic';
 *
 * export const POST = createImportRoute({
 *   domain: 'Nutrition',
 *   createAIDelegate: (userId) => createNutritionAIContext(),
 *   createService: (config) => new NutritionImportService(config),
 *   executeImport: (service, files, userId, options) => service.import(files, userId, options),
 *   transformResult: (result, requestId) => ({
 *     success: true,
 *     planId: result.planId,
 *     plan: result.plan,
 *     warnings: result.warnings,
 *     requestId,
 *   }),
 * });
 * ```
 */
export function createImportRoute<
  TParsed extends object,
  TService,
  TResult extends BaseImportResult,
>(
  config: ImportRouteConfig<TParsed, TService, TResult>
): (request: Request) => Promise<NextResponse> {
  const apiLogger = baseLogger.child(`${config.domain}ImportAPI`);

  return async function POST(request: Request): Promise<NextResponse> {
    // 1. Authentication
    const userOrError = await requireAuth();
    if (userOrError instanceof NextResponse) {
      return userOrError;
    }
    const user = userOrError as AuthenticatedUser;

    try {
      // 2. Parse and validate request
      const body = await request.json();
      const validation = BaseImportRequestSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Dati non validi',
            details: validation.error.flatten(),
          },
          { status: 400 }
        );
      }

      const { files, options, requestId: providedRequestId } = validation.data;
      const requestId = providedRequestId || randomUUID();

      // 3. Log request
      const logContext = {
        requestId,
        userId: user.id,
        files: files.map((file) => ({
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
        })),
        options,
      };

      apiLogger.info(`${config.domain} import request received`, logContext);

      // 4. Create AI context with tracking/logging
      const aiContext = createTrackedAIContext<TParsed>(config.createAIDelegate(user.id), {
        requestId,
        userId: user.id,
        loggerPrefix: `${config.domain}ImportAI`,
      });

      // 5. Create service instance
      const service = config.createService({
        aiContext,
        onProgress: (_progress) => {
          // Progress callback for future real-time updates
        },
        context: { requestId, userId: user.id },
      });

      // 6. Execute import
      const result = await config.executeImport(service, files as ImportFile[], user.id, options);

      // 7. Handle failure
      if (!result.success) {
        const primaryError = result.errors?.[0] ?? 'Import fallito';
        apiLogger.warn(`${config.domain} import failed`, {
          ...logContext,
          errors: result.errors,
          warnings: result.warnings,
        });

        return NextResponse.json(
          {
            success: false,
            error: primaryError,
            errors: result.errors,
            warnings: result.warnings,
            requestId,
          },
          { status: 400 }
        );
      }

      // 8. Handle success
      apiLogger.info(`${config.domain} import completed`, {
        requestId,
        userId: user.id,
      });

      return NextResponse.json(config.transformResult(result, requestId));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Errore sconosciuto';
      logError(`Errore durante import ${config.domain}`, error, { userId: user.id });
      apiLogger.error(`${config.domain} import exception`, {
        userId: user.id,
        message,
      });

      const { response, status } = mapErrorToApiResponse(error);
      return NextResponse.json(response, { status });
    }
  };
}
