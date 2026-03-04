import type { Prisma } from '@prisma/client';
/**
 * MCP Nutrition Plan Tools
 *
 * Tools for generating and managing complete nutrition plans.
 *
 * @module lib-mcp-server/tools/nutrition/plan
 */

import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { getDbClient } from '@giulio-leone/core';
const prisma = getDbClient() as any;
import { isValidUUID, createMcpTextResponse, safeHandleMemoryEvent } from '../../utils/helpers';

// ============================================================================
// PLAN GENERATION TOOL
// ============================================================================

const nutritionGeneratePlanSchema = z.object({
  athleteId: z.string(),
  name: z.string().min(3).max(100),
  durationWeeks: z.number().int().min(1).max(52).default(4),
  profile: z.object({
    weight: z.number().positive(),
    height: z.number().positive(),
    age: z.number().int().positive(),
    gender: z.enum(['male', 'female', 'other']),
    activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
    goal: z.enum(['weight_loss', 'maintenance', 'muscle_gain', 'performance', 'recomp']),
    bodyFatPercentage: z.number().min(1).max(60).optional(),
  }),
  preferences: z.array(z.string()).optional(),
  restrictions: z.array(z.string()).optional(),
  mealsPerDay: z
    .number()
    .int()
    .min(2)
    .max(8)
    .optional()
    .describe('Numero pasti al giorno. Se non specificato, AI determinerà ottimale'),
  targetMacros: z
    .object({
      calories: z.number().positive().optional(),
      protein: z.number().positive().optional(),
      carbs: z.number().positive().optional(),
      fats: z.number().positive().optional(),
    })
    .optional()
    .describe(
      'Macro target opzionali. Se non specificati, AI calcolerà basandosi su profilo e obiettivo'
    ),
  mealDistribution: z
    .array(
      z.object({
        mealName: z.string(),
        time: z.string().optional(),
        caloriePercentage: z.number().min(0).max(1).optional(),
      })
    )
    .optional()
    .describe(
      'Distribuzione pasti opzionale. Se non specificata, AI determinerà distribuzione ottimale'
    ),
});

type NutritionGeneratePlanArgs = z.infer<typeof nutritionGeneratePlanSchema>;

export const nutritionGeneratePlanTool: McpTool<NutritionGeneratePlanArgs> = {
  name: 'nutrition_generate_plan',
  description: 'Generates a complete nutrition plan based on athlete profile and goals',
  parameters: nutritionGeneratePlanSchema,
  execute: async (args: NutritionGeneratePlanArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const {
      profile,
      athleteId,
      name,
      durationWeeks,
      preferences,
      restrictions,
      mealsPerDay,
      targetMacros: providedMacros,
      mealDistribution: providedMealDistribution,
    } = args;

    // Usa context.userId come fallback per athleteId (evita placeholder come "athlete_12345")
    const effectiveAthleteId = athleteId && isValidUUID(athleteId) ? athleteId : context.userId;

    // Use provided macros or let AI calculate
    const targetMacros = providedMacros
      ? {
          calories: providedMacros.calories ?? 0,
          protein: providedMacros.protein ?? 0,
          carbs: providedMacros.carbs ?? 0,
          fat: providedMacros.fats ?? 0,
        }
      : {
          calories: 0, // AI will calculate
          protein: 0,
          carbs: 0,
          fat: 0,
        };

    // Use provided meal distribution or create flexible structure for AI
    const mealsPerDayCount = mealsPerDay ?? 4;
    const mealNames =
      providedMealDistribution?.map((m: any) => m.mealName) ??
      Array.from({ length: mealsPerDayCount }, (_, i) => `Pasto ${i + 1}`);
    const mealCalorieDistribution =
      providedMealDistribution?.map((m: any) => m.caloriePercentage ?? 1 / mealsPerDayCount) ??
      Array(mealsPerDayCount).fill(1 / mealsPerDayCount);

    // Generate weeks structure (stored as JSON)
    // AI will populate meals with actual foods and determine optimal timing
    const weeks: Prisma.InputJsonValue[] = [];
    const dayNames = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

    for (let w = 0; w < durationWeeks; w++) {
      const days: Prisma.InputJsonValue[] = [];
      for (let d = 0; d < 7; d++) {
        // Create meal structure - AI will populate with foods and determine timing
        const meals = mealNames.map((mealName, i) => {
          const mealTime = providedMealDistribution?.[i]?.time;
          const mealCalPct = mealCalorieDistribution[i] ?? 1 / mealsPerDayCount;

          return {
            name: mealName,
            time: mealTime ?? null, // AI will determine optimal timing if not provided
            targetCalories: providedMacros?.calories
              ? Math.round(targetMacros.calories * mealCalPct)
              : null, // AI will calculate
            targetMacros: providedMacros
              ? {
                  protein: Math.round(targetMacros.protein * mealCalPct),
                  carbs: Math.round(targetMacros.carbs * mealCalPct),
                  fat: Math.round(targetMacros.fat * mealCalPct),
                }
              : null, // AI will calculate
            foods: [] as Prisma.InputJsonValue[], // AI will populate
          };
        });

        days.push({
          dayNumber: d + 1,
          dayName: dayNames[d] ?? `Giorno ${d + 1}`,
          meals,
          totalCalories: providedMacros?.calories ?? null, // AI will calculate
          totalMacros: providedMacros ?? null, // AI will calculate
        });
      }
      weeks.push({
        weekNumber: w + 1,
        days,
        notes: '', // AI can add notes about weekly variations
      });
    }

    // Create plan in database
    const plan = await prisma.nutrition_plans.create({
      data: {
        id: crypto.randomUUID(),
        name,
        description: `Piano nutrizionale ${profile.goal} per ${durationWeeks} settimane`,
        durationWeeks,
        targetMacros,
        restrictions: restrictions ?? [],
        preferences: preferences ?? [],
        status: 'ACTIVE',
        goals: [profile.goal],
        weeks,
        userProfile: profile,
        userId: effectiveAthleteId,
        updatedAt: new Date(),
      },
    });

    // Update user memory
    await safeHandleMemoryEvent({
      type: 'PLAN_CREATED',
      userId: effectiveAthleteId,
      data: {
        planId: plan.id,
        planName: plan.name,
        goal: profile.goal,
        durationWeeks,
        mealsPerDay: mealsPerDayCount,
      },
    });

    return createMcpTextResponse(
      `✅ Struttura piano nutrizionale "${name}" creata!

📊 **Target giornaliero:**
${
  providedMacros
    ? `- Calorie: ${targetMacros.calories} kcal
- Proteine: ${targetMacros.protein}g
- Carboidrati: ${targetMacros.carbs}g
- Grassi: ${targetMacros.fat}g`
    : "- Macro target: da calcolare dall'AI basandosi su profilo e obiettivo"
}

📅 Durata: ${durationWeeks} settimane
🍽️ ${mealsPerDayCount} pasti al giorno

💡 **Nota:** La struttura base è stata creata. L'AI determinerà autonomamente:
${!providedMacros ? '- Calcolo BMR/TDEE e macro target ottimali\n' : ''}${!providedMealDistribution ? '- Distribuzione calorie tra i pasti\n' : ''}- Selezione alimenti basata su preferenze e restrizioni
- Variazione settimanale per sostenibilità
- Timing pasti ottimale`,
      {
        plan,
        calculations: providedMacros ? { targetMacros } : { note: "Macros da calcolare dall'AI" },
      }
    );
  },
};

// ============================================================================
// PLAN CRUD TOOLS
// ============================================================================

const nutritionGetPlanSchema = z.object({
  planId: z.string(),
});

type NutritionGetPlanArgs = z.infer<typeof nutritionGetPlanSchema>;

export const nutritionGetPlanTool: McpTool<NutritionGetPlanArgs> = {
  name: 'nutrition_get_plan',
  description: 'Gets a nutrition plan by ID with full details',
  parameters: nutritionGetPlanSchema,
  execute: async (args: NutritionGetPlanArgs, _context: McpContext) => {
    const plan = await prisma.nutrition_plans.findUnique({
      where: { id: args.planId },
      include: {
        users: { select: { id: true, name: true, email: true } },
      },
    });

    if (!plan) {
      throw new Error('Piano nutrizionale non trovato');
    }

    const targetMacros = plan.targetMacros as {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };

    return createMcpTextResponse(
      `📋 **${plan.name}**

📊 **Target:** ${targetMacros.calories} kcal | P: ${targetMacros.protein}g | C: ${targetMacros.carbs}g | F: ${targetMacros.fat}g
📅 **Durata:** ${plan.durationWeeks} settimane
📌 **Status:** ${plan.status}
👤 **Atleta:** ${plan.users?.name ?? 'Non assegnato'}`,
      { plan }
    );
  },
};

const nutritionListPlansSchema = z.object({
  athleteId: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED', 'ALL']).default('ALL'),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
});

type NutritionListPlansArgs = z.infer<typeof nutritionListPlansSchema>;

export const nutritionListPlansTool: McpTool<NutritionListPlansArgs> = {
  name: 'nutrition_list_plans',
  description: 'Lists nutrition plans for an athlete',
  parameters: nutritionListPlansSchema,
  execute: async (args: NutritionListPlansArgs, _context: McpContext) => {
    const where: Prisma.nutrition_plansWhereInput = {};

    if (args.athleteId) {
      where.userId = args.athleteId;
    }
    if (args.status !== 'ALL') {
      where.status = args.status;
    }

    const plans = await prisma.nutrition_plans.findMany({
      where,
      take: args.limit,
      skip: args.offset,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        durationWeeks: true,
        targetMacros: true,
        createdAt: true,
        users: { select: { name: true } },
      },
    });

    return createMcpTextResponse(
      plans.length > 0
        ? `Trovati ${plans.length} piani:\n${plans.map((p: any) => `- ${p.name} (${p.status}) - ${p.durationWeeks} settimane`).join('\n')}`
        : 'Nessun piano trovato',
      { plans }
    );
  },
};

const nutritionUpdatePlanSchema = z.object({
  planId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  targetMacros: z
    .object({
      calories: z.number().positive(),
      protein: z.number().positive(),
      carbs: z.number().positive(),
      fat: z.number().positive(),
    })
    .optional(),
});

type NutritionUpdatePlanArgs = z.infer<typeof nutritionUpdatePlanSchema>;

export const nutritionUpdatePlanTool: McpTool<NutritionUpdatePlanArgs> = {
  name: 'nutrition_update_plan',
  description: 'Updates a nutrition plan',
  parameters: nutritionUpdatePlanSchema,
  execute: async (args: NutritionUpdatePlanArgs, _context: McpContext) => {
    const { planId, ...updates } = args;

    const plan = await prisma.nutrition_plans.update({
      where: { id: planId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return createMcpTextResponse(`✅ Piano "${plan.name}" aggiornato`, { plan });
  },
};

const nutritionDeletePlanSchema = z.object({
  planId: z.string(),
  hardDelete: z.boolean().default(false),
});

type NutritionDeletePlanArgs = z.infer<typeof nutritionDeletePlanSchema>;

export const nutritionDeletePlanTool: McpTool<NutritionDeletePlanArgs> = {
  name: 'nutrition_delete_plan',
  description: 'Deletes a nutrition plan (soft delete by archiving)',
  parameters: nutritionDeletePlanSchema,
  execute: async (args: NutritionDeletePlanArgs, _context: McpContext) => {
    if (args.hardDelete) {
      await prisma.nutrition_plans.delete({
        where: { id: args.planId },
      });
      return createMcpTextResponse('🗑️ Piano eliminato definitivamente');
    }

    await prisma.nutrition_plans.update({
      where: { id: args.planId },
      data: { status: 'ARCHIVED', updatedAt: new Date() },
    });

    return createMcpTextResponse('📦 Piano archiviato');
  },
};

const nutritionDuplicatePlanSchema = z.object({
  planId: z.string(),
  newName: z.string().optional(),
  targetAthleteId: z.string().optional(),
});

type NutritionDuplicatePlanArgs = z.infer<typeof nutritionDuplicatePlanSchema>;

export const nutritionDuplicatePlanTool: McpTool<NutritionDuplicatePlanArgs> = {
  name: 'nutrition_duplicate_plan',
  description: 'Duplicates an existing nutrition plan',
  parameters: nutritionDuplicatePlanSchema,
  execute: async (args: NutritionDuplicatePlanArgs, _context: McpContext) => {
    const originalPlan = await prisma.nutrition_plans.findUnique({
      where: { id: args.planId },
    });

    if (!originalPlan) {
      throw new Error('Piano originale non trovato');
    }

    const newPlan = await prisma.nutrition_plans.create({
      data: {
        id: crypto.randomUUID(),
        name: args.newName ?? `${originalPlan.name} (Copia)`,
        description: originalPlan.description,
        durationWeeks: originalPlan.durationWeeks,
        targetMacros: originalPlan.targetMacros ?? {},
        restrictions: originalPlan.restrictions,
        preferences: originalPlan.preferences,
        status: 'ACTIVE',
        goals: originalPlan.goals,
        weeks: originalPlan.weeks ?? [],
        userProfile: originalPlan.userProfile ?? {},
        userId: args.targetAthleteId ?? originalPlan.userId,
        updatedAt: new Date(),
      },
    });

    return createMcpTextResponse(`✅ Piano duplicato: "${newPlan.name}"`, { newPlan });
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export const nutritionPlanTools = [
  nutritionGeneratePlanTool,
  nutritionGetPlanTool,
  nutritionListPlansTool,
  nutritionUpdatePlanTool,
  nutritionDeletePlanTool,
  nutritionDuplicatePlanTool,
];
