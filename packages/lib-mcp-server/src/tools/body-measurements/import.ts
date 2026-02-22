/**
 * MCP Tool: Body Measurements Import
 *
 * Imports body measurements from files (CSV, XLSX, PDF, Images) using AI.
 *
 * @module lib-mcp-server/tools/body-measurements/import
 */

import { z } from 'zod';
import type { McpTool } from '../../types';
import {
  BodyMeasurementsImportService,
  BodyMeasurementsVisionService,
} from '@giulio-leone/lib-body-measurements';
import {
  ImportFileSchema,
  ImportOptionsSchema,
  IMPORT_LIMITS,
  SUPPORTED_MIME_TYPES,
  type ImportProgress,
  type AIParseContext,
  type ImportFile,
} from '@giulio-leone/lib-import-core';
import type { ImportedBodyMeasurements } from '@giulio-leone/lib-body-measurements';
import { randomUUID } from 'crypto';

import { logger } from '@giulio-leone/lib-core';
// Re-export constants for UI/Client usage
export const supportedFormats = {
  spreadsheets: ['csv', 'xlsx', 'xls', 'ods'],
  pdf: ['pdf'],
  documents: ['docx', 'doc', 'odt'],
  images: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
  mimeTypes: SUPPORTED_MIME_TYPES,
  maxFileSize: IMPORT_LIMITS.MAX_FILE_SIZE,
  maxFiles: IMPORT_LIMITS.MAX_FILES,
  creditCost: IMPORT_LIMITS.DEFAULT_CREDIT_COST, // Should be dynamic from config
};

const bodyMeasurementsImportParamsSchema = z.object({
  files: z
    .array(ImportFileSchema)
    .min(1, 'Almeno un file richiesto')
    .max(IMPORT_LIMITS.MAX_FILES, `Massimo ${IMPORT_LIMITS.MAX_FILES} file`),
  options: ImportOptionsSchema.optional(),
});

type BodyMeasurementsImportParams = z.infer<typeof bodyMeasurementsImportParamsSchema>;

function createAIContext(userId: string): AIParseContext<ImportedBodyMeasurements> {
  return {
    parseWithAI: async (
      content: string,
      mimeType: string,
      _prompt: string
    ): Promise<ImportedBodyMeasurements> => {
      const mimeTypeLower = mimeType.toLowerCase();

      if (mimeTypeLower.startsWith('image/')) {
        return BodyMeasurementsVisionService.parseImage(content, mimeType, userId);
      }

      if (mimeTypeLower === 'application/pdf') {
        return BodyMeasurementsVisionService.parsePDF(content, userId);
      }

      if (
        mimeTypeLower.includes('document') ||
        mimeTypeLower.includes('msword') ||
        mimeTypeLower.includes('opendocument.text')
      ) {
        return BodyMeasurementsVisionService.parseDocument(content, mimeType, userId);
      }

      // Default/Fallback to Spreadsheet logic (text processing)
      return BodyMeasurementsVisionService.parseSpreadsheet(content, mimeType, userId);
    },
  };
}

export const bodyMeasurementsImportTool: McpTool<BodyMeasurementsImportParams> = {
  name: 'body_measurements_import',
  description: `Import body measurements from files (CSV, PDF, Images).
Supported formats: CSV, XLSX, PDF, JPG, PNG.
Uses AI to extract date, weight, body composition, and circumferences.`,
  parameters: bodyMeasurementsImportParamsSchema,
  execute: async (args, context) => {
    if (!context.userId) throw new Error('Authentication required');

    const { files, options } = bodyMeasurementsImportParamsSchema.parse(args);
    const requestId = randomUUID();

    const importService = new BodyMeasurementsImportService({
      aiContext: createAIContext(context.userId),
      onProgress: (progress: ImportProgress) => {
        logger.warn(`[BodyMeasurementsImport][${requestId}] ${progress.step}: ${progress.message}`);
      },
      context: { requestId, userId: context.userId },
    });

    const result = await importService.import(files as ImportFile[], context.userId, options);

    if (!result.success) {
      throw new Error((result.errors || []).join('\n'));
    }

    return {
      success: true,
      measurementsImported: result.measurementsImported,
      warnings: result.warnings,
    };
  },
};
