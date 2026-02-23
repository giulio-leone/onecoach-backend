/**
 * MCP Analytics Tools
 *
 * Tools for platform analytics, metrics, and reporting.
 * Uses actual Prisma schema table names with correct field names.
 *
 * Schema facts:
 * - workout_sessions: uses startedAt/completedAt (no date, no status, no totalVolume)
 * - users: uses status enum (ACTIVE, SUSPENDED, DELETED), not isActive boolean
 * - user_one_rep_max: uses oneRepMax, lastUpdated (no estimatedOneRepMax)
 *
 * @module lib-mcp-server/tools/analytics
 */

import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { prisma } from '@giulio-leone/lib-core';

// ============================================================================
// ATHLETE ANALYTICS
// ============================================================================

const analyticsAthleteOverviewParams = z.object({
  athleteId: z.string(),
  days: z.number().int().min(7).max(365).default(30),
});
type AnalyticsAthleteOverviewParams = z.infer<typeof analyticsAthleteOverviewParams>;

export const analyticsAthleteOverviewTool: McpTool<AnalyticsAthleteOverviewParams> = {
  name: 'analytics_athlete_overview',
  description: 'Gets comprehensive analytics overview for an athlete',
  parameters: analyticsAthleteOverviewParams,
  execute: async (rawArgs, _context: McpContext) => {
    const args = analyticsAthleteOverviewParams.parse(rawArgs);
    const since = new Date();
    since.setDate(since.getDate() - args.days);

    const [athlete, workoutSessions, nutritionLogs, bodyMeasurements] = await Promise.all([
      prisma.users.findUnique({
        where: { id: args.athleteId },
        select: { name: true, email: true, createdAt: true },
      }),
      prisma.workout_sessions.findMany({
        where: {
          userId: args.athleteId,
          startedAt: { gte: since },
        },
        select: {
          id: true,
          startedAt: true,
          completedAt: true,
          exercises: true,
        },
      }),
      prisma.nutrition_day_logs.findMany({
        where: {
          userId: args.athleteId,
          date: { gte: since },
        },
        select: {
          date: true,
          actualDailyMacros: true,
        },
      }),
      prisma.body_measurements.findMany({
        where: {
          userId: args.athleteId,
          date: { gte: since },
        },
        orderBy: { date: 'desc' },
        take: 10,
      }),
    ]);

    if (!athlete) {
      throw new Error('Atleta non trovato');
    }

    // Sessions with completedAt are considered completed
    const completedWorkouts = workoutSessions.filter((s) => s.completedAt !== null).length;
    const workoutCompletionRate =
      workoutSessions.length > 0
        ? Math.round((completedWorkouts / workoutSessions.length) * 100)
        : 0;

    return {
      content: [
        {
          type: 'text',
          text: `📊 **Analytics: ${athlete.name}** (${args.days} giorni)

🏋️ **Allenamenti:**
- Sessioni totali: ${workoutSessions.length}
- Completati: ${completedWorkouts} (${workoutCompletionRate}%)

🥗 **Nutrizione:**
- Giorni tracciati: ${nutritionLogs.length}
- Aderenza: ${nutritionLogs.length > 0 ? Math.round((nutritionLogs.length / args.days) * 100) : 0}%

⚖️ **Misurazioni:** ${bodyMeasurements.length} registrate`,
        },
      ],
      analytics: {
        athlete,
        workouts: {
          total: workoutSessions.length,
          completed: completedWorkouts,
          completionRate: workoutCompletionRate,
        },
        nutrition: {
          daysTracked: nutritionLogs.length,
          adherenceRate:
            nutritionLogs.length > 0 ? Math.round((nutritionLogs.length / args.days) * 100) : 0,
        },
        measurements: bodyMeasurements,
      },
    };
  },
};

const analyticsWorkoutProgressParams = z.object({
  athleteId: z.string(),
  exerciseId: z.string().optional(),
  days: z.number().int().min(14).max(365).default(90),
});
type AnalyticsWorkoutProgressParams = z.infer<typeof analyticsWorkoutProgressParams>;

export const analyticsWorkoutProgressTool: McpTool<AnalyticsWorkoutProgressParams> = {
  name: 'analytics_workout_progress',
  description: 'Analyzes workout progress and trends',
  parameters: analyticsWorkoutProgressParams,
  execute: async (rawArgs, _context: McpContext) => {
    const args = analyticsWorkoutProgressParams.parse(rawArgs);
    const since = new Date();
    since.setDate(since.getDate() - args.days);

    const sessions = await prisma.workout_sessions.findMany({
      where: {
        userId: args.athleteId,
        startedAt: { gte: since },
        completedAt: { not: null },
      },
      orderBy: { startedAt: 'asc' },
      select: {
        id: true,
        startedAt: true,
        completedAt: true,
      },
    });

    // Get exercise performance records if exerciseId provided
    let exerciseProgress: Array<{
      id: string;
      weight: { toNumber: () => number };
      volume: { toNumber: () => number };
      createdAt: Date;
    }> = [];
    if (args.exerciseId) {
      exerciseProgress = await prisma.exercise_performance_records.findMany({
        where: {
          userId: args.athleteId,
          exerciseId: args.exerciseId,
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    // Calculate volume trend from exercise_performance_records
    const firstHalf = exerciseProgress.slice(0, Math.floor(exerciseProgress.length / 2));
    const secondHalf = exerciseProgress.slice(Math.floor(exerciseProgress.length / 2));

    const avgVolumeFirst =
      firstHalf.length > 0
        ? firstHalf.reduce((s: number, rec) => s + (rec.volume?.toNumber() ?? 0), 0) /
          firstHalf.length
        : 0;
    const avgVolumeSecond =
      secondHalf.length > 0
        ? secondHalf.reduce((s: number, rec) => s + (rec.volume?.toNumber() ?? 0), 0) /
          secondHalf.length
        : 0;

    const volumeTrend =
      avgVolumeFirst > 0
        ? Math.round(((avgVolumeSecond - avgVolumeFirst) / avgVolumeFirst) * 100)
        : 0;

    return {
      content: [
        {
          type: 'text',
          text: `📈 **Analisi Progressi Workout** (${args.days} giorni)

🏋️ **Sessioni completate:** ${sessions.length}
📊 **Trend volume:** ${volumeTrend > 0 ? '+' : ''}${volumeTrend}%
${args.exerciseId ? `\n🎯 **Esercizio specifico:** ${exerciseProgress.length} record` : ''}

💡 ${volumeTrend > 10 ? 'Ottimo progresso! Continua così.' : volumeTrend < -10 ? 'Volume in calo. Considera una revisione del programma.' : 'Progressione stabile.'}`,
        },
      ],
      sessions,
      exerciseProgress,
      trends: {
        volumeTrend,
        sessionsCount: sessions.length,
      },
    };
  },
};

// ============================================================================
// COACH ANALYTICS
// ============================================================================

const analyticsCoachDashboardParams = z.object({
  coachId: z.string().optional(),
});
type AnalyticsCoachDashboardParams = z.infer<typeof analyticsCoachDashboardParams>;

export const analyticsCoachDashboardTool: McpTool<AnalyticsCoachDashboardParams> = {
  name: 'analytics_coach_dashboard',
  description: 'Gets dashboard analytics for a coach',
  parameters: analyticsCoachDashboardParams,
  execute: async (rawArgs, context: McpContext) => {
    const args = analyticsCoachDashboardParams.parse(rawArgs);
    const coachId = args.coachId ?? context.userId;

    if (!coachId) {
      throw new Error('Coach ID required');
    }

    // Users with role USER are athletes (no ATHLETE role exists)
    const [totalAthletes, activeAthletes, nutritionPlans, workoutPrograms] = await Promise.all([
      prisma.users.count({
        where: { role: 'USER' },
      }),
      prisma.users.count({
        where: {
          role: 'USER',
          status: 'ACTIVE',
        },
      }),
      prisma.nutrition_plans.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.workout_programs.count({
        where: { status: 'ACTIVE' },
      }),
    ]);

    return {
      content: [
        {
          type: 'text',
          text: `📊 **Dashboard Coach**

👥 **Atleti:**
- Totali: ${totalAthletes}
- Attivi: ${activeAthletes}
- Tasso attività: ${totalAthletes > 0 ? Math.round((activeAthletes / totalAthletes) * 100) : 0}%

📋 **Piani attivi:**
- Nutrizione: ${nutritionPlans}
- Allenamento: ${workoutPrograms}`,
        },
      ],
      dashboard: {
        athletes: { total: totalAthletes, active: activeAthletes },
        plans: { nutrition: nutritionPlans, workout: workoutPrograms },
      },
    };
  },
};

const analyticsAthleteComparisonParams = z.object({
  athleteIds: z.array(z.string()).min(2).max(10),
  metric: z.enum(['workouts', 'nutrition_adherence', 'progress']),
  days: z.number().int().min(7).max(90).default(30),
});
type AnalyticsAthleteComparisonParams = z.infer<typeof analyticsAthleteComparisonParams>;

export const analyticsAthleteComparisonTool: McpTool<AnalyticsAthleteComparisonParams> = {
  name: 'analytics_athlete_comparison',
  description: 'Compares metrics across multiple athletes',
  parameters: analyticsAthleteComparisonParams,
  execute: async (rawArgs, _context: McpContext) => {
    const args = analyticsAthleteComparisonParams.parse(rawArgs);
    const since = new Date();
    since.setDate(since.getDate() - args.days);

    const comparisons = await Promise.all(
      args.athleteIds.map(async (athleteId: string) => {
        const athlete = await prisma.users.findUnique({
          where: { id: athleteId },
          select: { id: true, name: true },
        });

        let metricValue = 0;

        if (args.metric === 'workouts') {
          metricValue = await prisma.workout_sessions.count({
            where: {
              userId: athleteId,
              startedAt: { gte: since },
              completedAt: { not: null },
            },
          });
        } else if (args.metric === 'nutrition_adherence') {
          const logs = await prisma.nutrition_day_logs.count({
            where: {
              userId: athleteId,
              date: { gte: since },
            },
          });
          metricValue = Math.round((logs / args.days) * 100);
        } else {
          // Progress - measure volume from performance records
          const records = await prisma.exercise_performance_records.findMany({
            where: {
              userId: athleteId,
              createdAt: { gte: since },
            },
            select: { volume: true },
          });
          metricValue = records.reduce((s: number, rec) => s + (rec.volume?.toNumber() ?? 0), 0);
        }

        return {
          athleteId,
          name: athlete?.name ?? 'N/A',
          value: metricValue,
        };
      })
    );

    const sorted = comparisons.sort((a, b) => b.value - a.value);

    return {
      content: [
        {
          type: 'text',
          text: `📊 **Confronto Atleti** (${args.metric}, ${args.days} giorni)

${sorted.map((c, i) => `${i + 1}. **${c.name}**: ${c.value}${args.metric === 'nutrition_adherence' ? '%' : ''}`).join('\n')}`,
        },
      ],
      comparisons: sorted,
    };
  },
};

// ============================================================================
// REVENUE & ENGAGEMENT ANALYTICS
// ============================================================================

const analyticsRevenueParams = z.object({
  coachId: z.string().optional(),
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
});
type AnalyticsRevenueParams = z.infer<typeof analyticsRevenueParams>;

export const analyticsRevenueTool: McpTool<AnalyticsRevenueParams> = {
  name: 'analytics_revenue',
  description: 'Gets revenue analytics for marketplace',
  parameters: analyticsRevenueParams,
  execute: async (rawArgs, context: McpContext) => {
    const args = analyticsRevenueParams.parse(rawArgs);
    const coachId = args.coachId ?? context.userId;

    if (!coachId) {
      throw new Error('Coach ID required');
    }

    const periodDays: Record<string, number> = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365,
    };

    const days = periodDays[args.period] ?? 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const previousSince = new Date(since);
    previousSince.setDate(previousSince.getDate() - days);

    const [currentRevenue, previousRevenue] = await Promise.all([
      prisma.plan_purchases.aggregate({
        where: {
          marketplace_plan: { coachId },
          purchasedAt: { gte: since },
          status: 'COMPLETED',
        },
        _sum: { price: true },
        _count: true,
      }),
      prisma.plan_purchases.aggregate({
        where: {
          marketplace_plan: { coachId },
          purchasedAt: { gte: previousSince, lt: since },
          status: 'COMPLETED',
        },
        _sum: { price: true },
      }),
    ]);

    const current = currentRevenue._sum?.price?.toNumber() ?? 0;
    const previous = previousRevenue._sum?.price?.toNumber() ?? 0;
    const growth = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;

    return {
      content: [
        {
          type: 'text',
          text: `💰 **Revenue Analytics** (${args.period})

📈 **Periodo corrente:** €${current.toFixed(2)}
📉 **Periodo precedente:** €${previous.toFixed(2)}
📊 **Crescita:** ${growth > 0 ? '+' : ''}${growth}%
🛒 **Transazioni:** ${currentRevenue._count}`,
        },
      ],
      revenue: {
        current,
        previous,
        growth,
        transactions: currentRevenue._count,
      },
    };
  },
};

const analyticsEngagementParams = z.object({
  days: z.number().int().min(7).max(90).default(30),
});
type AnalyticsEngagementParams = z.infer<typeof analyticsEngagementParams>;

export const analyticsEngagementTool: McpTool<AnalyticsEngagementParams> = {
  name: 'analytics_engagement',
  description: 'Gets platform engagement metrics',
  parameters: analyticsEngagementParams,
  execute: async (rawArgs, _context: McpContext) => {
    const args = analyticsEngagementParams.parse(rawArgs);
    const since = new Date();
    since.setDate(since.getDate() - args.days);

    const [activeUsers, workoutSessions, nutritionLogs, conversations] = await Promise.all([
      prisma.users.count({
        where: {
          status: 'ACTIVE',
          updatedAt: { gte: since },
        },
      }),
      prisma.workout_sessions.count({
        where: { startedAt: { gte: since } },
      }),
      prisma.nutrition_day_logs.count({
        where: { date: { gte: since } },
      }),
      prisma.conversations.count({
        where: { updatedAt: { gte: since } },
      }),
    ]);

    return {
      content: [
        {
          type: 'text',
          text: `📊 **Engagement** (${args.days} giorni)

👥 **Utenti attivi:** ${activeUsers}
🏋️ **Sessioni workout:** ${workoutSessions}
🥗 **Log nutrizione:** ${nutritionLogs}
💬 **Conversazioni:** ${conversations}`,
        },
      ],
      engagement: {
        activeUsers,
        workoutSessions,
        nutritionLogs,
        conversations,
      },
    };
  },
};

// ============================================================================
// GOAL ANALYTICS
// ============================================================================

const analyticsGoalProjectionParams = z.object({
  athleteId: z.string(),
  goalType: z.enum(['weight', 'strength', 'habit']),
  targetValue: z.number(),
  targetDate: z.string().optional(),
});
type AnalyticsGoalProjectionParams = z.infer<typeof analyticsGoalProjectionParams>;

export const analyticsGoalProjectionTool: McpTool<AnalyticsGoalProjectionParams> = {
  name: 'analytics_goal_projection',
  description: 'Projects goal achievement based on current trends',
  parameters: analyticsGoalProjectionParams,
  execute: async (rawArgs, _context: McpContext) => {
    const args = analyticsGoalProjectionParams.parse(rawArgs);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let currentValue = 0;
    let trend = 0;

    if (args.goalType === 'weight') {
      const measurements = await prisma.body_measurements.findMany({
        where: {
          userId: args.athleteId,
          date: { gte: thirtyDaysAgo },
          weight: { not: null },
        },
        orderBy: { date: 'asc' },
        select: { weight: true, date: true },
      });

      if (measurements.length >= 2) {
        const first = measurements[0]?.weight?.toNumber() ?? 0;
        const last = measurements[measurements.length - 1]?.weight?.toNumber() ?? 0;
        currentValue = last;
        trend = (last - first) / measurements.length; // daily trend
      }
    } else if (args.goalType === 'strength') {
      // user_one_rep_max uses oneRepMax, not estimatedOneRepMax
      const records = await prisma.user_one_rep_max.findMany({
        where: {
          userId: args.athleteId,
          lastUpdated: { gte: thirtyDaysAgo },
        },
        orderBy: { lastUpdated: 'asc' },
      });

      if (records.length >= 2) {
        const first = records[0]?.oneRepMax?.toNumber() ?? 0;
        const last = records[records.length - 1]?.oneRepMax?.toNumber() ?? 0;
        currentValue = last;
        trend = (last - first) / 30; // daily trend
      }
    }

    const daysToGoal = trend !== 0 ? Math.ceil((args.targetValue - currentValue) / trend) : null;
    const projectedDate =
      daysToGoal && daysToGoal > 0 ? new Date(Date.now() + daysToGoal * 24 * 60 * 60 * 1000) : null;

    return {
      content: [
        {
          type: 'text',
          text: `🎯 **Proiezione Goal**

📊 **Valore attuale:** ${currentValue.toFixed(1)}
🎯 **Target:** ${args.targetValue}
📈 **Trend giornaliero:** ${trend > 0 ? '+' : ''}${trend.toFixed(2)}
📅 **Data stimata:** ${projectedDate ? projectedDate.toLocaleDateString('it-IT') : 'Non calcolabile'}

${daysToGoal && daysToGoal > 0 ? `⏳ Circa ${daysToGoal} giorni al goal` : '⚠️ Trend insufficiente per raggiungere il goal'}`,
        },
      ],
      projection: {
        currentValue,
        targetValue: args.targetValue,
        dailyTrend: trend,
        daysToGoal,
        projectedDate,
      },
    };
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export const analyticsTools = [
  analyticsAthleteOverviewTool,
  analyticsWorkoutProgressTool,
  analyticsCoachDashboardTool,
  analyticsAthleteComparisonTool,
  analyticsRevenueTool,
  analyticsEngagementTool,
  analyticsGoalProjectionTool,
] satisfies McpTool[];

import { arrayToToolRecord } from '../../utils/helpers';

export const analyticsToolsRecord = arrayToToolRecord(analyticsTools);
