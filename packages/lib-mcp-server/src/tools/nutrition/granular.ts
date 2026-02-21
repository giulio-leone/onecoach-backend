/**
 * MCP Tools: Granular Nutrition Management
 *
 * Advanced MCP tools for granular manipulation of nutrition plans.
 * Provides unified interface for the Modification Agent.
 *
 * @module lib-mcp-server/tools/nutrition/granular
 */

import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { prisma, type Prisma } from '@onecoach/lib-core';
import { fuzzyMatch, successResult } from '@onecoach/lib-copilot-framework';

// =====================================================
// Type Definitions (Mirrors day-meal.ts)
// =====================================================

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

// Helpers
function parseWeeks(weeksJson: Prisma.JsonValue): Week[] {
  if (!weeksJson || !Array.isArray(weeksJson)) {
    return [];
  }
  return weeksJson as Week[];
}

function serializeWeeks(weeks: Week[]): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(weeks)) as Prisma.InputJsonValue;
}

// =====================================================
// Schema Definitions
// =====================================================

const NutritionModificationActionSchema = z.enum([
  'update_meal', 
  'update_food',
  'add_food',
  'remove_food'
]);

const NutritionModificationTargetSchema = z.object({
  weekIndex: z.number().int().min(0).optional().describe('Week index (0-based)'),
  dayIndex: z.number().int().min(0).optional().describe('Day index (0-based)'),
  mealName: z.string().optional().describe('Meal name (e.g., "Colazione", "Pranzo")'),
  foodId: z.string().optional().describe('Food ID (for food operations)'),
  // Fuzzy matching support
  foodName: z.string().optional().describe('Food name for fuzzy matching'),
});

const NutritionModificationChangesSchema = z.object({
  // Meal fields
  name: z.string().optional().describe('New meal name'),
  time: z.string().optional().describe('Meal time (e.g. "12:30")'),
  targetCalories: z.number().positive().optional().describe(
    'Target calories. Example: "2000 kcal" → 2000'
  ),
  targetMacros: z.object({
    protein: z.number().positive().optional(),
    carbs: z.number().positive().optional(),
    fat: z.number().positive().optional(),
  }).optional().describe('Target macros'),
  
  // Food fields
  quantity: z.number().positive().optional().describe(
    'Food quantity. Example: "200g" → 200'
  ),
  unit: z.string().optional().describe('Unit (g, ml, pz)'),
});

const nutritionApplyModificationParams = z.object({
  planId: z.string(),
  action: NutritionModificationActionSchema,
  target: NutritionModificationTargetSchema,
  changes: NutritionModificationChangesSchema.optional(),
  // For add_food
  newFoodId: z.string().optional().describe('ID of food to add'),
  newFoodQuantity: z.number().positive().optional(),
  newFoodUnit: z.string().optional(),
}).refine(
  (data) => {
    // For update actions, changes must be present
    if (data.action.startsWith('update_')) {
      return data.changes && Object.keys(data.changes).length > 0;
    }
    return true;
  },
  { message: 'For update actions, you MUST provide at least one field in "changes"' }
);

type NutritionApplyModificationParams = z.infer<typeof nutritionApplyModificationParams>;

// =====================================================
// Tool Implementation
// =====================================================

export const nutritionApplyModificationTool: McpTool<NutritionApplyModificationParams> = {
  name: 'nutrition_apply_modification',
  description: `Applies granular modifications to a nutrition plan.
  
Supported Actions:
- update_meal: Change time, target calories, macros
- update_food: Change quantity of existing food
- add_food: Add new food to meal
- remove_food: Remove food from meal

Examples:
- "Pranzo a 2000 kcal": action=update_meal, changes={targetCalories: 2000}
- "200g di riso": action=update_food, changes={quantity: 200}`,
  
  parameters: nutritionApplyModificationParams,
  
  execute: async (args, _context: McpContext) => {
    const { planId, action, target, changes } = args;
    
    // 1. Fetch Plan
    const plan = await prisma.nutrition_plans.findUnique({
      where: { id: planId },
    });
    
    if (!plan) throw new Error('Piano non trovato');
    
    const weeks = parseWeeks(plan.weeks);
    
    // 2. Resolve Target Location
    // Default to first week/day if not specified (or should we fail? Better to be safe, but context might imply current)
    // The ModificationAgent usually provides these based on UI context.
    const weekIndex = target.weekIndex ?? 0;
    const dayIndex = target.dayIndex ?? 0;
    
    const week = weeks[weekIndex];
    if (!week) throw new Error(`Settimana ${weekIndex + 1} non trovata`);
    
    const day = week.days[dayIndex];
    if (!day) throw new Error(`Giorno ${dayIndex + 1} non trovato`);
    
    // 3. Resolve Meal
    let mealIndex = -1;
    if (target.mealName) {
      mealIndex = day.meals.findIndex(m => m.name.toLowerCase() === target.mealName?.toLowerCase());
    } else {
      // If no meal specified, maybe we can infer? For now require it for meal/food ops
      // Could fail here if action requires meal
    }
    
    if (mealIndex === -1 && (action !== 'update_meal' || target.mealName)) {
      // If we looked for a meal and didn't find it
      throw new Error(`Pasto "${target.mealName}" non trovato`);
    }

    // 4. Execute Action
    let message = '';
    
    switch (action) {
      case 'update_meal': {
        if (mealIndex === -1) throw new Error('Nome pasto richiesto per update_meal');
        const meal = day.meals[mealIndex]!;
        
        if (changes?.time) meal.time = changes.time;
        if (changes?.targetCalories) meal.targetCalories = changes.targetCalories;
        if (changes?.targetMacros) meal.targetMacros = { ...meal.targetMacros, ...changes.targetMacros };
        if (changes?.name) meal.name = changes.name;
        
        message = `Aggiornato pasto ${meal.name}`;
        break;
      }
      
      case 'update_food': {
        if (mealIndex === -1) throw new Error('Nome pasto richiesto per update_food');
        const meal = day.meals[mealIndex]!;
        
        // Find food
        let foodIndex = -1;
        if (target.foodId) {
          foodIndex = meal.foods.findIndex(f => f.foodId === target.foodId);
        } else if (target.foodName) {
           foodIndex = meal.foods.findIndex(f => fuzzyMatch(f.name, target.foodName!));
        }
        
        if (foodIndex === -1) throw new Error(`Alimento "${target.foodName || target.foodId}" non trovato`);
        
        const food = meal.foods[foodIndex]!;
        
        if (changes?.quantity) {
          const oldQuantity = food.quantity;
          food.quantity = changes.quantity;
          
          // Recalculate macros
          const multiplier = changes.quantity / oldQuantity;
          food.macros.calories = Math.round(food.macros.calories * multiplier);
          food.macros.protein = Math.round(food.macros.protein * multiplier * 10) / 10;
          food.macros.carbs = Math.round(food.macros.carbs * multiplier * 10) / 10;
          food.macros.fat = Math.round(food.macros.fat * multiplier * 10) / 10;
        }
        
        if (changes?.unit) food.unit = changes.unit;
        
        message = `Aggiornato ${food.name}: ${food.quantity}${food.unit}`;
        break;
      }
      
      case 'add_food': {
        if (mealIndex === -1) throw new Error('Nome pasto richiesto per add_food');
        if (!args.newFoodId) throw new Error('newFoodId richiesto per add_food');
        
        const foodItem = await prisma.food_items.findUnique({ where: { id: args.newFoodId }});
        if (!foodItem) throw new Error('Alimento non trovato');
        
        const qty = args.newFoodQuantity ?? 100;
        const unit = args.newFoodUnit ?? 'g';
        
        // Calculate macros
        const macrosBase = foodItem.macrosPer100g as any;
        const multiplier = qty / 100;
        
         const newFood: MealFood = {
          foodId: foodItem.id,
          name: foodItem.name,
          quantity: qty,
          unit: unit,
          macros: {
            calories: Math.round((macrosBase?.calories ?? 0) * multiplier),
            protein: Math.round((macrosBase?.protein ?? 0) * multiplier * 10) / 10,
            carbs: Math.round((macrosBase?.carbs ?? 0) * multiplier * 10) / 10,
            fat: Math.round((macrosBase?.fat ?? 0) * multiplier * 10) / 10,
          }
        };
        
        day.meals[mealIndex]!.foods.push(newFood);
        message = `Aggiunto ${foodItem.name} a ${target.mealName}`;
        break;
      }
      
      case 'remove_food': {
         if (mealIndex === -1) throw new Error('Nome pasto richiesto per remove_food');
        const meal = day.meals[mealIndex]!;
         
         let foodIndex = -1;
        if (target.foodId) {
          foodIndex = meal.foods.findIndex(f => f.foodId === target.foodId);
        } else if (target.foodName) {
           foodIndex = meal.foods.findIndex(f => fuzzyMatch(f.name, target.foodName!));
        }
        
        if (foodIndex === -1) throw new Error(`Alimento non trovato`);
        
        const removed = meal.foods.splice(foodIndex, 1);
        message = `Rimosso ${removed[0]?.name}`;
        break;
      }
    }
    
    // 5. Recalculate Totals (Basic implementation)
    // Ideally we should have a shared helper for this, but for now we trust individual meal macro updates logic inside the blocks above
    // or we can invoke a "recalculateDay" function.
    // Let's do a quick recalc of the day totals to be safe
    let dayCals = 0;
    let dayP = 0, dayC = 0, dayF = 0;
    
    day.meals.forEach(m => {
       m.foods.forEach(f => {
          dayCals += f.macros.calories;
          dayP += f.macros.protein;
          dayC += f.macros.carbs;
          dayF += f.macros.fat;
       });
    });
    
    day.totalCalories = Math.round(dayCals);
    day.totalMacros = {
        calories: Math.round(dayCals),
        protein: Math.round(dayP),
        carbs: Math.round(dayC),
        fat: Math.round(dayF)
    };

    // 6. Save
    await prisma.nutrition_plans.update({
      where: { id: planId },
      data: {
        weeks: serializeWeeks(weeks),
        updatedAt: new Date(),
      }
    });
    
    return successResult(message, day);
  }
};
