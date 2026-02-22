/**
 * Food Items Seed Data
 * Catalogo alimenti comuni italiani con traduzioni
 */

import type { PrismaClient } from '@prisma/client';
import { createId } from '@giulio-leone/lib-shared';
import type { Macros } from '@giulio-leone/types';

import { logger } from '../logger.service';
/**
 * Calculate main macro from macros
 */
function calculateMainMacro(macros: Macros): { type: string; percentage: number } {
  const protein = macros.protein || 0;
  const carbs = macros.carbs || 0;
  const fats = macros.fats || 0;

  // Calculate calories from each macro
  const proteinCalories = protein * 4;
  const carbsCalories = carbs * 4;
  const fatsCalories = fats * 9;

  const totalCalculatedCalories = proteinCalories + carbsCalories + fatsCalories;

  // If no macros, return balanced
  if (totalCalculatedCalories === 0) {
    return { type: 'BALANCED', percentage: 0 };
  }

  // Calculate percentages
  const proteinPercentage = (proteinCalories / totalCalculatedCalories) * 100;
  const carbsPercentage = (carbsCalories / totalCalculatedCalories) * 100;
  const fatsPercentage = (fatsCalories / totalCalculatedCalories) * 100;

  // Find predominant macro (must be > 40% to be considered predominant)
  const PREDOMINANCE_THRESHOLD = 40;

  let mainType: string;
  let mainPercentage: number;

  if (proteinPercentage >= carbsPercentage && proteinPercentage >= fatsPercentage) {
    mainType = 'PROTEIN';
    mainPercentage = proteinPercentage;
  } else if (carbsPercentage >= proteinPercentage && carbsPercentage >= fatsPercentage) {
    mainType = 'CARBS';
    mainPercentage = carbsPercentage;
  } else {
    mainType = 'FATS';
    mainPercentage = fatsPercentage;
  }

  // If no single macro is predominant (>40%), mark as BALANCED
  if (mainPercentage < PREDOMINANCE_THRESHOLD) {
    return { type: 'BALANCED', percentage: Math.round(mainPercentage * 10) / 10 };
  }

  // Round to 1 decimal place
  return {
    type: mainType,
    percentage: Math.round(mainPercentage * 10) / 10,
  };
}

/**
 * Calculate macro percentages from macros
 */
function calculateMacroPercentages(macros: Macros): {
  proteinPct: number;
  carbPct: number;
  fatPct: number;
} {
  const totalKcal = Math.max(1, macros.calories || 0);
  const proteinPct = Math.min(100, Math.max(0, ((macros.protein || 0) * 4 * 100) / totalKcal));
  const carbPct = Math.min(100, Math.max(0, ((macros.carbs || 0) * 4 * 100) / totalKcal));
  const fatPct = Math.min(100, Math.max(0, ((macros.fats || 0) * 9 * 100) / totalKcal));

  return {
    proteinPct: Number.isNaN(proteinPct) ? 0 : Number(proteinPct.toFixed(2)),
    carbPct: Number.isNaN(carbPct) ? 0 : Number(carbPct.toFixed(2)),
    fatPct: Number.isNaN(fatPct) ? 0 : Number(fatPct.toFixed(2)),
  };
}

export async function seedFoodItems(prisma: PrismaClient) {
  logger.warn('\n🍎 Seeding food items catalog...');

  const defaultBrandId = 'brand_generic_default';
  await prisma.food_brands.upsert({
    where: { id: defaultBrandId },
    update: { name: 'Generic', nameNormalized: 'generic' },
    create: {
      id: defaultBrandId,
      name: 'Generic',
      nameNormalized: 'generic',
    },
  });

  const foodItems = [
    // Proteine
    {
      id: 'food_chicken_breast',
      name: 'Chicken Breast',
      nameNormalized: 'chicken breast',
      barcode: null,
      macrosPer100g: {
        calories: 165,
        protein: 31,
        carbs: 0,
        fats: 3.6,
        fiber: 0,
      },
      servingSize: 100,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Chicken Breast',
          description: 'Skinless, boneless chicken breast',
        },
        {
          locale: 'it',
          name: 'Petto di Pollo',
          description: 'Petto di pollo senza pelle e senza ossa',
        },
      ],
    },
    {
      id: 'food_salmon',
      name: 'Salmon',
      nameNormalized: 'salmon',
      barcode: null,
      macrosPer100g: {
        calories: 208,
        protein: 20,
        carbs: 0,
        fats: 13,
        fiber: 0,
      },
      servingSize: 100,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Salmon',
          description: 'Atlantic salmon fillet',
        },
        {
          locale: 'it',
          name: 'Salmone',
          description: 'Filetto di salmone atlantico',
        },
      ],
    },
    {
      id: 'food_eggs',
      name: 'Eggs',
      nameNormalized: 'eggs',
      barcode: null,
      macrosPer100g: {
        calories: 155,
        protein: 13,
        carbs: 1.1,
        fats: 11,
        fiber: 0,
      },
      servingSize: 50,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Eggs',
          description: 'Whole eggs',
        },
        {
          locale: 'it',
          name: 'Uova',
          description: 'Uova intere',
        },
      ],
    },
    {
      id: 'food_greek_yogurt',
      name: 'Greek Yogurt',
      nameNormalized: 'greek yogurt',
      barcode: null,
      macrosPer100g: {
        calories: 97,
        protein: 10,
        carbs: 3.6,
        fats: 5,
        fiber: 0,
      },
      servingSize: 150,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Greek Yogurt',
          description: 'Plain Greek yogurt',
        },
        {
          locale: 'it',
          name: 'Yogurt Greco',
          description: 'Yogurt greco naturale',
        },
      ],
    },
    {
      id: 'food_tuna',
      name: 'Tuna',
      nameNormalized: 'tuna',
      barcode: null,
      macrosPer100g: {
        calories: 132,
        protein: 28,
        carbs: 0,
        fats: 1.3,
        fiber: 0,
      },
      servingSize: 80,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Tuna',
          description: 'Canned tuna in water',
        },
        {
          locale: 'it',
          name: 'Tonno',
          description: 'Tonno in scatola al naturale',
        },
      ],
    },

    // Carboidrati
    {
      id: 'food_brown_rice',
      name: 'Brown Rice',
      nameNormalized: 'brown rice',
      barcode: null,
      macrosPer100g: {
        calories: 112,
        protein: 2.6,
        carbs: 24,
        fats: 0.9,
        fiber: 1.8,
      },
      servingSize: 100,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Brown Rice',
          description: 'Cooked brown rice',
        },
        {
          locale: 'it',
          name: 'Riso Integrale',
          description: 'Riso integrale cotto',
        },
      ],
    },
    {
      id: 'food_oats',
      name: 'Oats',
      nameNormalized: 'oats',
      barcode: null,
      macrosPer100g: {
        calories: 389,
        protein: 16.9,
        carbs: 66.3,
        fats: 6.9,
        fiber: 10.6,
      },
      servingSize: 40,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Oats',
          description: 'Rolled oats',
        },
        {
          locale: 'it',
          name: 'Avena',
          description: 'Fiocchi di avena',
        },
      ],
    },
    {
      id: 'food_whole_wheat_pasta',
      name: 'Whole Wheat Pasta',
      nameNormalized: 'whole wheat pasta',
      barcode: null,
      macrosPer100g: {
        calories: 124,
        protein: 5.3,
        carbs: 26,
        fats: 0.5,
        fiber: 3.9,
      },
      servingSize: 100,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Whole Wheat Pasta',
          description: 'Cooked whole wheat pasta',
        },
        {
          locale: 'it',
          name: 'Pasta Integrale',
          description: 'Pasta integrale cotta',
        },
      ],
    },
    {
      id: 'food_sweet_potato',
      name: 'Sweet Potato',
      nameNormalized: 'sweet potato',
      barcode: null,
      macrosPer100g: {
        calories: 86,
        protein: 1.6,
        carbs: 20,
        fats: 0.1,
        fiber: 3,
      },
      servingSize: 150,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Sweet Potato',
          description: 'Cooked sweet potato',
        },
        {
          locale: 'it',
          name: 'Patata Dolce',
          description: 'Patata dolce cotta',
        },
      ],
    },
    {
      id: 'food_quinoa',
      name: 'Quinoa',
      nameNormalized: 'quinoa',
      barcode: null,
      macrosPer100g: {
        calories: 120,
        protein: 4.4,
        carbs: 21.3,
        fats: 1.9,
        fiber: 2.8,
      },
      servingSize: 100,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Quinoa',
          description: 'Cooked quinoa',
        },
        {
          locale: 'it',
          name: 'Quinoa',
          description: 'Quinoa cotta',
        },
      ],
    },

    // Verdure
    {
      id: 'food_broccoli',
      name: 'Broccoli',
      nameNormalized: 'broccoli',
      barcode: null,
      macrosPer100g: {
        calories: 34,
        protein: 2.8,
        carbs: 7,
        fats: 0.4,
        fiber: 2.6,
      },
      servingSize: 100,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Broccoli',
          description: 'Cooked broccoli',
        },
        {
          locale: 'it',
          name: 'Broccoli',
          description: 'Broccoli cotti',
        },
      ],
    },
    {
      id: 'food_spinach',
      name: 'Spinach',
      nameNormalized: 'spinach',
      barcode: null,
      macrosPer100g: {
        calories: 23,
        protein: 2.9,
        carbs: 3.6,
        fats: 0.4,
        fiber: 2.2,
      },
      servingSize: 100,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Spinach',
          description: 'Fresh spinach',
        },
        {
          locale: 'it',
          name: 'Spinaci',
          description: 'Spinaci freschi',
        },
      ],
    },
    {
      id: 'food_tomato',
      name: 'Tomato',
      nameNormalized: 'tomato',
      barcode: null,
      macrosPer100g: {
        calories: 18,
        protein: 0.9,
        carbs: 3.9,
        fats: 0.2,
        fiber: 1.2,
      },
      servingSize: 100,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Tomato',
          description: 'Fresh tomato',
        },
        {
          locale: 'it',
          name: 'Pomodoro',
          description: 'Pomodoro fresco',
        },
      ],
    },

    // Grassi Sani
    {
      id: 'food_almonds',
      name: 'Almonds',
      nameNormalized: 'almonds',
      barcode: null,
      macrosPer100g: {
        calories: 579,
        protein: 21.2,
        carbs: 21.6,
        fats: 49.9,
        fiber: 12.5,
      },
      servingSize: 28,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Almonds',
          description: 'Raw almonds',
        },
        {
          locale: 'it',
          name: 'Mandorle',
          description: 'Mandorle crude',
        },
      ],
    },
    {
      id: 'food_avocado',
      name: 'Avocado',
      nameNormalized: 'avocado',
      barcode: null,
      macrosPer100g: {
        calories: 160,
        protein: 2,
        carbs: 8.5,
        fats: 14.7,
        fiber: 6.7,
      },
      servingSize: 100,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Avocado',
          description: 'Fresh avocado',
        },
        {
          locale: 'it',
          name: 'Avocado',
          description: 'Avocado fresco',
        },
      ],
    },
    {
      id: 'food_olive_oil',
      name: 'Olive Oil',
      nameNormalized: 'olive oil',
      barcode: null,
      macrosPer100g: {
        calories: 884,
        protein: 0,
        carbs: 0,
        fats: 100,
        fiber: 0,
      },
      servingSize: 10,
      unit: 'ml',
      translations: [
        {
          locale: 'en',
          name: 'Olive Oil',
          description: 'Extra virgin olive oil',
        },
        {
          locale: 'it',
          name: 'Olio di Oliva',
          description: 'Olio extravergine di oliva',
        },
      ],
    },
    {
      id: 'food_peanut_butter',
      name: 'Peanut Butter',
      nameNormalized: 'peanut butter',
      barcode: null,
      macrosPer100g: {
        calories: 588,
        protein: 25,
        carbs: 20,
        fats: 50,
        fiber: 8,
      },
      servingSize: 32,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Peanut Butter',
          description: 'Natural peanut butter',
        },
        {
          locale: 'it',
          name: 'Burro di Arachidi',
          description: 'Burro di arachidi naturale',
        },
      ],
    },

    // Frutta
    {
      id: 'food_banana',
      name: 'Banana',
      nameNormalized: 'banana',
      barcode: null,
      macrosPer100g: {
        calories: 89,
        protein: 1.1,
        carbs: 22.8,
        fats: 0.3,
        fiber: 2.6,
      },
      servingSize: 120,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Banana',
          description: 'Fresh banana',
        },
        {
          locale: 'it',
          name: 'Banana',
          description: 'Banana fresca',
        },
      ],
    },
    {
      id: 'food_apple',
      name: 'Apple',
      nameNormalized: 'apple',
      barcode: null,
      macrosPer100g: {
        calories: 52,
        protein: 0.3,
        carbs: 13.8,
        fats: 0.2,
        fiber: 2.4,
      },
      servingSize: 150,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Apple',
          description: 'Fresh apple',
        },
        {
          locale: 'it',
          name: 'Mela',
          description: 'Mela fresca',
        },
      ],
    },
    {
      id: 'food_berries',
      name: 'Mixed Berries',
      nameNormalized: 'mixed berries',
      barcode: null,
      macrosPer100g: {
        calories: 57,
        protein: 0.7,
        carbs: 14.5,
        fats: 0.3,
        fiber: 2,
      },
      servingSize: 100,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Mixed Berries',
          description: 'Fresh mixed berries',
        },
        {
          locale: 'it',
          name: 'Frutti di Bosco',
          description: 'Frutti di bosco misti freschi',
        },
      ],
    },

    // Alimenti tipici italiani
    {
      id: 'food_mozzarella',
      name: 'Mozzarella',
      nameNormalized: 'mozzarella',
      barcode: null,
      macrosPer100g: {
        calories: 280,
        protein: 28,
        carbs: 3.1,
        fats: 17,
        fiber: 0,
      },
      servingSize: 100,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Mozzarella',
          description: 'Fresh mozzarella cheese',
        },
        {
          locale: 'it',
          name: 'Mozzarella',
          description: 'Mozzarella fresca',
        },
      ],
    },
    {
      id: 'food_parmesan',
      name: 'Parmesan',
      nameNormalized: 'parmesan',
      barcode: null,
      macrosPer100g: {
        calories: 431,
        protein: 38,
        carbs: 4.1,
        fats: 29,
        fiber: 0,
      },
      servingSize: 10,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Parmesan',
          description: 'Parmesan cheese',
        },
        {
          locale: 'it',
          name: 'Parmigiano Reggiano',
          description: 'Parmigiano Reggiano',
        },
      ],
    },
    {
      id: 'food_prosciutto',
      name: 'Prosciutto',
      nameNormalized: 'prosciutto',
      barcode: null,
      macrosPer100g: {
        calories: 145,
        protein: 25,
        carbs: 0.5,
        fats: 5,
        fiber: 0,
      },
      servingSize: 40,
      unit: 'g',
      translations: [
        {
          locale: 'en',
          name: 'Prosciutto',
          description: 'Italian dry-cured ham',
        },
        {
          locale: 'it',
          name: 'Prosciutto Crudo',
          description: 'Prosciutto crudo stagionato',
        },
      ],
    },
  ];

  for (const item of foodItems) {
    // Calculate mainMacro and macro percentages
    const mainMacro = calculateMainMacro(item.macrosPer100g);
    const { proteinPct, carbPct, fatPct } = calculateMacroPercentages(item.macrosPer100g);

    // Create food item
    await prisma.food_items.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        nameNormalized: item.nameNormalized,
        barcode: item.barcode,
        macrosPer100g: item.macrosPer100g,
        servingSize: item.servingSize,
        unit: item.unit,
        imageUrl: null,
        brandId: defaultBrandId,
        mainMacro: mainMacro,
        proteinPct: proteinPct,
        carbPct: carbPct,
        fatPct: fatPct,
        updatedAt: new Date(),
      },
      create: {
        id: item.id,
        name: item.name,
        nameNormalized: item.nameNormalized,
        barcode: item.barcode,
        macrosPer100g: item.macrosPer100g,
        servingSize: item.servingSize,
        unit: item.unit,
        imageUrl: null,
        brandId: defaultBrandId,
        mainMacro: mainMacro,
        proteinPct: proteinPct,
        carbPct: carbPct,
        fatPct: fatPct,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create translations
    for (const translation of item.translations) {
      await prisma.food_item_translations.upsert({
        where: {
          foodItemId_locale: {
            foodItemId: item.id,
            locale: translation.locale,
          },
        },
        update: {
          name: translation.name,
          description: translation.description,
          updatedAt: new Date(),
        },
        create: {
          id: createId(),
          foodItemId: item.id,
          locale: translation.locale,
          name: translation.name,
          description: translation.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
  }

  logger.warn(`✅ Food items catalog seeded: ${foodItems.length} items`);
}
