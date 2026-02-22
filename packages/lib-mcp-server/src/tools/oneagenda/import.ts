import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { IMPORT_LIMITS } from '@giulio-leone/lib-import-core';
import { randomUUID } from 'crypto';
import { OneAgendaImportService, createOneAgendaAIContext } from '../../services/oneagenda';

import { logger } from '@giulio-leone/lib-core';
const importFileSchema = z.object({
  name: z.string(),
  mimeType: z.string().optional(),
  content: z.string(),
  size: z.number().int().positive().optional(),
});

const oneAgendaImportParamsSchema = z.object({
  files: z
    .array(importFileSchema)
    .min(1, 'Almeno un file richiesto')
    .max(IMPORT_LIMITS.MAX_FILES, `Massimo ${IMPORT_LIMITS.MAX_FILES} file`),
});

type OneAgendaImportParams = z.infer<typeof oneAgendaImportParamsSchema>;

export const oneAgendaImportTool: McpTool<OneAgendaImportParams> = {
  name: 'oneagenda_import_from_file',
  description:
    'Importa progetti, task e abitudini in OneAgenda da file (PDF, DOCX, immagini, CSV/XLSX).',
  parameters: oneAgendaImportParamsSchema,
  execute: async (args: OneAgendaImportParams, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Authentication required');
    }

    const { files } = oneAgendaImportParamsSchema.parse(args);
    const requestId = randomUUID();
    const service = new OneAgendaImportService({
      aiContext: createOneAgendaAIContext(context.userId),
      onProgress: (progress) => {
        logger.warn(`[OneAgendaImport] ${progress.step}: ${progress.message}`);
      },
      context: { userId: context.userId, requestId },
    });

    const result = await service.import(files, context.userId, {});

    if (!result.success) {
      throw new Error(result.errors?.join('\n') || 'Import fallito');
    }

    return {
      success: true,
      projectIds: result.projectIds,
      habitIds: result.habitIds,
      parseResult: result.parseResult,
      warnings: result.warnings,
    };
  },
};
