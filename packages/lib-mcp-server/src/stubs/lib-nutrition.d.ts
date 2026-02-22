import type {
  AIParseContext,
  ImportFile,
  ImportOptions,
  ImportProgress,
} from '@giulio-leone/lib-import-core';

export type NutritionImportResult = {
  success: boolean;
  planId?: string;
  plan?: unknown;
  warnings?: string[];
  errors?: string[];
  parseResult?: unknown;
  skipped?: number;
};

export class NutritionImportService {
  constructor(params: {
    aiContext: AIParseContext<unknown>;
    onProgress?: (progress: ImportProgress) => void;
    context: { userId: string; requestId?: string };
  });

  import(
    files: ImportFile[],
    userId: string,
    options?: Partial<ImportOptions>
  ): Promise<NutritionImportResult>;
}

export function createNutritionAIContext(): AIParseContext<unknown>;
