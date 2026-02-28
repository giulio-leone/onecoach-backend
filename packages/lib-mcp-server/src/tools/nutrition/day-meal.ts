import type { Prisma } from '@prisma/client';
/**
 * MCP Nutrition Day & Meal Tools
 *
 * Tools for managing days and meals within a nutrition plan.
 *
 * @module lib-mcp-server/tools/nutrition/day-meal
 */

import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { prisma } from '@giulio-leone/lib-core';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface MealFood {
  foodId: string;
  name: string;
  quantity: number;
  unit: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface Meal {
  name: string;
  time: string;
  targetCalories: number;
  targetMacros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  foods: MealFood[];
}

interface Day {
  dayNumber: number;
  dayName: string;
  meals: Meal[];
  totalCalories: number;
  totalMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface Week {
  weekNumber: number;
  days: Day[];
  notes: string;
}

// Helper to parse weeks from JSON
function parseWeeks(weeksJson: Prisma.JsonValue): Week[] {
  if (!weeksJson || !Array.isArray(weeksJson)) {
    return [];
  }
  return weeksJson as unknown as Week[];
}

// Helper to serialize weeks for Prisma
function serializeWeeks(weeks: Week[]): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(weeks)) as Prisma.InputJsonValue;
}

// ============================================================================
// DAY TOOLS
// ============================================================================

export const nutritionGetDayTool: McpTool = {
  name: 'nutrition_get_day',
  description: 'Gets a specific day from a nutrition plan',
  parameters: z.object({
    planId: z.string(),
    weekNumber: z.number().int().min(1),
    dayNumber: z.number().int().min(1).max(7),
  }),
  execute: async (args, _context: McpContext) => {
    const plan = await prisma.nutrition_plans.findUnique({
      where: { id: args.planId },
    });

    if (!plan) {
      throw new Error('Piano non trovato');
    }

    const weeks = parseWeeks(plan.weeks);
    const week = weeks.find((w: any) => w.weekNumber === args.weekNumber);

    if (!week) {
      throw new Error(`Settimana ${args.weekNumber} non trovata`);
    }

    const day = week.days.find((d: any) => d.dayNumber === args.dayNumber);

    if (!day) {
      throw new Error(`Giorno ${args.dayNumber} non trovato`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `📅 **${day.dayName}** (Settimana ${args.weekNumber})

🍽️ **Pasti:** ${day.meals.length}
📊 **Target:** ${day.totalCalories} kcal

${day.meals.map((m: any) => `- ${m.time} ${m.name}: ${m.targetCalories} kcal`).join('\n')}`,
        },
      ],
      day,
    };
  },
};

export const nutritionUpdateDayTool: McpTool = {
  name: 'nutrition_update_day',
  description: 'Updates a day in the nutrition plan (notes, calories adjustment)',
  parameters: z.object({
    planId: z.string(),
    weekNumber: z.number().int().min(1),
    dayNumber: z.number().int().min(1).max(7),
    calorieAdjustment: z.number().optional(),
    notes: z.string().optional(),
  }),
  execute: async (args, _context: McpContext) => {
    const plan = await prisma.nutrition_plans.findUnique({
      where: { id: args.planId },
    });

    if (!plan) {
      throw new Error('Piano non trovato');
    }

    const weeks = parseWeeks(plan.weeks);
    const weekIndex = weeks.findIndex((w) => w.weekNumber === args.weekNumber);

    if (weekIndex === -1) {
      throw new Error(`Settimana ${args.weekNumber} non trovata`);
    }

    const week = weeks[weekIndex]!;
    const dayIndex = week.days.findIndex((d) => d.dayNumber === args.dayNumber);

    if (dayIndex === -1) {
      throw new Error(`Giorno ${args.dayNumber} non trovato`);
    }

    const day = week.days[dayIndex]!;

    if (args.calorieAdjustment) {
      day.totalCalories += args.calorieAdjustment;
      const adjustmentFactor = day.totalCalories / (day.totalCalories - args.calorieAdjustment);
      day.meals.forEach((meal: any) => {
        meal.targetCalories = Math.round(meal.targetCalories * adjustmentFactor);
      });
    }

    weeks[weekIndex]!.days[dayIndex] = day;

    await prisma.nutrition_plans.update({
      where: { id: args.planId },
      data: {
        weeks: serializeWeeks(weeks),
        updatedAt: new Date(),
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Giorno ${args.dayNumber} aggiornato (${day.totalCalories} kcal)`,
        },
      ],
      day,
    };
  },
};

export const nutritionCopyDayTool: McpTool = {
  name: 'nutrition_copy_day',
  description: 'Copies a day from one position to another within the plan',
  parameters: z.object({
    planId: z.string(),
    sourceWeek: z.number().int().min(1),
    sourceDay: z.number().int().min(1).max(7),
    targetWeek: z.number().int().min(1),
    targetDay: z.number().int().min(1).max(7),
  }),
  execute: async (args, _context: McpContext) => {
    const plan = await prisma.nutrition_plans.findUnique({
      where: { id: args.planId },
    });

    if (!plan) {
      throw new Error('Piano non trovato');
    }

    const weeks = parseWeeks(plan.weeks);

    const sourceWeekObj = weeks.find((w: any) => w.weekNumber === args.sourceWeek);
    if (!sourceWeekObj) {
      throw new Error(`Settimana sorgente ${args.sourceWeek} non trovata`);
    }

    const sourceDay = sourceWeekObj.days.find((d: any) => d.dayNumber === args.sourceDay);
    if (!sourceDay) {
      throw new Error(`Giorno sorgente ${args.sourceDay} non trovato`);
    }

    const targetWeekIndex = weeks.findIndex((w) => w.weekNumber === args.targetWeek);
    if (targetWeekIndex === -1) {
      throw new Error(`Settimana target ${args.targetWeek} non trovata`);
    }

    const targetWeek = weeks[targetWeekIndex]!;
    const targetDayIndex = targetWeek.days.findIndex((d) => d.dayNumber === args.targetDay);
    if (targetDayIndex === -1) {
      throw new Error(`Giorno target ${args.targetDay} non trovato`);
    }

    const dayNames = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
    const copiedDay: Day = {
      ...JSON.parse(JSON.stringify(sourceDay)),
      dayNumber: args.targetDay,
      dayName: dayNames[args.targetDay - 1] ?? 'Giorno',
    };

    weeks[targetWeekIndex]!.days[targetDayIndex] = copiedDay;

    await prisma.nutrition_plans.update({
      where: { id: args.planId },
      data: {
        weeks: serializeWeeks(weeks),
        updatedAt: new Date(),
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Giorno copiato: Settimana ${args.sourceWeek} Giorno ${args.sourceDay} → Settimana ${args.targetWeek} Giorno ${args.targetDay}`,
        },
      ],
    };
  },
};

// ============================================================================
// MEAL TOOLS
// ============================================================================

export const nutritionGetMealTool: McpTool = {
  name: 'nutrition_get_meal',
  description: 'Gets a specific meal from a day',
  parameters: z.object({
    planId: z.string(),
    weekNumber: z.number().int().min(1),
    dayNumber: z.number().int().min(1).max(7),
    mealName: z.string(),
  }),
  execute: async (args, _context: McpContext) => {
    const plan = await prisma.nutrition_plans.findUnique({
      where: { id: args.planId },
    });

    if (!plan) {
      throw new Error('Piano non trovato');
    }

    const weeks = parseWeeks(plan.weeks);
    const week = weeks.find((w: any) => w.weekNumber === args.weekNumber);

    if (!week) {
      throw new Error(`Settimana ${args.weekNumber} non trovata`);
    }

    const day = week.days.find((d: any) => d.dayNumber === args.dayNumber);

    if (!day) {
      throw new Error(`Giorno ${args.dayNumber} non trovato`);
    }

    const meal = day.meals.find((m: any) => m.name.toLowerCase() === args.mealName.toLowerCase());

    if (!meal) {
      throw new Error(`Pasto "${args.mealName}" non trovato`);
    }

    const totalMacros = meal.foods.reduce((acc: any, f: any) => ({
        calories: acc.calories + f.macros.calories,
        protein: acc.protein + f.macros.protein,
        carbs: acc.carbs + f.macros.carbs,
        fat: acc.fat + f.macros.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      content: [
        {
          type: 'text',
          text: `🍽️ **${meal.name}** (${meal.time})

📊 **Target:** ${meal.targetCalories} kcal
📊 **Attuale:** ${totalMacros.calories} kcal | P: ${totalMacros.protein}g | C: ${totalMacros.carbs}g | F: ${totalMacros.fat}g

🥗 **Alimenti (${meal.foods.length}):**
${meal.foods.map((f: any) => `- ${f.name}: ${f.quantity}${f.unit} (${f.macros.calories} kcal)`).join('\n') || 'Nessun alimento'}`,
        },
      ],
      meal,
    };
  },
};

export const nutritionAddFoodToMealTool: McpTool = {
  name: 'nutrition_add_food_to_meal',
  description: 'Adds a food item to a meal',
  parameters: z.object({
    planId: z.string(),
    weekNumber: z.number().int().min(1),
    dayNumber: z.number().int().min(1).max(7),
    mealName: z.string(),
    foodId: z.string(),
    quantity: z.number().positive(),
    unit: z.string().default('g'),
  }),
  execute: async (args, _context: McpContext) => {
    // Fetch food item
    const foodItem = await prisma.food_items.findUnique({
      where: { id: args.foodId },
    });

    if (!foodItem) {
      throw new Error('Alimento non trovato nel database');
    }

    const plan = await prisma.nutrition_plans.findUnique({
      where: { id: args.planId },
    });

    if (!plan) {
      throw new Error('Piano non trovato');
    }

    const weeks = parseWeeks(plan.weeks);
    const weekIndex = weeks.findIndex((w) => w.weekNumber === args.weekNumber);

    if (weekIndex === -1) {
      throw new Error(`Settimana ${args.weekNumber} non trovata`);
    }

    const week = weeks[weekIndex]!;
    const dayIndex = week.days.findIndex((d) => d.dayNumber === args.dayNumber);

    if (dayIndex === -1) {
      throw new Error(`Giorno ${args.dayNumber} non trovato`);
    }

    const day = week.days[dayIndex]!;
    const mealIndex = day.meals.findIndex(
      (m) => m.name.toLowerCase() === args.mealName.toLowerCase()
    );

    if (mealIndex === -1) {
      throw new Error(`Pasto "${args.mealName}" non trovato`);
    }

    // Calculate macros based on quantity
    const macrosBase = foodItem.macrosPer100g as {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    } | null;
    const multiplier = args.quantity / 100;
    const calculatedMacros = {
      calories: Math.round((macrosBase?.calories ?? 0) * multiplier),
      protein: Math.round((macrosBase?.protein ?? 0) * multiplier * 10) / 10,
      carbs: Math.round((macrosBase?.carbs ?? 0) * multiplier * 10) / 10,
      fat: Math.round((macrosBase?.fat ?? 0) * multiplier * 10) / 10,
    };

    const newFood: MealFood = {
      foodId: args.foodId,
      name: foodItem.name,
      quantity: args.quantity,
      unit: args.unit,
      macros: calculatedMacros,
    };

    weeks[weekIndex]!.days[dayIndex]!.meals[mealIndex]!.foods.push(newFood);

    await prisma.nutrition_plans.update({
      where: { id: args.planId },
      data: {
        weeks: serializeWeeks(weeks),
        updatedAt: new Date(),
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Aggiunto ${foodItem.name} (${args.quantity}${args.unit}) a ${args.mealName}

📊 +${calculatedMacros.calories} kcal | P: +${calculatedMacros.protein}g | C: +${calculatedMacros.carbs}g | F: +${calculatedMacros.fat}g`,
        },
      ],
      food: newFood,
    };
  },
};

export const nutritionRemoveFoodFromMealTool: McpTool = {
  name: 'nutrition_remove_food_from_meal',
  description: 'Removes a food item from a meal',
  parameters: z.object({
    planId: z.string(),
    weekNumber: z.number().int().min(1),
    dayNumber: z.number().int().min(1).max(7),
    mealName: z.string(),
    foodId: z.string(),
  }),
  execute: async (args, _context: McpContext) => {
    const plan = await prisma.nutrition_plans.findUnique({
      where: { id: args.planId },
    });

    if (!plan) {
      throw new Error('Piano non trovato');
    }

    const weeks = parseWeeks(plan.weeks);
    const weekIndex = weeks.findIndex((w) => w.weekNumber === args.weekNumber);

    if (weekIndex === -1) {
      throw new Error(`Settimana ${args.weekNumber} non trovata`);
    }

    const week = weeks[weekIndex]!;
    const dayIndex = week.days.findIndex((d) => d.dayNumber === args.dayNumber);

    if (dayIndex === -1) {
      throw new Error(`Giorno ${args.dayNumber} non trovato`);
    }

    const day = week.days[dayIndex]!;
    const mealIndex = day.meals.findIndex(
      (m) => m.name.toLowerCase() === args.mealName.toLowerCase()
    );

    if (mealIndex === -1) {
      throw new Error(`Pasto "${args.mealName}" non trovato`);
    }

    const meal = day.meals[mealIndex]!;
    const foodIndex = meal.foods.findIndex((f) => f.foodId === args.foodId);

    if (foodIndex === -1) {
      throw new Error('Alimento non trovato nel pasto');
    }

    const removedFood = meal.foods.splice(foodIndex, 1)[0]!;
    weeks[weekIndex]!.days[dayIndex]!.meals[mealIndex] = meal;

    await prisma.nutrition_plans.update({
      where: { id: args.planId },
      data: {
        weeks: serializeWeeks(weeks),
        updatedAt: new Date(),
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `🗑️ Rimosso ${removedFood.name} da ${args.mealName}`,
        },
      ],
    };
  },
};

export const nutritionSwapMealTool: McpTool = {
  name: 'nutrition_swap_meal',
  description: 'Swaps a meal with alternatives matching similar macros',
  parameters: z.object({
    planId: z.string(),
    weekNumber: z.number().int().min(1),
    dayNumber: z.number().int().min(1).max(7),
    mealName: z.string(),
    preferences: z.array(z.string()).optional(),
  }),
  execute: async (args, _context: McpContext) => {
    const plan = await prisma.nutrition_plans.findUnique({
      where: { id: args.planId },
    });

    if (!plan) {
      throw new Error('Piano non trovato');
    }

    const weeks = parseWeeks(plan.weeks);
    const week = weeks.find((w: any) => w.weekNumber === args.weekNumber);

    if (!week) {
      throw new Error(`Settimana ${args.weekNumber} non trovata`);
    }

    const day = week.days.find((d: any) => d.dayNumber === args.dayNumber);

    if (!day) {
      throw new Error(`Giorno ${args.dayNumber} non trovato`);
    }

    const meal = day.meals.find((m: any) => m.name.toLowerCase() === args.mealName.toLowerCase());

    if (!meal) {
      throw new Error(`Pasto "${args.mealName}" non trovato`);
    }

    // Find alternative foods with similar calories
    const targetCalories = meal.targetCalories;
    const calorieRange = targetCalories * 0.2; // 20% tolerance

    const alternatives = await prisma.food_items.findMany({
      where: {
        macrosPer100g: {
          path: ['calories'],
          gte: targetCalories - calorieRange,
          lte: targetCalories + calorieRange,
        },
      },
      take: 10,
    });

    return {
      content: [
        {
          type: 'text',
          text: `🔄 **Alternative per ${meal.name}** (Target: ${targetCalories} kcal)

${
  alternatives
    .map((a: any) => {
      const macros = a.macrosPer100g as { calories: number } | null;
      return `- ${a.name}: ${macros?.calories ?? 0} kcal/100g`;
    })
    .join('\n') || 'Nessuna alternativa trovata'
}

Usa \`nutrition_add_food_to_meal\` per aggiungere un\'alternativa.`,
        },
      ],
      alternatives,
      currentMeal: meal,
    };
  },
};

// ============================================================================
// FOOD SEARCH TOOLS
// ============================================================================

export const nutritionSearchFoodTool: McpTool = {
  name: 'nutrition_search_food',
  description: 'Searches for food items in the database',
  parameters: z.object({
    query: z.string().min(2),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  execute: async (args, _context: McpContext) => {
    const where: Prisma.food_itemsWhereInput = {
      OR: [
        { name: { contains: args.query, mode: 'insensitive' } },
        { nameNormalized: { contains: args.query, mode: 'insensitive' } },
        { brand: { name: { contains: args.query, mode: 'insensitive' } } },
      ],
    };

    const foods = await prisma.food_items.findMany({
      where,
      take: args.limit,
      orderBy: { name: 'asc' },
      include: { brand: true },
    });

    return {
      content: [
        {
          type: 'text',
          text:
            foods.length > 0
              ? `🔍 Trovati ${foods.length} alimenti per "${args.query}":\n\n${foods
                  .map((f: any) => {
                    const macros = f.macrosPer100g as {
                      calories: number;
                      protein: number;
                      carbs: number;
                      fat: number;
                    } | null;
                    return `• **${f.name}**${f.brand ? ` (${f.brand.name})` : ''}\n  ${macros?.calories ?? 0} kcal | P: ${macros?.protein ?? 0}g | C: ${macros?.carbs ?? 0}g | F: ${macros?.fat ?? 0}g`;
                  })
                  .join('\n\n')}`
              : `Nessun alimento trovato per "${args.query}"`,
        },
      ],
      foods,
    };
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export const nutritionDayMealTools = [
  nutritionGetDayTool,
  nutritionUpdateDayTool,
  nutritionCopyDayTool,
  nutritionGetMealTool,
  nutritionAddFoodToMealTool,
  nutritionRemoveFoodFromMealTool,
  nutritionSwapMealTool,
  nutritionSearchFoodTool,
];
