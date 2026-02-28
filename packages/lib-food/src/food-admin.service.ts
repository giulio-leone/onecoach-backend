import { prisma } from '@giulio-leone/lib-core';

import { FoodService } from './food.service';
import { normalizeFoodName } from './utils';
import type {
  FoodImportPayload,
  FoodImportOptions,
  FoodImportResult,
  NormalizedImportRecord,
  CreateFoodInput,
  UpdateFoodInput,
} from './types';

export class FoodAdminService {
  /**
   * Importa alimenti nel database con deduplica e merge
   */
  static async import(
    records: FoodImportPayload[],
    options: FoodImportOptions = {},
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
      records.map((record: any) => this.normalizeImportRecord(record)),
    );

    const nameCache = new Map<string, string>();

    for (let i = 0; i < normalizedRecords.length; i++) {
      const record = normalizedRecords[i];
      if (!record) continue;

      options.onProgress?.(i + 1, normalizedRecords.length);

      try {
        const existing = await prisma.food_items.findFirst({
          where: { nameNormalized: record.nameNormalized },
          select: { id: true, name: true },
        });

        if (!existing) {
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

        const updated = await FoodService.updateFood(existing.id, record.updateInput);
        nameCache.set(record.nameNormalized, updated.id);
        summary.updated += 1;
        summary.updatedItems.push({ id: updated.id, name: updated.name });
      } catch (error) {
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
  static async normalizeImportRecord(
    payload: FoodImportPayload,
  ): Promise<NormalizedImportRecord> {
    if (!payload.name || payload.name.trim().length < 2) {
      throw new Error('Ogni alimento deve avere un nome valido (min 2 caratteri)');
    }
    if (!payload.description || payload.description.trim().length < 10) {
      throw new Error('Ogni alimento deve avere una descrizione valida (min 10 caratteri)');
    }
    if (!payload.macrosPer100g) {
      throw new Error('Ogni alimento deve avere macrosPer100g');
    }
    if (!payload.servingSize || payload.servingSize < 1 || payload.servingSize > 10_000) {
      throw new Error('Ogni alimento deve avere servingSize valido (1-10000)');
    }

    const name = payload.name.trim();
    const nameNormalized = normalizeFoodName(name);
    const description = payload.description.trim();

    let validatedCategoryIds: string[] = [];
    if (payload.categoryIds && payload.categoryIds.length > 0) {
      const existingCategories = await prisma.food_categories.findMany({
        where: { id: { in: payload.categoryIds } },
        select: { id: true },
      });
      validatedCategoryIds = existingCategories.map((c: any) => c.id);
    }

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
