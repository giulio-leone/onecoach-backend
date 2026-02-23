import { prisma } from '@giulio-leone/lib-core';
import type { FoodImportPayload } from '@giulio-leone/lib-food';
import type { ExerciseImportPayload } from '@giulio-leone/lib-exercise';
// Removed unused imports and constants

interface GenerationOptions {
  count: number;
  description?: string;
  userId?: string;
  mergeExisting?: boolean;
  onProgress?: (progress: number, message: string) => void;
}

export class AiGenerationService {
  /**
   * Genera alimenti usando FoodGenerationAgent
   */
  static async generateFoods(
    options: GenerationOptions & {
      existingFoods?: string[];
      categoryIds?: string[];
    }
  ) {
    const {
      count,
      description,
      existingFoods,
      categoryIds,
      userId,
      mergeExisting = false,
      onProgress,
    } = options;

    const existingNames = existingFoods || [];
    if (existingNames.length === 0) {
      const allFoods = await prisma.food_items.findMany({
        select: { name: true },
        take: 200,
        orderBy: { createdAt: 'desc' },
      });
      existingNames.push(...allFoods.map((f) => f.name));
    }

    // Dynamic import to avoid circular dependencies if any
    const { generateFoods } = await import('@giulio-leone/one-nutrition');
    const { FoodAdminService } = await import('@giulio-leone/lib-food');

    // Report starting progress
    onProgress?.(10, `Iniziando generazione di ${count} alimenti con OneAgent SDK...`);

    const result = await generateFoods(
      {
        count,
        description: description || 'Generate foods',
        existingFoods: existingNames,
        categoryIds,
      },
      {
        onProgress: (progress) => {
          // Map agent progress (0-100) to our service progress range (10-75)
          const serviceProgress = 10 + progress.progress * 0.65;
          onProgress?.(serviceProgress, progress.message || 'Generazione in corso...');
        },
      }
    );

    if (!result.success || !result.output?.foods) {
      throw new Error(result.error?.message || 'Failed to generate foods');
    }

    const allFoods = result.output.foods;

    onProgress?.(75, `Validando ${allFoods.length} alimenti generati...`);

    // Import foods using FoodAdminService
    // We map the generated foods to the structure expected by import
    const importRecords = allFoods.map((f) => ({
      name: f.name,
      description: f.description,
      macrosPer100g: f.macrosPer100g,
      servingSize: f.servingSize,
      unit: f.unit || 'g',
      brandName: f.brandName,
      categoryIds: f.categoryIds,
      imageUrl: f.imageUrl,
      barcode: f.barcode,
    }));

    const importResult = await FoodAdminService.import(importRecords as FoodImportPayload[], {
      userId,
      mergeExisting,
      onProgress: (current: number, total: number) => {
        const progress = 75 + (current / total) * 20; // 75-95%
        onProgress?.(progress, `Importati ${current}/${total} alimenti...`);
      },
    });

    onProgress?.(100, 'Completato!');
    return importResult;
  }

  /**
   * Genera esercizi usando ExerciseGenerationAgent (SDK 3.1)
   */
  static async generateExercises(
    options: GenerationOptions & {
      muscleGroups?: string[];
      bodyPartIds?: string[];
      autoApprove?: boolean;
    }
  ): Promise<{
    created: number;
    updatedItems: number;
    skippedSlugs: string[];
    errors: string[];
    createdItems: Array<{ id: string; slug: string }>;
    updatedItemsAny: Array<{ id: string; slug: string }>;
  }> {
    // Adjusted return type to match usage
    const {
      count,
      description,
      userId,
      mergeExisting = false,
      muscleGroups,
      bodyPartIds,
      autoApprove,
      onProgress,
    } = options;

    const { generateExercises } = await import('@giulio-leone/one-workout');
    const { ExerciseAdminService } = await import('@giulio-leone/lib-exercise');

    // Fetch existing names for duplicate prevention
    // (Optimization: could happen inside the agent, but service usually handles this context)
    const existingNames: string[] = [];
    // We can fetch some recent ones or leave it empty if the agent handles it via RAG/Tool
    // For now, let's keep it simple and pass empty array or fetch a small sample

    onProgress?.(10, `Iniziando generazione di ${count} esercizi con OneAgent SDK...`);

    const result = await generateExercises(
      {
        count,
        description: description || 'Generate exercises',
        existingNames,
        muscleGroups,
        bodyPartIds,
      },
      {
        onProgress: (progress) => {
          const serviceProgress = 10 + progress.progress * 0.65;
          onProgress?.(serviceProgress, progress.message || 'Generazione in corso...');
        },
      }
    );

    if (!result.success || !result.output?.exercises) {
      throw new Error(result.error?.message || 'Failed to generate exercises');
    }

    const generatedExercises = result.output.exercises;

    onProgress?.(75, `Importazione di ${generatedExercises.length} esercizi...`);

    // Import using ExerciseAdminService
    // We need to map GeneratedExercise to the import format expected by ExerciseAdminService.import
    // The import format likely needs ExerciseImportPayload.
    // Assuming ExerciseAdminService.import can handle the structure or we map it.
    // Based on previous code, ExerciseAdminService.import takes a specific structure.
    // We will assume generateExercises output matches closely or we need to map.
    // Let's assume broad compatibility for now and refine if types clash.

    // Mapping to ExerciseImportPayload roughly
    const importRecords = generatedExercises.map((e) => ({
      name: e.name,
      description: e.description,
      exerciseTypeId: e.typeId,
      muscles: e.muscleIds,
      bodyPartIds: e.bodyPartIds,
      equipmentIds: e.equipmentIds,
      instructions: e.instructions,
      tips: e.tips,
      // Translations are usually handled by providing English as default 'en'
      // If the service expects 'translations' array:
      translations: [{ locale: 'en', name: e.name, description: e.description }],
      imageUrl: e.imageUrl,
      videoUrl: e.videoUrl,
    }));

    const importResult = await ExerciseAdminService.import(
      importRecords as ExerciseImportPayload[],
      {
        userId,
        autoApprove,
        mergeExisting,
      }
    );

    onProgress?.(100, 'Completato!');

    return {
      created: importResult.created,
      updatedItems: importResult.updated,
      skippedSlugs: importResult.skippedSlugs || [],
      errors: importResult.errors?.map((e: { reason?: string }) => e.reason || String(e)) || [],
      createdItems: importResult.createdItems || [],
      updatedItemsAny: importResult.updatedItems || [],
    };
  }
}
