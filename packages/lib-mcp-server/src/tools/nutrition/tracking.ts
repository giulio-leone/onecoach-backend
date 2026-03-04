/**
 * MCP Nutrition Tracking Tools
 *
 * Tools for tracking nutrition intake and generating reports.
 * Uses nutrition_day_logs table for actual intake tracking.
 *
 * @module lib-mcp-server/tools/nutrition/tracking
 */

import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { getDbClient } from '@giulio-leone/core';
const prisma = getDbClient() as any;

// ============================================================================
// TRACKING TOOLS
// ============================================================================

export const nutritionLogIntakeTool: McpTool = {
  name: 'nutrition_log_intake',
  description: 'Logs actual food intake for a day',
  parameters: z.object({
    planId: z.string(),
    weekNumber: z.number().int().min(1),
    dayNumber: z.number().int().min(1).max(7),
    date: z.string().describe('Date in ISO format (YYYY-MM-DD)'),
    meals: z.array(
      z.object({
        name: z.string(),
        foods: z.array(
          z.object({
            foodId: z.string(),
            name: z.string(),
            quantity: z.number().positive(),
            unit: z.string().default('g'),
            macros: z.object({
              calories: z.number(),
              protein: z.number(),
              carbs: z.number(),
              fat: z.number(),
            }),
          })
        ),
      })
    ),
    waterIntake: z.number().min(0).optional().describe('Water intake in liters'),
    notes: z.string().optional(),
  }),
  execute: async (args, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    // Calculate total macros
    const totalMacros = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    for (const meal of args.meals) {
      for (const food of meal.foods) {
        totalMacros.calories += food.macros.calories;
        totalMacros.protein += food.macros.protein;
        totalMacros.carbs += food.macros.carbs;
        totalMacros.fat += food.macros.fat;
      }
    }

    const log = await prisma.nutrition_day_logs.upsert({
      where: {
        id: `${args.planId}-${args.weekNumber}-${args.dayNumber}-${args.date}`,
      },
      update: {
        meals: args.meals,
        actualDailyMacros: totalMacros,
        waterIntake: args.waterIntake,
        notes: args.notes,
        updatedAt: new Date(),
      },
      create: {
        id: `${args.planId}-${args.weekNumber}-${args.dayNumber}-${args.date}`,
        planId: args.planId,
        weekNumber: args.weekNumber,
        dayNumber: args.dayNumber,
        date: new Date(args.date),
        meals: args.meals,
        actualDailyMacros: totalMacros,
        waterIntake: args.waterIntake,
        notes: args.notes,
        userId: context.userId,
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Intake registrato per ${new Date(args.date).toLocaleDateString('it-IT')}

📊 **Totale:**
- Calorie: ${totalMacros.calories} kcal
- Proteine: ${totalMacros.protein}g
- Carboidrati: ${totalMacros.carbs}g
- Grassi: ${totalMacros.fat}g
${args.waterIntake ? `💧 Acqua: ${args.waterIntake}L` : ''}`,
        },
      ],
      log,
      totalMacros,
    };
  },
};

export const nutritionGetTrackingTool: McpTool = {
  name: 'nutrition_get_tracking',
  description: 'Gets tracking data for a date range',
  parameters: z.object({
    planId: z.string().optional(),
    userId: z.string().optional(),
    startDate: z.string().describe('Start date (YYYY-MM-DD)'),
    endDate: z.string().describe('End date (YYYY-MM-DD)'),
  }),
  execute: async (args, _context: McpContext) => {
    const where: Record<string, unknown> = {
      date: {
        gte: new Date(args.startDate),
        lte: new Date(args.endDate),
      },
    };

    if (args.planId) {
      where.planId = args.planId;
    }
    if (args.userId) {
      where.userId = args.userId;
    }

    const logs = await prisma.nutrition_day_logs.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    // Calculate averages
    const totalDays = logs.length;
    const avgMacros = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    for (const log of logs) {
      const macros = log.actualDailyMacros as {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      } | null;
      if (macros) {
        avgMacros.calories += macros.calories;
        avgMacros.protein += macros.protein;
        avgMacros.carbs += macros.carbs;
        avgMacros.fat += macros.fat;
      }
    }

    if (totalDays > 0) {
      avgMacros.calories = Math.round(avgMacros.calories / totalDays);
      avgMacros.protein = Math.round(avgMacros.protein / totalDays);
      avgMacros.carbs = Math.round(avgMacros.carbs / totalDays);
      avgMacros.fat = Math.round(avgMacros.fat / totalDays);
    }

    return {
      content: [
        {
          type: 'text',
          text: `📊 **Tracking Report**

📅 Periodo: ${args.startDate} → ${args.endDate}
📝 Giorni tracciati: ${totalDays}

📈 **Media giornaliera:**
- Calorie: ${avgMacros.calories} kcal
- Proteine: ${avgMacros.protein}g
- Carboidrati: ${avgMacros.carbs}g
- Grassi: ${avgMacros.fat}g`,
        },
      ],
      logs,
      summary: { totalDays, avgMacros },
    };
  },
};

export const nutritionGetAdherenceReportTool: McpTool = {
  name: 'nutrition_get_adherence_report',
  description: 'Generates an adherence report comparing actual vs planned intake',
  parameters: z.object({
    planId: z.string(),
    weekNumber: z.number().int().min(1).optional(),
  }),
  execute: async (args, _context: McpContext) => {
    // Get the plan with targets
    const plan = await prisma.nutrition_plans.findUnique({
      where: { id: args.planId },
      select: { targetMacros: true, name: true, durationWeeks: true },
    });

    if (!plan) {
      throw new Error('Piano non trovato');
    }

    const targetMacros = plan.targetMacros as {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };

    // Get logs
    const logsWhere: Record<string, unknown> = { planId: args.planId };
    if (args.weekNumber) {
      logsWhere.weekNumber = args.weekNumber;
    }

    const logs = await prisma.nutrition_day_logs.findMany({
      where: logsWhere,
      orderBy: { date: 'asc' },
    });

    // Calculate adherence
    let totalCaloriesLogged = 0;
    let totalProteinLogged = 0;
    let daysLogged = 0;

    for (const log of logs) {
      const macros = log.actualDailyMacros as { calories: number; protein: number } | null;
      if (macros) {
        totalCaloriesLogged += macros.calories;
        totalProteinLogged += macros.protein;
        daysLogged++;
      }
    }

    const avgCalories = daysLogged > 0 ? Math.round(totalCaloriesLogged / daysLogged) : 0;
    const avgProtein = daysLogged > 0 ? Math.round(totalProteinLogged / daysLogged) : 0;

    const calorieAdherence =
      targetMacros.calories > 0 ? Math.round((avgCalories / targetMacros.calories) * 100) : 0;
    const proteinAdherence =
      targetMacros.protein > 0 ? Math.round((avgProtein / targetMacros.protein) * 100) : 0;

    // Calculate expected days
    const expectedDays = args.weekNumber ? 7 : plan.durationWeeks * 7;
    const completionRate = Math.round((daysLogged / expectedDays) * 100);

    return {
      content: [
        {
          type: 'text',
          text: `📊 **Adherence Report: ${plan.name}**
${args.weekNumber ? `📅 Settimana ${args.weekNumber}` : '📅 Intero piano'}

📝 **Giorni tracciati:** ${daysLogged}/${expectedDays} (${completionRate}%)

📈 **Media vs Target:**
- Calorie: ${avgCalories}/${targetMacros.calories} kcal (${calorieAdherence}%)
- Proteine: ${avgProtein}/${targetMacros.protein}g (${proteinAdherence}%)

${
  calorieAdherence >= 90 && calorieAdherence <= 110
    ? '✅ Ottimo lavoro! In target'
    : calorieAdherence < 90
      ? '⚠️ Sotto il target calorico'
      : '⚠️ Sopra il target calorico'
}`,
        },
      ],
      report: {
        planName: plan.name,
        weekNumber: args.weekNumber,
        daysLogged,
        expectedDays,
        completionRate,
        avgCalories,
        avgProtein,
        calorieAdherence,
        proteinAdherence,
        targetMacros,
      },
    };
  },
};

export const nutritionCalculateMacrosTool: McpTool = {
  name: 'nutrition_calculate_macros',
  description: 'Calculates recommended macros based on profile',
  parameters: z.object({
    weight: z.number().positive().describe('Weight in kg'),
    height: z.number().positive().describe('Height in cm'),
    age: z.number().int().positive(),
    gender: z.enum(['male', 'female']),
    activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
    goal: z.enum(['weight_loss', 'maintenance', 'muscle_gain', 'performance', 'recomp']),
    bodyFatPercentage: z.number().min(1).max(60).optional(),
  }),
  execute: async (args, _context: McpContext) => {
    // Calculate BMR (Mifflin-St Jeor)
    let bmr: number;
    if (args.gender === 'male') {
      bmr = 10 * args.weight + 6.25 * args.height - 5 * args.age + 5;
    } else {
      bmr = 10 * args.weight + 6.25 * args.height - 5 * args.age - 161;
    }

    // If body fat is provided, use Katch-McArdle
    if (args.bodyFatPercentage) {
      const lbm = args.weight * (1 - args.bodyFatPercentage / 100);
      bmr = 370 + 21.6 * lbm;
    }

    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const goalAdjustments: Record<string, number> = {
      weight_loss: -500,
      maintenance: 0,
      muscle_gain: 300,
      performance: 200,
      recomp: -100,
    };

    const activityMult = activityMultipliers[args.activityLevel] ?? 1.55;
    const goalAdj = goalAdjustments[args.goal] ?? 0;
    const tdee = bmr * activityMult;
    const targetCalories = Math.round(tdee + goalAdj);

    // Macro distribution
    let proteinPerKg = 2.0;
    let fatPercent = 0.25;

    if (args.goal === 'muscle_gain') {
      proteinPerKg = 2.2;
    } else if (args.goal === 'weight_loss') {
      proteinPerKg = 2.4;
      fatPercent = 0.3;
    }

    const protein = Math.round(args.weight * proteinPerKg);
    const fat = Math.round((targetCalories * fatPercent) / 9);
    const carbs = Math.round((targetCalories - protein * 4 - fat * 9) / 4);

    return {
      content: [
        {
          type: 'text',
          text: `🧮 **Calcolo Macro**

📊 **Risultati:**
- BMR: ${Math.round(bmr)} kcal
- TDEE: ${Math.round(tdee)} kcal
- Target: ${targetCalories} kcal (${args.goal})

🎯 **Macro consigliati:**
- Proteine: ${protein}g (${Math.round(((protein * 4) / targetCalories) * 100)}%)
- Carboidrati: ${carbs}g (${Math.round(((carbs * 4) / targetCalories) * 100)}%)
- Grassi: ${fat}g (${Math.round(((fat * 9) / targetCalories) * 100)}%)`,
        },
      ],
      calculations: {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        targetCalories,
        macros: { protein, carbs, fat },
        goal: args.goal,
      },
    };
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export const nutritionTrackingTools = [
  nutritionLogIntakeTool,
  nutritionGetTrackingTool,
  nutritionGetAdherenceReportTool,
  nutritionCalculateMacrosTool,
];
