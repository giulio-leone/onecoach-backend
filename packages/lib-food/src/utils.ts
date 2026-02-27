import type { MacrosPer100g } from './types';

/**
 * Normalizza nome alimento per matching e deduplicazione.
 * Rimuove accenti, caratteri speciali, spazi multipli.
 */
export function normalizeFoodName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calcola macros per una quantità data partendo da macros per 100g.
 */
export function calculateMacrosFromQuantity(
  macrosPer100g: MacrosPer100g,
  quantity: number,
  unit: string = 'g',
): MacrosPer100g {
  let quantityInGrams = quantity;
  if (unit === 'kg') quantityInGrams = quantity * 1_000;
  else if (unit === 'ml' && macrosPer100g.calories) {
    quantityInGrams = quantity;
  }

  const multiplier = quantityInGrams / 100;
  return {
    calories: Math.round(macrosPer100g.calories * multiplier * 100) / 100,
    protein: Math.round(macrosPer100g.protein * multiplier * 100) / 100,
    carbs: Math.round(macrosPer100g.carbs * multiplier * 100) / 100,
    fats: Math.round(macrosPer100g.fats * multiplier * 100) / 100,
    fiber: macrosPer100g.fiber
      ? Math.round(macrosPer100g.fiber * multiplier * 100) / 100
      : undefined,
  };
}

/**
 * Aggiorna la configurazione del modello di visione nel database.
 */
export async function updateVisionModelConfig(
  labelExtraction?: string,
  dishSegmentation?: string,
): Promise<void> {
  const { prisma } = await import('@giulio-leone/lib-core');
  const { AIProvider } = await import('@prisma/client');

  const currentConfig = await prisma.ai_provider_configs.findUnique({
    where: { provider: AIProvider.OPENROUTER },
  });

  const currentMetadata = (currentConfig?.metadata ?? {}) as Record<string, unknown>;
  const currentVisionModels = (currentMetadata.visionModels ?? {}) as Record<string, unknown>;

  const updatedVisionModels = {
    ...currentVisionModels,
    ...(labelExtraction && { labelExtraction }),
    ...(dishSegmentation && { dishSegmentation }),
  };

  await prisma.ai_provider_configs.upsert({
    where: { provider: AIProvider.OPENROUTER },
    update: {
      metadata: {
        ...currentMetadata,
        visionModels: updatedVisionModels,
      },
    },
    create: {
      provider: AIProvider.OPENROUTER,
      isEnabled: true,
      updatedAt: new Date(),
      metadata: {
        visionModels: updatedVisionModels,
      },
    },
  });
}
