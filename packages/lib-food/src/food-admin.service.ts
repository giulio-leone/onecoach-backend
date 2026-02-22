/**
 * Food Admin Service
 *
 * Utility dedicate alla gestione avanzata del catalogo alimenti:
 * - Import/export in formato JSON con deduplica
 * - Operazioni batch (CRUD) e automazioni AI
 */

import { prisma } from '@giulio-leone/lib-core';
import { FoodService, normalizeFoodName } from './food.service';
import { createFoodSchema, type CreateFoodInput, type UpdateFoodInput } from '@giulio-leone/schemas';
import { z } from 'zod';
// import { FoodGenerationAgent, createAIAgentConfig, createAgentInstance } from '@giulio-leone/one-agent';
// import { processBatchesInParallel } from '@giulio-leone/lib-shared/batch-processing';
// import { normalizeUrl } from '@giulio-leone/lib-shared/url-normalizer';

// import { TOKEN_LIMITS } from '@giulio-leone/constants';
// import { MODEL_CONSTANTS } from '@giulio-leone/lib-ai';



/**
 * Schema per import payload (estende createFoodSchema)
 * IMPORTANTE: name, description, macrosPer100g, servingSize sono OBBLIGATORI
 */
const foodImportSchemaBase = createFoodSchema;

// Validazione esplicita per assicurarsi che i campi obbligatori siano sempre presenti
export const foodImportSchema = foodImportSchemaBase.superRefine((data, ctx) => {
  // Verifica name
  if (!data.name || data.name.trim() === '') {
    ctx.addIssue({
      code: 'custom',
      message: 'name è obbligatorio e non può essere vuoto',
      path: ['name'],
    });
  }

  // Verifica description
  if (!data.description || data.description.trim() === '') {
    ctx.addIssue({
      code: 'custom',
      message: 'description è obbligatorio e non può essere vuoto (min 10 caratteri)',
      path: ['description'],
    });
  } else if (data.description.trim().length < 10) {
    ctx.addIssue({
      code: 'custom',
      message: 'description deve essere di almeno 10 caratteri',
      path: ['description'],
    });
  }

  // Verifica macrosPer100g
  if (!data.macrosPer100g) {
    ctx.addIssue({
      code: 'custom',
      message: 'macrosPer100g è obbligatorio',
      path: ['macrosPer100g'],
    });
  } else {
    const { calories, protein, carbs, fats } = data.macrosPer100g;
    if (
      typeof calories !== 'number' ||
      typeof protein !== 'number' ||
      typeof carbs !== 'number' ||
      typeof fats !== 'number'
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'macrosPer100g deve contenere calories, protein, carbs, fats come numeri',
        path: ['macrosPer100g'],
      });
    }
  }

  // Verifica servingSize
  if (!data.servingSize || data.servingSize < 1 || data.servingSize > 10000) {
    ctx.addIssue({
      code: 'custom',
      message: 'servingSize è obbligatorio e deve essere tra 1 e 10000',
      path: ['servingSize'],
    });
  }
});

export type FoodImportPayload = z.infer<typeof foodImportSchema>;

interface NormalizedImportRecord {
  name: string;
  nameNormalized: string;
  createInput: CreateFoodInput;
  updateInput: UpdateFoodInput;
  categoryIds: string[];
}

export interface FoodImportResult {
  created: number;
  updated: number;
  skipped: number;
  createdItems: Array<{ id: string; name: string }>;
  updatedItems: Array<{ id: string; name: string }>;
  skippedNames: string[];
  errors: Array<{ name: string; reason: string }>;
}

interface ImportOptions {
  userId?: string;
  mergeExisting?: boolean;
  onProgress?: (current: number, total: number) => void;
}

export class FoodAdminService {
  /**
   * Genera alimenti usando FoodGenerationAgent (OneAgent SDK)
   * Usa parallel batch processing per migliori performance
   */
// Circular Dependency: This method requires OneAgent which depends on lib-ai-agents which depends on lib-food.
  // It should be moved to the application layer or lib-ai-agents.
  /*
  static async generateFoodsWithAgent(options: {
    count: number;
    description?: string;
    existingFoods?: string[];
    categoryIds?: string[];
    userId?: string;
    mergeExisting?: boolean;
    onProgress?: (progress: number, message: string) => void;
  }): Promise<FoodImportResult> {
    const {
      count,
      description,
      existingFoods,
      categoryIds,
      userId,
      mergeExisting = false,
      onProgress,
    } = options;

    // Get existing foods for duplicate prevention
    const existingNames = existingFoods || [];
    if (existingNames.length === 0) {
      const allFoods = await prisma.food_items.findMany({
        select: {
          name: true,
        },
        take: 200,
        orderBy: { createdAt: 'desc' },
      });
      existingNames.push(...allFoods.map((f) => f.name));
    }

    // Create AI agent configuration using shared utility
    const agentConfig = await createAIAgentConfig({
      modelTier: 'balanced',
      temperature: MODEL_CONSTANTS.DEFAULT_TEMPERATURE,
      maxTokens: TOKEN_LIMITS.DEFAULT_MAX_TOKENS,
    });

    // Create FoodGenerationAgent using shared utility
    const agent = createAgentInstance(FoodGenerationAgent, agentConfig);

    // Generate foods in batches using shared batch processing utility
    const batchSize = 5; // Generate 5 foods per batch
    const batches = Math.ceil(count / batchSize);
    const batchIndices = Array.from({ length: batches }, (_, i) => i);

    // Progress ranges: 10-60% for generation, 60-75% for validation, 75-95% for import
    const generationStartProgress = 10;
    const generationEndProgress = 60;
    const validationStartProgress = 60;
    const validationEndProgress = 75;
    const importStartProgress = 75;
    const importEndProgress = 95;

    onProgress?.(
      generationStartProgress,
      `Iniziando generazione di ${count} alimenti in ${batches} batch...`
    );

    let generatedCount = 0;
    const allFoods = await processBatchesInParallel({
      items: batchIndices,
      batchSize: 1, // Process one batch index at a time, but in parallel groups
      parallelGroups: 4, // Increased from 2 to 4 for faster generation
      processor: async (batch, _batchIndex) => {
        const batchIdx = batch[0]; // Get the batch index
        if (batchIdx === undefined) return [];
        const batchCount = Math.min(batchSize, count - batchIdx * batchSize);
        if (batchCount <= 0) return [];

        onProgress?.(
          generationStartProgress +
            (batchIdx / batches) * (generationEndProgress - generationStartProgress),
          `Generando batch ${batchIdx + 1}/${batches} (${batchCount} alimenti)...`
        );

        const result = await agent.execute(
          {
            count: batchCount,
            existingFoods: existingNames,
            categoryIds,
            description, // Always include user description to ensure all batches follow user request
          },
          {
            requestId: `food-gen-${Date.now()}-${batchIdx}`,
            input: {},
            userId: userId || '',
            partialResults: {},
            executionHistory: [],
            currentStep: 'food_generation',
            metadata: { startedAt: new Date(), lastUpdatedAt: new Date() },
            needsRetry: false,
            retryCount: 0,
            maxRetries: 2,
          } as any
        );

        const generatedFoods = (result.output?.foods || []) as GeneratedFood[];
        generatedCount += generatedFoods.length;
        onProgress?.(
          generationStartProgress +
            ((batchIdx + 1) / batches) * (generationEndProgress - generationStartProgress),
          `Batch ${batchIdx + 1}/${batches} completato. Generati ${generatedCount}/${count} alimenti finora...`
        );

        return generatedFoods;
      },
      onGroupComplete: (results) => {
        // Update existing names after group completes (avoid race conditions)
        const typedResults = results as GeneratedFood[];
        existingNames.push(...typedResults.map((f) => f.name).filter(Boolean));
      },
      initialState: existingNames,
    });

    if (allFoods.length === 0) {
      throw new Error('Failed to generate any foods');
    }

    onProgress?.(validationStartProgress, `Validando ${allFoods.length} alimenti generati...`);

    // Track seen barcodes in this batch to prevent duplicates
    const seenBarcodes = new Set<string>();

    // Convert to import format with validation
    let validatedCount = 0;
    const importRecords: FoodImportPayload[] = allFoods
      .map((food: unknown): FoodImportPayload | null => {
        const f = food as Partial<GeneratedFood>;
        // Validate required fields
        if (!f.name || f.name.trim().length < 2) {
          return null;
        }

        if (!f.description || f.description.trim().length < 10) {
          return null;
        }

        if (!f.macrosPer100g) {
          return null;
        }

        if (!f.servingSize || f.servingSize < 1 || f.servingSize > 10000) {
          return null;
        }

        // Sanitize barcode
        let barcode: string | undefined = undefined;
        if (
          f.barcode &&
          typeof f.barcode === 'string' &&
          f.barcode.trim().length > 3 &&
          !['000000', '123456', '123456789', '111111', '999999', '0000000000000'].includes(
            f.barcode.trim()
          )
        ) {
          const trimmedBarcode = f.barcode.trim();
          // Only use if unique in this batch
          if (!seenBarcodes.has(trimmedBarcode)) {
            barcode = trimmedBarcode;
            seenBarcodes.add(trimmedBarcode);
          }
        }

        const record = {
          name: f.name.trim(),
          description: f.description.trim(),
          macrosPer100g: f.macrosPer100g as Macros,
          servingSize: f.servingSize,
          unit: f.unit || 'g',
          brandName: f.brandName || 'Generic',
          categoryIds: f.categoryIds || [],
          imageUrl: normalizeUrl(f.imageUrl),
          barcode,
        };

        validatedCount++;
        if (validatedCount % 5 === 0) {
          onProgress?.(
            validationStartProgress +
              (validatedCount / allFoods.length) *
                (validationEndProgress - validationStartProgress),
            `Validati ${validatedCount}/${allFoods.length} alimenti...`
          );
        }

        return record;
      })
      .filter((record): record is FoodImportPayload => {
        if (record === null) return false;
        // Type guard: ensure record has required fields
        return (
          !!record.name && !!record.description && !!record.macrosPer100g && !!record.servingSize
        );
      });

    if (importRecords.length === 0) {
      throw new Error(
        'No valid foods generated (missing required fields: name, description, macrosPer100g, or servingSize)'
      );
    }

    onProgress?.(
      validationEndProgress,
      `${importRecords.length} alimenti validati. Iniziando import nel database...`
    );

    // Import foods with progress updates
    const importResult = await this.import(importRecords, {
      userId,
      mergeExisting,
      onProgress: (current, total) => {
        const progress =
          importStartProgress + (current / total) * (importEndProgress - importStartProgress);
        onProgress?.(progress, `Importati ${current}/${total} alimenti nel database...`);
      },
    });

    onProgress?.(
      importEndProgress,
      `Completato! ${importResult.created} creati, ${importResult.updated} aggiornati, ${importResult.skipped} saltati.`
    );

    return importResult;
  }
  */

  /**
   * Importa alimenti nel database con deduplica e merge
   */
  static async import(
    records: FoodImportPayload[],
    options: ImportOptions = {}
  ): Promise<FoodImportResult> {
    const summary: FoodImportResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      createdItems: [],
      updatedItems: [],
      skippedNames: [],
      errors: [],
    };

    if (records.length === 0) {
      return summary;
    }

    const normalizedRecords = await Promise.all(
      records.map((record) => this.normalizeImportRecord(record))
    );
    const nameCache = new Map<string, string>(); // name -> foodId

    for (let i = 0; i < normalizedRecords.length; i++) {
      const record = normalizedRecords[i];
      if (!record) continue;

      options.onProgress?.(i + 1, normalizedRecords.length);
      try {
        // Verifica se esiste già un alimento con lo stesso nome normalizzato
        const existing = await prisma.food_items.findFirst({
          where: { nameNormalized: record.nameNormalized },
          select: { id: true, name: true },
        });

        if (!existing) {
          // Crea nuovo alimento
          const created = await FoodService.createFood(record.createInput);

          nameCache.set(record.nameNormalized, created.id);
          summary.created += 1;
          summary.createdItems.push({ id: created.id, name: created.name });

          continue;
        }

        if (options.mergeExisting === false) {
          summary.skipped += 1;
          summary.skippedNames.push(record.name);
          continue;
        }

        // Aggiorna alimento esistente
        const updated = await FoodService.updateFood(existing.id, record.updateInput);

        nameCache.set(record.nameNormalized, updated.id);
        summary.updated += 1;
        summary.updatedItems.push({ id: updated.id, name: updated.name });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        summary.errors.push({
          name: record.name,
          reason: errorMessage,
        });
      }
    }

    options.onProgress?.(normalizedRecords.length, normalizedRecords.length);

    return summary;
  }

  /**
   * Normalizza payload di import generando campi coerenti
   */
  private static async normalizeImportRecord(
    payload: FoodImportPayload
  ): Promise<NormalizedImportRecord> {
    // Validate required fields early
    if (!payload.name || payload.name.trim().length < 2) {
      throw new Error('Ogni alimento deve avere un nome valido (min 2 caratteri)');
    }

    if (!payload.description || payload.description.trim().length < 10) {
      throw new Error('Ogni alimento deve avere una descrizione valida (min 10 caratteri)');
    }

    if (!payload.macrosPer100g) {
      throw new Error('Ogni alimento deve avere macrosPer100g');
    }

    if (!payload.servingSize || payload.servingSize < 1 || payload.servingSize > 10000) {
      throw new Error('Ogni alimento deve avere servingSize valido (1-10000)');
    }

    const name = payload.name.trim();
    const nameNormalized = normalizeFoodName(name);
    const description = payload.description.trim();

    // Valida categoryIds se forniti
    let validatedCategoryIds: string[] = [];
    if (payload.categoryIds && payload.categoryIds.length > 0) {
      const existingCategories = await prisma.food_categories.findMany({
        where: { id: { in: payload.categoryIds } },
        select: { id: true },
      });
      validatedCategoryIds = existingCategories.map((c) => c.id);
    }

    // Brand: usa brandName o default "Generic"
    const brandName = payload.brandName?.trim() || 'Generic';

    const createInput: CreateFoodInput = {
      name,
      description,
      macrosPer100g: payload.macrosPer100g,
      servingSize: payload.servingSize,
      unit: payload.unit || 'g',
      brandName,
      categoryIds: validatedCategoryIds.length > 0 ? validatedCategoryIds : undefined,
      imageUrl: payload.imageUrl,
      barcode: payload.barcode,
    };

    const updateInput: UpdateFoodInput = {
      name,
      description,
      macrosPer100g: payload.macrosPer100g,
      servingSize: payload.servingSize,
      unit: payload.unit || 'g',
      brandName,
      categoryIds: validatedCategoryIds.length > 0 ? validatedCategoryIds : undefined,
      imageUrl: payload.imageUrl,
      barcode: payload.barcode,
    };

    return {
      name,
      nameNormalized,
      createInput,
      updateInput,
      categoryIds: validatedCategoryIds,
    };
  }
}
