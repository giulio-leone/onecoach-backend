import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { NutritionImportService, createNutritionAIContext } from '@giulio-leone/lib-nutrition';
import { IMPORT_LIMITS } from '@giulio-leone/lib-import-core';
import { randomUUID } from 'crypto';

import { logger } from '@giulio-leone/lib-core';
const importFileSchema = z.object({
  name: z.string(),
  mimeType: z.string().optional(),
  content: z.string(),
  size: z.number().int().positive().optional(),
  sheetIndex: z.number().int().nonnegative().optional(),
  sheetName: z.string().optional(),
});

const importOptionsSchema = z.object({
  mode: z.enum(['auto', 'review']).default('auto'),
  locale: z.string().optional(),
});

type ImportOptions = z.infer<typeof importOptionsSchema>;

const nutritionImportParamsSchema = z.object({
  files: z
    .array(importFileSchema)
    .min(1, 'Almeno un file richiesto')
    .max(IMPORT_LIMITS.MAX_FILES, `Massimo ${IMPORT_LIMITS.MAX_FILES} file`),
  options: importOptionsSchema.optional(),
});

type NutritionImportParams = z.infer<typeof nutritionImportParamsSchema>;

export const nutritionImportTool: McpTool<NutritionImportParams> = {
  name: 'nutrition_import_from_file',
  description: `Import nutrition plans from files (CSV, XLSX, DOCX, PDF, immagini) e convertili in piani nutrizionali strutturati.`,
  parameters: nutritionImportParamsSchema,
  execute: async (args: NutritionImportParams, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Authentication required');
    }

    const { files, options } = nutritionImportParamsSchema.parse(args);
    const requestId = randomUUID();
    const importService = new NutritionImportService({
      aiContext: createNutritionAIContext(),
      onProgress: (progress) => {
        logger.warn(`[NutritionImport] ${progress.step}: ${progress.message}`);
      },
      context: { userId: context.userId, requestId },
    });

    const result = await importService.import(files, context.userId, options as ImportOptions);

    if (!result.success) {
      throw new Error(result.errors?.join('\n') || 'Import fallito');
    }

    return {
      success: true,
      planId: result.planId,
      plan: result.plan,
      parseResult: result.parseResult,
      warnings: result.warnings,
    };
  },
};
