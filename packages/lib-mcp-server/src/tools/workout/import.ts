/**
 * MCP Tool: Workout Import
 *
 * Permette di importare programmi di allenamento da file (CSV, XLSX, DOCX, PDF, immagini, ecc.)
 * e convertirli in WorkoutProgram strutturati tramite AI.
 *
 * @module lib-mcp-server/tools/workout/import
 */

import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import {
  WorkoutImportService,
  WorkoutVisionService as VisionService,
} from '@giulio-leone/one-workout';
import {
  ImportFileSchema,
  ImportOptionsSchema,
  IMPORT_LIMITS,
  SUPPORTED_MIME_TYPES,
} from '@giulio-leone/schemas';
import type { ImportProgress } from '@giulio-leone/lib-shared/import-core';
import { type ImportedWorkoutProgram } from '@giulio-leone/schemas';
import { randomUUID } from 'crypto';

import { logger } from '@giulio-leone/lib-core/logger.service';
/**
 * Schema per i parametri del tool
 */
const workoutImportParamsSchema = z.object({
  files: z
    .array(ImportFileSchema)
    .min(1, 'Almeno un file richiesto')
    .max(IMPORT_LIMITS.MAX_FILES, `Massimo ${IMPORT_LIMITS.MAX_FILES} file`),
  options: ImportOptionsSchema.optional(),
});

type WorkoutImportParams = z.infer<typeof workoutImportParamsSchema>;

/**
 * Crea il context AI per il parsing di documenti e immagini
 * Usa WorkoutVisionService per parsing reale con Gemini/Claude
 */
function createAIContext(userId: string) {
  return {
    parseWithAI: async (
      content: string,
      mimeType: string,
      _prompt: string
    ): Promise<ImportedWorkoutProgram> => {
      // Route to appropriate parser based on MIME type
      const mimeTypeLower = mimeType.toLowerCase();

      // Images - use vision parsing
      if (mimeTypeLower.startsWith('image/')) {
        return VisionService.parseImage(content, mimeType, userId);
      }

      // PDF - use PDF parser
      if (mimeTypeLower === 'application/pdf') {
        return VisionService.parsePDF(content, userId);
      }

      // Documents (DOCX, DOC, ODT) - use document parser
      if (
        mimeTypeLower.includes('document') ||
        mimeTypeLower.includes('msword') ||
        mimeTypeLower.includes('opendocument.text')
      ) {
        return VisionService.parseDocument(content, mimeType, userId);
      }

      // Fallback per tipi sconosciuti - prova come documento
      logger.warn(`[WorkoutImport] Unknown MIME type ${mimeType}, trying document parser`);
      return VisionService.parseDocument(content, mimeType, userId);
    },
  };
}

/**
 * MCP Tool per l'import di programmi di allenamento da file
 */
export const workoutImportTool: McpTool<WorkoutImportParams> = {
  name: 'workout_import_from_file',
  description: `Import workout programs from files and convert them to structured WorkoutProgram.

Supported file formats:
- Spreadsheets: CSV, XLSX, XLS, ODS
- PDF: PDF documents (parsed with AI)
- Documents: DOCX, DOC, ODT
- Images: JPEG, PNG, WEBP, HEIC

Features:
- Automatic exercise matching with database catalog
- Support for multiple files (up to ${IMPORT_LIMITS.MAX_FILES})
- Two modes: 'auto' (full AI) or 'review' (user confirmation for unmatched)
- Multi-sheet/multi-page support
- Progression patterns using SetGroups

File requirements:
- Max ${IMPORT_LIMITS.MAX_FILE_SIZE / (1024 * 1024)}MB per file
- Files must be base64 encoded

Cost: ${IMPORT_LIMITS.DEFAULT_CREDIT_COST} credits per import (configurable by admin)`,

  parameters: workoutImportParamsSchema,

  execute: async (args: WorkoutImportParams, context: McpContext) => {
    // Verifica autenticazione
    if (!context.userId) {
      throw new Error('Authentication required');
    }

    // Validazione parametri
    const { files, options } = workoutImportParamsSchema.parse(args);
    const requestId = randomUUID();

    // Crea service con context AI
    const importService = new WorkoutImportService({
      aiContext: createAIContext(context.userId),
      onProgress: (progress: ImportProgress) => {
        // Log progress for debugging
        logger.warn(`[WorkoutImport][${requestId}] ${progress.step}: ${progress.message}`);
      },
      context: { requestId, userId: context.userId },
    });

    // Esegui import
    const result = await importService.import(files, context.userId, options);

    if (!result.success) {
      throw new Error(result.errors?.join('\n') || 'Import failed');
    }

    return {
      success: true,
      programId: result.programId,
      program: result.program,
      parseResult: result.parseResult,
      stats: result.stats,
      warnings: result.warnings,
    };
  },
};

/**
 * Export informazioni sui formati supportati (utile per UI)
 */
export const supportedFormats = {
  spreadsheets: ['csv', 'xlsx', 'xls', 'ods'],
  pdf: ['pdf'],
  documents: ['docx', 'doc', 'odt'],
  images: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
  mimeTypes: SUPPORTED_MIME_TYPES,
  maxFileSize: IMPORT_LIMITS.MAX_FILE_SIZE,
  maxFiles: IMPORT_LIMITS.MAX_FILES,
  creditCost: IMPORT_LIMITS.DEFAULT_CREDIT_COST,
};
