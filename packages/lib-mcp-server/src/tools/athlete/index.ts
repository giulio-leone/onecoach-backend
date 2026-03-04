import type { Prisma } from '@prisma/client';
/**
 * MCP Athlete & Coach Tools
 *
 * Tools for managing athletes and coach-athlete relationships.
 * Uses actual Prisma schema field names.
 *
 * @module lib-mcp-server/tools/athlete
 */

import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { getDbClient } from '@giulio-leone/core';
const prisma = getDbClient() as any;
import { arrayToToolRecord } from '../../utils/helpers';

// ============================================================================
// ATHLETE LIST & PROFILE TOOLS
// ============================================================================

const athleteListParams = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED', 'ALL']).default('ACTIVE'),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});
type AthleteListParams = z.infer<typeof athleteListParams>;

export const athleteListTool: McpTool<AthleteListParams> = {
  name: 'athlete_list',
  description: 'Lists all athletes for the current coach',
  parameters: athleteListParams,
  execute: async (rawArgs, _context: McpContext) => {
    const args = athleteListParams.parse(rawArgs);
    const where: Prisma.usersWhereInput = {
      role: 'USER',
    };

    if (args.status !== 'ALL') {
      where.status = args.status;
    }

    const athletes = await prisma.users.findMany({
      where,
      take: args.limit,
      skip: args.offset,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        user_profiles: {
          select: {
            weightKg: true,
            heightCm: true,
            workoutGoals: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      content: [
        {
          type: 'text',
          text:
            athletes.length > 0
              ? `Trovati ${athletes.length} atleti:\n${athletes
                  .map((a: any) =>
                      `- ${a.name ?? 'N/A'} (${a.email}) - ${a.status === 'ACTIVE' ? '🟢' : '🔴'} ${a.status}`
                  )
                  .join('\n')}`
              : 'Nessun atleta trovato',
        },
      ],
      athletes,
    };
  },
};

const athleteGetProfileParams = z.object({
  athleteId: z.string(),
});
type AthleteGetProfileParams = z.infer<typeof athleteGetProfileParams>;

export const athleteGetProfileTool: McpTool<AthleteGetProfileParams> = {
  name: 'athlete_get_profile',
  description: 'Gets detailed profile of an athlete',
  parameters: athleteGetProfileParams,
  execute: async (rawArgs, _context: McpContext) => {
    const args = athleteGetProfileParams.parse(rawArgs);
    const athlete = await prisma.users.findUnique({
      where: { id: args.athleteId },
      include: {
        user_profiles: true,
        nutrition_plans: {
          take: 3,
          orderBy: { updatedAt: 'desc' },
          select: { id: true, name: true, status: true },
        },
        workout_programs: {
          take: 3,
          orderBy: { updatedAt: 'desc' },
          select: { id: true, name: true, status: true },
        },
      },
    });

    if (!athlete) {
      throw new Error('Atleta non trovato');
    }

    const profile = athlete.user_profiles;

    return {
      content: [
        {
          type: 'text',
          text: `👤 **${athlete.name ?? 'N/A'}**
📧 ${athlete.email}
📊 Status: ${athlete.status === 'ACTIVE' ? '🟢 Attivo' : '🔴'} ${athlete.status}

📏 **Profilo:**
- Peso: ${profile?.weightKg ?? 'N/A'} kg
- Altezza: ${profile?.heightCm ?? 'N/A'} cm
- Obiettivi: ${profile?.workoutGoals?.join(', ') ?? 'N/A'}

📋 **Piani attivi:**
- Nutrizione: ${athlete.nutrition_plans.length} piani
- Allenamento: ${athlete.workout_programs.length} programmi`,
        },
      ],
      athlete,
    };
  },
};

const athleteUpdateProfileParams = z.object({
  athleteId: z.string(),
  name: z.string().optional(),
  weightKg: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  workoutGoals: z.array(z.string()).optional(),
  nutritionGoals: z.array(z.string()).optional(),
  activityLevel: z.enum(['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE']).optional(),
});
type AthleteUpdateProfileParams = z.infer<typeof athleteUpdateProfileParams>;

export const athleteUpdateProfileTool: McpTool<AthleteUpdateProfileParams> = {
  name: 'athlete_update_profile',
  description: 'Updates an athlete profile',
  parameters: athleteUpdateProfileParams,
  execute: async (rawArgs, _context: McpContext) => {
    const args = athleteUpdateProfileParams.parse(rawArgs);
    const { athleteId, name, weightKg, heightCm, workoutGoals, nutritionGoals, activityLevel } =
      args;

    // Update user if name provided
    if (name) {
      await prisma.users.update({
        where: { id: athleteId },
        data: { name },
      });
    }

    // Update profile if profile fields provided
    if (weightKg || heightCm || workoutGoals || nutritionGoals || activityLevel) {
      await prisma.user_profiles.upsert({
        where: { userId: athleteId },
        update: {
          ...(weightKg && { weightKg }),
          ...(heightCm && { heightCm }),
          ...(workoutGoals && { workoutGoals }),
          ...(nutritionGoals && { nutritionGoals }),
          ...(activityLevel && { activityLevel }),
          updatedAt: new Date(),
        },
        create: {
          id: crypto.randomUUID(),
          userId: athleteId,
          weightKg: weightKg ?? null,
          heightCm: heightCm ?? null,
          workoutGoals: workoutGoals ?? [],
          nutritionGoals: nutritionGoals ?? [],
          activityLevel: activityLevel ?? 'MODERATE',
        },
      });
    }

    return {
      content: [{ type: 'text', text: '✅ Profilo atleta aggiornato' }],
    };
  },
};

// ============================================================================
// ONE REP MAX TOOLS
// ============================================================================

const athleteGetMaxesParams = z.object({
  athleteId: z.string(),
  exerciseId: z.string().optional(),
});
type AthleteGetMaxesParams = z.infer<typeof athleteGetMaxesParams>;

export const athleteGetMaxesTool: McpTool<AthleteGetMaxesParams> = {
  name: 'athlete_get_maxes',
  description: 'Gets one rep max records for an athlete',
  parameters: athleteGetMaxesParams,
  execute: async (rawArgs, _context: McpContext) => {
    const args = athleteGetMaxesParams.parse(rawArgs);
    const where: Prisma.user_one_rep_maxWhereInput = {
      userId: args.athleteId,
    };

    if (args.exerciseId) {
      where.exerciseId = args.exerciseId;
    }

    const maxes = await prisma.user_one_rep_max.findMany({
      where,
      include: {
        exercises: { select: { id: true } },
      },
      orderBy: { lastUpdated: 'desc' },
    });

    return {
      content: [
        {
          type: 'text',
          text:
            maxes.length > 0
              ? `💪 **Massimali:**\n${maxes
                  .map((m: any) => `- Exercise ${m.exerciseId}: ${m.oneRepMax}kg 1RM`)
                  .join('\n')}`
              : 'Nessun massimale registrato',
        },
      ],
      maxes,
    };
  },
};

const athleteSetMaxParams = z.object({
  athleteId: z.string(),
  exerciseId: z.string(),
  oneRepMax: z.number().positive(),
  notes: z.string().optional(),
});
type AthleteSetMaxParams = z.infer<typeof athleteSetMaxParams>;

export const athleteSetMaxTool: McpTool<AthleteSetMaxParams> = {
  name: 'athlete_set_max',
  description: 'Sets or updates a one rep max for an athlete',
  parameters: athleteSetMaxParams,
  execute: async (rawArgs, _context: McpContext) => {
    const args = athleteSetMaxParams.parse(rawArgs);
    // Check if exists
    const existing = await prisma.user_one_rep_max.findFirst({
      where: {
        userId: args.athleteId,
        exerciseId: args.exerciseId,
      },
    });

    let max;
    if (existing) {
      max = await prisma.user_one_rep_max.update({
        where: { id: existing.id },
        data: {
          oneRepMax: args.oneRepMax,
          notes: args.notes,
          lastUpdated: new Date(),
          version: { increment: 1 },
        },
      });
    } else {
      max = await prisma.user_one_rep_max.create({
        data: {
          id: crypto.randomUUID(),
          userId: args.athleteId,
          exerciseId: args.exerciseId,
          oneRepMax: args.oneRepMax,
          notes: args.notes,
        },
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ Massimale aggiornato: **${args.oneRepMax}kg** 1RM`,
        },
      ],
      max,
    };
  },
};

// ============================================================================
// PROGRESS TOOLS
// ============================================================================

const athleteGetProgressParams = z.object({
  athleteId: z.string(),
  type: z.enum(['weight', 'strength', 'workouts', 'all']).default('all'),
  days: z.number().int().min(7).max(365).default(30),
});
type AthleteGetProgressParams = z.infer<typeof athleteGetProgressParams>;

export const athleteGetProgressTool: McpTool<AthleteGetProgressParams> = {
  name: 'athlete_get_progress',
  description: 'Gets progress data for an athlete',
  parameters: athleteGetProgressParams,
  execute: async (rawArgs, _context: McpContext) => {
    const args = athleteGetProgressParams.parse(rawArgs);
    const since = new Date();
    since.setDate(since.getDate() - args.days);

    const results: Record<string, unknown> = {};

    // Weight progress from body_measurements
    if (args.type === 'weight' || args.type === 'all') {
      results.weight = await prisma.body_measurements.findMany({
        where: {
          userId: args.athleteId,
          date: { gte: since },
          weight: { not: null },
        },
        select: { date: true, weight: true },
        orderBy: { date: 'asc' },
      });
    }

    // Strength progress from user_one_rep_max
    if (args.type === 'strength' || args.type === 'all') {
      results.strength = await prisma.user_one_rep_max.findMany({
        where: {
          userId: args.athleteId,
          lastUpdated: { gte: since },
        },
        include: { exercises: { select: { id: true } } },
        orderBy: { lastUpdated: 'asc' },
      });
    }

    // Workout sessions
    if (args.type === 'workouts' || args.type === 'all') {
      results.workouts = await prisma.workout_sessions.findMany({
        where: {
          userId: args.athleteId,
          startedAt: { gte: since },
        },
        select: {
          id: true,
          startedAt: true,
          completedAt: true,
        },
        orderBy: { startedAt: 'asc' },
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: `📈 **Progressi ultimi ${args.days} giorni**

${args.type === 'weight' || args.type === 'all' ? `⚖️ Misurazioni peso: ${(results.weight as unknown[])?.length ?? 0}` : ''}
${args.type === 'strength' || args.type === 'all' ? `💪 Aggiornamenti 1RM: ${(results.strength as unknown[])?.length ?? 0}` : ''}
${args.type === 'workouts' || args.type === 'all' ? `🏋️ Sessioni workout: ${(results.workouts as unknown[])?.length ?? 0}` : ''}`,
        },
      ],
      progress: results,
    };
  },
};

// ============================================================================
// PLAN ASSIGNMENT TOOLS
// ============================================================================

const athleteAssignPlanParams = z.object({
  athleteId: z.string(),
  planType: z.enum(['nutrition', 'workout']),
  planId: z.string(),
});
type AthleteAssignPlanParams = z.infer<typeof athleteAssignPlanParams>;

export const athleteAssignPlanTool: McpTool<AthleteAssignPlanParams> = {
  name: 'athlete_assign_plan',
  description: 'Assigns a nutrition or workout plan to an athlete',
  parameters: athleteAssignPlanParams,
  execute: async (rawArgs, _context: McpContext) => {
    const args = athleteAssignPlanParams.parse(rawArgs);
    if (args.planType === 'nutrition') {
      await prisma.nutrition_plans.update({
        where: { id: args.planId },
        data: {
          userId: args.athleteId,
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.workout_programs.update({
        where: { id: args.planId },
        data: {
          userId: args.athleteId,
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ Piano ${args.planType} assegnato all'atleta`,
        },
      ],
    };
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export const athleteTools = [
  athleteListTool,
  athleteGetProfileTool,
  athleteUpdateProfileTool,
  athleteGetMaxesTool,
  athleteSetMaxTool,
  athleteGetProgressTool,
  athleteAssignPlanTool,
] satisfies McpTool[];

export const athleteToolsRecord = arrayToToolRecord(athleteTools);
