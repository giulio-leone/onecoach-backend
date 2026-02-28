/**
 * Analytics Service
 *
 * Comprehensive analytics and progress tracking service.
 * Follows SOLID principles with single responsibility.
 */

import { prisma } from '../prisma';

// Lazy import to break circular dep: lib-core → one-workout → lib-core
let _getExerciseSets: ((exercise: { setGroups?: unknown[] }) => unknown[]) | null = null;
async function loadGetExerciseSets() {
  if (!_getExerciseSets) {
    const mod = await import('@giulio-leone/one-workout');
    _getExerciseSets = mod.getExerciseSets as unknown as typeof _getExerciseSets;
  }
  return _getExerciseSets!;
}
import type {
  UserAnalyticsReport,
  AnalyticsChartData,
  TimeSeriesDataPoint,
  BodyMeasurement,
  UserGoal,
} from '@giulio-leone/types/analytics';
import {
  toExerciseArrayTyped,
  toMacros,
  calculateSetVolume,
} from '@giulio-leone/lib-shared/prisma-type-guards';
import type { body_measurements, user_goals } from '@prisma/client';
import { Prisma } from '@prisma/client';

const MAX_RANGE_DAYS = 365;
const MAX_RANGE_MS = MAX_RANGE_DAYS * 24 * 60 * 60 * 1000;

function clampDateRange(startDate: Date, endDate: Date) {
  const safeEnd = endDate;
  const safeStart =
    endDate.getTime() - startDate.getTime() > MAX_RANGE_MS
      ? new Date(endDate.getTime() - MAX_RANGE_MS)
      : startDate;

  return {
    start: safeStart,
    end: safeEnd,
  };
}

// Helper functions to convert Prisma types to domain types
function toBodyMeasurement(measurement: body_measurements | null): BodyMeasurement | null {
  if (!measurement) return null;
  return {
    id: measurement.id,
    userId: measurement.userId ?? '',
    date: measurement.date,
    weight: measurement.weight ? Number(measurement.weight) : undefined,
    bodyFat: measurement.bodyFat ? Number(measurement.bodyFat) : undefined,
    muscleMass: measurement.muscleMass ? Number(measurement.muscleMass) : undefined,
    chest: measurement.chest ? Number(measurement.chest) : undefined,
    waist: measurement.waist ? Number(measurement.waist) : undefined,
    hips: measurement.hips ? Number(measurement.hips) : undefined,
    thigh: measurement.thigh ? Number(measurement.thigh) : undefined,
    arm: measurement.arm ? Number(measurement.arm) : undefined,
    calf: measurement.calf ? Number(measurement.calf) : undefined,
    neck: measurement.neck ? Number(measurement.neck) : undefined,
    shoulders: measurement.shoulders ? Number(measurement.shoulders) : undefined,
    notes: measurement.notes || undefined,
    photos: (measurement.photos as string[]) || undefined,
    createdAt: measurement.createdAt.toISOString(),
    updatedAt: measurement.updatedAt.toISOString(),
  };
}

function toUserGoal(goal: user_goals): UserGoal {
  const target = (goal.target as {
    metric: string;
    targetValue: number;
    currentValue?: number;
    unit?: string;
  }) || { metric: '', targetValue: 0, currentValue: 0, unit: '' };
  type ProgressLogEntry = { date: string | Date; value: number; notes?: string };
  const progressLogs = ((goal.progressLogs as Array<ProgressLogEntry>) || []).map(
    (log: ProgressLogEntry) => ({
      date: typeof log.date === 'string' ? new Date(log.date) : log.date,
      value: log.value,
      notes: log.notes,
    })
  );

  return {
    id: goal.id,
    userId: goal.userId ?? '',
    type: goal.type,
    target: {
      metric: target.metric,
      targetValue: target.targetValue,
      currentValue: target.currentValue ?? 0,
      unit: target.unit || '',
    },
    deadline: goal.deadline ?? undefined,
    status: goal.status as 'ACTIVE' | 'COMPLETED' | 'ABANDONED',
    startDate: goal.startDate,
    completedDate: goal.completedDate ?? undefined,
    progressLogs,
    notes: goal.notes ?? undefined,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}

// ============================================
// BODY METRICS ANALYTICS
// ============================================

export async function getBodyMetricsTimeSeries(
  userId: string,
  metric: 'weight' | 'bodyFat' | 'muscleMass',
  startDate: Date,
  endDate: Date
): Promise<TimeSeriesDataPoint[]> {
  const { start: startRange, end: endRange } = clampDateRange(startDate, endDate);
  const measurements = await prisma.body_measurements.findMany({
    where: {
      userId,
      date: {
        gte: startRange,
        lte: endRange,
      },
    },
    orderBy: { date: 'asc' },
  });

  return measurements
    .filter((m: any) => m[metric] !== null)
    .map((m: any) => ({
      date: m.date,
      value: Number(m[metric]),
    }));
}

export async function getBodyMetricsChange(userId: string, startDate: Date, endDate: Date) {
  const { start: startRange, end: endRange } = clampDateRange(startDate, endDate);
  const [start, end] = await Promise.all([
    prisma.body_measurements.findFirst({
      where: { userId, date: { gte: startRange } },
      orderBy: { date: 'asc' },
    }),
    prisma.body_measurements.findFirst({
      where: { userId, date: { lte: endRange } },
      orderBy: { date: 'desc' },
    }),
  ]);

  if (!start || !end) return null;

  return {
    weight: end.weight && start.weight ? Number(end.weight) - Number(start.weight) : undefined,
    bodyFat: end.bodyFat && start.bodyFat ? Number(end.bodyFat) - Number(start.bodyFat) : undefined,
    muscleMass:
      end.muscleMass && start.muscleMass
        ? Number(end.muscleMass) - Number(start.muscleMass)
        : undefined,
  };
}

// ============================================
// WORKOUT ANALYTICS
// ============================================

export async function getWorkoutVolumeTimeSeries(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<TimeSeriesDataPoint[]> {
  const { start: startRange, end: endRange } = clampDateRange(startDate, endDate);
  const sessions = await prisma.workout_sessions.findMany({
    where: {
      userId,
      startedAt: {
        gte: startRange,
        lte: endRange,
      },
      completedAt: { not: null },
    },
    orderBy: { startedAt: 'asc' },
  });

  const getExerciseSets = await loadGetExerciseSets();

  return sessions.map((session: any) => {
    const exercises = toExerciseArrayTyped(session.exercises);
    // SSOT: usa getExerciseSets() invece di exercise.sets
    const totalVolume = exercises.reduce((sum: number, exercise) => {
      const sets = getExerciseSets(exercise);
      const exerciseVolume = sets.reduce((setSum: number, set) => {
        return (
          setSum +
          calculateSetVolume({ ...(set as Record<string, unknown>), weight: (set as Record<string, unknown>).weight ?? 0 } as Parameters<
            typeof calculateSetVolume
          >[0])
        );
      }, 0);
      return sum + exerciseVolume;
    }, 0);

    return {
      date: session.startedAt,
      value: totalVolume,
    };
  });
}

export async function getStrengthProgress(
  userId: string,
  exerciseId: string,
  startDate: Date,
  endDate: Date
) {
  const { start: startRange, end: endRange } = clampDateRange(startDate, endDate);
  const records = await prisma.exercise_performance_records.findMany({
    where: {
      userId,
      exerciseId,
      date: {
        gte: startRange,
        lte: endRange,
      },
    },
    orderBy: { date: 'asc' },
  });

  if (records.length === 0) return null;

  const firstRecord = records[0];
  const lastRecord = records[records.length - 1];

  if (!firstRecord || !lastRecord) {
    return null;
  }

  const startMax = Number(firstRecord!.weight);
  const endMax = Number(lastRecord!.weight);
  const percentChange = ((endMax - startMax) / startMax) * 100;

  return {
    exerciseId,
    startDate: firstRecord.date,
    endDate: lastRecord.date,
    startWeight: startMax,
    endWeight: endMax,
    percentChange,
    records: records.map((r: any) => ({
      date: r.date,
      weight: Number(r.weight),
      reps: r.reps,
      volume: Number(r.volume),
    })),
  };
}

export async function calculateWorkoutMetrics(userId: string, startDate: Date, endDate: Date) {
  const { start: startRange, end: endRange } = clampDateRange(startDate, endDate);
  const sessions = await prisma.workout_sessions.findMany({
    where: {
      userId,
      startedAt: {
        gte: startRange,
        lte: endRange,
      },
    },
  });

  const completedSessions = sessions.filter((s: any) => s.completedAt !== null);

  const getExerciseSets = await loadGetExerciseSets();
  const totalVolume = completedSessions.reduce((sum: number, session: any) => {
    const exercises = toExerciseArrayTyped(session.exercises);
    // SSOT: usa getExerciseSets() invece di exercise.sets
    const sessionVolume = exercises.reduce((exSum: number, exercise) => {
      const sets = getExerciseSets(exercise);
      const exerciseVolume = sets.reduce((setSum: number, set) => {
        return (
          setSum +
          calculateSetVolume({ ...(set as Record<string, unknown>), weight: (set as Record<string, unknown>).weight ?? 0 } as Parameters<
            typeof calculateSetVolume
          >[0])
        );
      }, 0);
      return exSum + exerciseVolume;
    }, 0);
    return sum + sessionVolume;
  }, 0);

  return {
    totalSessions: sessions.length,
    completedSessions: completedSessions.length,
    completionRate: sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0,
    totalVolume,
    avgVolume: completedSessions.length > 0 ? totalVolume / completedSessions.length : 0,
  };
}

// ============================================
// NUTRITION ANALYTICS
// ============================================

export async function calculateNutritionAdherence(
  userId: string,
  planId: string,
  weekNumber: number
) {
  const plan = await prisma.nutrition_plans.findUnique({
    where: { id: planId },
  });

  if (!plan || plan.userId !== userId) {
    throw new Error('Plan not found or unauthorized');
  }

  // Get target macros
  const targetMacros = toMacros(plan.targetMacros);

  // Get logs for this week
  const logs = await prisma.nutrition_day_logs.findMany({
    where: {
      userId,
      planId,
      weekNumber,
    },
  });

  const totalDays = 7; // Standard week
  const daysLogged = logs.length;
  const adherenceRate = (daysLogged / totalDays) * 100;

  type MacroTotals = {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    waterIntake: number;
  };
  // Calculate average macros
  const totals = logs.reduce(
    (sum: MacroTotals, log: any) => {
      const actualMacros = toMacros(log.actualDailyMacros);
      return {
        calories: sum.calories + actualMacros.calories,
        protein: sum.protein + actualMacros.protein,
        carbs: sum.carbs + actualMacros.carbs,
        fats: sum.fats + actualMacros.fats,
        waterIntake: sum.waterIntake + (log.waterIntake ? Number(log.waterIntake) : 0),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0, waterIntake: 0 }
  );

  const count = logs.length || 1;
  const avgMacros = {
    calories: totals.calories / count,
    protein: totals.protein / count,
    carbs: totals.carbs / count,
    fats: totals.fats / count,
  };

  // Calculate variance from targets
  const variance = {
    calories: ((avgMacros.calories - targetMacros.calories) / targetMacros.calories) * 100,
    protein: ((avgMacros.protein - targetMacros.protein) / targetMacros.protein) * 100,
    carbs: ((avgMacros.carbs - targetMacros.carbs) / targetMacros.carbs) * 100,
    fats: ((avgMacros.fats - targetMacros.fats) / targetMacros.fats) * 100,
  };

  return {
    daysLogged,
    totalDays,
    adherenceRate,
    avgMacros,
    variance,
    avgWaterIntake: totals.waterIntake / count,
  };
}

export async function getNutritionMacrosTimeSeries(
  userId: string,
  planId: string,
  macro: 'calories' | 'protein' | 'carbs' | 'fats',
  startDate: Date,
  endDate: Date
): Promise<TimeSeriesDataPoint[]> {
  const { start: startRange, end: endRange } = clampDateRange(startDate, endDate);
  const logs = await prisma.nutrition_day_logs.findMany({
    where: {
      userId,
      planId,
      date: {
        gte: startRange,
        lte: endRange,
      },
    },
    orderBy: { date: 'asc' },
  });

  return logs
    .filter((log: any) => log.actualDailyMacros !== null)
    .map((log: any) => {
      const macros = log.actualDailyMacros as Record<string, unknown> | null;
      if (!macros || typeof macros !== 'object') {
        return { date: log.date, value: 0 };
      }
      return {
        date: log.date,
        value: (macros[macro] as number) || 0,
      };
    });
}

// ============================================
// COMPREHENSIVE ANALYTICS REPORT
// ============================================

export async function generateAnalyticsReport(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<UserAnalyticsReport> {
  const { start: startRange, end: endRange } = clampDateRange(startDate, endDate);
  // Get body metrics
  const bodyMetricsChange = await getBodyMetricsChange(userId, startRange, endRange);

  const [currentBodyMetricsRaw, previousBodyMetricsRaw] = await Promise.all([
    prisma.body_measurements.findFirst({
      where: { userId, date: { lte: endRange } },
      orderBy: { date: 'desc' },
    }),
    prisma.body_measurements.findFirst({
      where: { userId, date: { gte: startRange } },
      orderBy: { date: 'asc' },
    }),
  ]);
  const currentBodyMetrics = toBodyMeasurement(currentBodyMetricsRaw);
  const previousBodyMetrics = toBodyMeasurement(previousBodyMetricsRaw);

  // Get workout metrics
  const workoutMetrics = await calculateWorkoutMetrics(userId, startRange, endRange);

  // Get strength gains
  const performanceRecords = await prisma.exercise_performance_records.findMany({
    where: {
      userId,
      date: {
        gte: startRange,
        lte: endRange,
      },
    },
    orderBy: { date: 'asc' },
  });

  // Group by exercise and calculate gains
  type PerformanceRecord = (typeof performanceRecords)[number];
  const exerciseMap = new Map<string, PerformanceRecord[]>();
  performanceRecords.forEach((record: any) => {
    if (!exerciseMap.has(record.exerciseId)) {
      exerciseMap.set(record.exerciseId, []);
    }
    exerciseMap.get(record.exerciseId)!.push(record);
  });

  const strengthGains = Array.from(exerciseMap.entries())
    .map(([exerciseId, records]) => {
      if (records.length < 2) return null;

      const firstRecord = records[0]!;
      const lastRecord = records[records.length - 1]!;
      const percentChange =
        ((Number(lastRecord.weight) - Number(firstRecord.weight)) / Number(firstRecord.weight)) *
        100;

      return {
        exerciseId,
        exerciseName: exerciseId, // Will be resolved below
        percentChange,
        previousMax: Number(firstRecord.weight),
        currentMax: Number(lastRecord.weight),
      };
    })
    .filter(
      (
        g
      ): g is {
        exerciseId: string;
        exerciseName: string;
        percentChange: number;
        previousMax: number;
        currentMax: number;
      } => g !== null
    );

  // Lookup nome esercizio dalle traduzioni (locale it), fallback exerciseId
  if (strengthGains.length > 0) {
    const exerciseIds = strengthGains.map((g: any) => g.exerciseId);
    const translations = await prisma.exercise_translations.findMany({
      where: { exerciseId: { in: exerciseIds }, locale: 'it' },
      select: { exerciseId: true, name: true },
    });
    const nameMap = new Map(translations.map((t: any) => [t.exerciseId, t.name] as const));
    for (const g of strengthGains) {
      g.exerciseName = (nameMap.get(g.exerciseId) as unknown as string) || g.exerciseId;
    }
  }

  // Get nutrition metrics
  const nutritionLogs = await prisma.nutrition_day_logs.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  });

  type MacroSum = { calories: number; protein: number; carbs: number; fats: number };
  const avgMacros = nutritionLogs.reduce(
    (sum: MacroSum, log: any) => {
      const macros = log.actualDailyMacros as Record<string, number> | null;
      if (macros && typeof macros === 'object') {
        return {
          calories: sum.calories + (macros.calories || 0),
          protein: sum.protein + (macros.protein || 0),
          carbs: sum.carbs + (macros.carbs || 0),
          fats: sum.fats + (macros.fats || 0),
        };
      }
      return sum;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const logCount = nutritionLogs.length || 1;
  Object.keys(avgMacros).forEach((key: string) => {
    const typedAvgMacros = avgMacros as Record<string, number>;
    typedAvgMacros[key] = (typedAvgMacros[key] || 0) / logCount;
  });

  // Calorie variance series: target vs actual per log day
  let calorieVariance: Array<{ date: string; target: number; actual: number; variance: number }> =
    [];
  if (nutritionLogs.length > 0) {
    const planIds = Array.from(new Set(nutritionLogs.map((l: any) => l.planId).filter(Boolean)));
    const plans = planIds.length
      ? await prisma.nutrition_plans.findMany({ where: { id: { in: planIds } } })
      : [];
    const planTargetMap = new Map<string, { calories: number }>();
    for (const p of plans) {
      const macros = toMacros(p.targetMacros);
      planTargetMap.set(p.id, { calories: macros.calories });
    }

    calorieVariance = nutritionLogs
      .filter((log: any) => log.actualDailyMacros)
      .map((log: any) => {
        const target = planTargetMap.get(log.planId)?.calories ?? 0;
        const actual = (log.actualDailyMacros as Record<string, number> | null)?.calories ?? 0;
        const variance = target > 0 ? ((actual - target) / target) * 100 : 0;
        return {
          date: log.date.toISOString(),
          target,
          actual,
          variance,
        };
      });
  }

  // Calcolo aderenza: giorni con log su totale giorni nel periodo
  const totalDaysInPeriod = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  // Considera giorni unici con almeno un log
  const uniqueLoggedDays = new Set(
    nutritionLogs.map((l: any) => new Date(l.date.toDateString()).toISOString())
  );
  const adherenceRate = (uniqueLoggedDays.size / totalDaysInPeriod) * 100;

  // Varianze dai target: usa il piano attivo più recente nel periodo, fallback ultimo piano dell'utente
  const userPlans = await prisma.nutrition_plans.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
  let targetForVariance = { calories: 0, protein: 0, carbs: 0, fats: 0 } as {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  if (userPlans.length > 0) {
    // Preferisci un piano con status ACTIVE, altrimenti il più recente
    const activePlan = userPlans.find((p: any) => p.status === 'ACTIVE') ?? userPlans[0]!;
    const targetMacros = activePlan.targetMacros;
    if (targetMacros) {
      targetForVariance = toMacros(targetMacros as Prisma.JsonValue);
    }
  }

  const varianceFromTargets =
    targetForVariance.calories > 0
      ? {
          calories:
            ((avgMacros.calories - targetForVariance.calories) / targetForVariance.calories) * 100,
          protein:
            targetForVariance.protein > 0
              ? ((avgMacros.protein - targetForVariance.protein) / targetForVariance.protein) * 100
              : 0,
          carbs:
            targetForVariance.carbs > 0
              ? ((avgMacros.carbs - targetForVariance.carbs) / targetForVariance.carbs) * 100
              : 0,
          fats:
            targetForVariance.fats > 0
              ? ((avgMacros.fats - targetForVariance.fats) / targetForVariance.fats) * 100
              : 0,
        }
      : { calories: 0, protein: 0, carbs: 0, fats: 0 };

  // Get goals
  const goals = await prisma.user_goals.findMany({
    where: { userId },
  });

  const activeGoals = goals.filter((g: any) => g.status === 'ACTIVE').map(toUserGoal);
  const completedGoals = goals.filter((g: any) => g.status === 'COMPLETED').map(toUserGoal);

  return {
    userId,
    period: { start: startDate, end: endDate },
    bodyMetrics: {
      current: currentBodyMetrics,
      previous: previousBodyMetrics,
      changes: bodyMetricsChange || {},
    },
    workoutAnalytics: {
      ...workoutMetrics,
      strengthGains,
    },
    nutritionAnalytics: {
      totalLogs: nutritionLogs.length,
      adherenceRate,
      avgMacros,
      varianceFromTargets,
      calorieVariance,
    },
    goals: (() => {
      // Calculate onTrack and atRisk goals
      const now = new Date();
      let onTrackCount = 0;
      let atRiskCount = 0;

      for (const goal of activeGoals) {
        const progressLogs = goal.progressLogs || [];
        const latestProgress =
          progressLogs.length > 0 ? progressLogs[progressLogs.length - 1] : null;
        const target = goal.target as {
          metric: string;
          targetValue: number;
          currentValue?: number;
        };
        const currentValue = target.currentValue ?? latestProgress?.value ?? 0;
        const targetValue = target.targetValue;

        if (goal.deadline) {
          const deadline = new Date(goal.deadline);
          const startDate =
            typeof goal.startDate === 'string' ? new Date(goal.startDate) : goal.startDate;
          const totalDays = Math.max(
            1,
            Math.ceil((deadline.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
          );
          const daysElapsed = Math.max(
            0,
            Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
          );
          const daysRemaining = Math.max(
            0,
            Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          );

          const expectedProgress = (daysElapsed / totalDays) * 100;
          const actualProgress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;

          // Goal is on track if actual progress >= 70% of expected progress
          if (actualProgress >= expectedProgress * 0.7) {
            onTrackCount++;
          }
          // Goal is at risk if actual progress < 50% of expected progress and deadline is within 30 days
          else if (actualProgress < expectedProgress * 0.5 && daysRemaining <= 30) {
            atRiskCount++;
          }
        } else {
          // Goals without deadline are considered on track if they have any progress
          if (currentValue > 0) {
            onTrackCount++;
          }
        }
      }

      return {
        active: activeGoals,
        completed: completedGoals,
        onTrack: onTrackCount,
        atRisk: atRiskCount,
      };
    })(),
  };
}

// ============================================
// GOALS MANAGEMENT
// ============================================

export async function getUserGoals(userId: string): Promise<UserGoal[]> {
  const goals = await prisma.user_goals.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return goals.map(toUserGoal);
}

export async function createUserGoal(
  userId: string,
  goal: Omit<UserGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<UserGoal> {
  const targetData = {
    metric: goal.target.metric,
    targetValue: goal.target.targetValue,
    currentValue: goal.target.currentValue,
    unit: goal.target.unit,
  };

  const progressLogs: Prisma.InputJsonValue[] =
    goal.progressLogs?.map((log: any) => ({
      date: log.date instanceof Date ? log.date.toISOString() : log.date,
      value: log.value,
      notes: log.notes ?? null,
    })) ?? [];

  const newGoal = await prisma.user_goals.create({
    data: {
      userId,
      type: goal.type,
      target: targetData as Prisma.InputJsonValue,
      startDate: goal.startDate,
      deadline: goal.deadline,
      status: goal.status,
      notes: goal.notes,
      progressLogs,
      completedDate: goal.completedDate,
    },
  });

  return toUserGoal(newGoal);
}

// ============================================
// CHART DATA GENERATION
// ============================================

export async function generateWeightChart(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<AnalyticsChartData> {
  const data = await getBodyMetricsTimeSeries(userId, 'weight', startDate, endDate);

  return {
    type: 'line',
    title: 'Weight Progress',
    xLabel: 'Date',
    yLabel: 'Weight (kg)',
    datasets: [
      {
        label: 'Weight',
        data,
        color: '#3b82f6',
      },
    ],
  };
}

export async function generateVolumeChart(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<AnalyticsChartData> {
  const data = await getWorkoutVolumeTimeSeries(userId, startDate, endDate);

  return {
    type: 'bar',
    title: 'Training Volume',
    xLabel: 'Date',
    yLabel: 'Volume (kg)',
    datasets: [
      {
        label: 'Total Volume',
        data,
        color: '#10b981',
      },
    ],
  };
}

export async function generateMacrosChart(
  userId: string,
  planId: string,
  startDate: Date,
  endDate: Date
): Promise<AnalyticsChartData> {
  const [calories, protein, carbs, fats] = await Promise.all([
    getNutritionMacrosTimeSeries(userId, planId, 'calories', startDate, endDate),
    getNutritionMacrosTimeSeries(userId, planId, 'protein', startDate, endDate),
    getNutritionMacrosTimeSeries(userId, planId, 'carbs', startDate, endDate),
    getNutritionMacrosTimeSeries(userId, planId, 'fats', startDate, endDate),
  ]);

  return {
    type: 'area',
    title: 'Nutrition Macros',
    xLabel: 'Date',
    yLabel: 'Grams',
    datasets: [
      { label: 'Calories', data: calories, color: '#f59e0b' },
      { label: 'Protein', data: protein, color: '#ef4444' },
      { label: 'Carbs', data: carbs, color: '#3b82f6' },
      { label: 'Fats', data: fats, color: '#8b5cf6' },
    ],
  };
}

// ============================================
// CHECKOUT EVENTS
// ============================================

export async function trackCheckoutEvent(params: {
  type: string;
  userId?: string;
  cartId?: string;
  metadata?: Record<string, unknown>;
}) {
  const { type, userId, cartId, metadata } = params;
  await prisma.checkout_events.create({
    data: {
      type,
      userId: userId || null,
      cartId: cartId || null,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  });
}

// Export analytics service as object with all functions
export const analyticsService = {
  getBodyMetricsTimeSeries,
  getBodyMetricsChange,
  getWorkoutVolumeTimeSeries,
  getStrengthProgress,
  calculateWorkoutMetrics,
  calculateNutritionAdherence,
  getNutritionMacrosTimeSeries,
  generateAnalyticsReport,
  generateWeightChart,
  generateVolumeChart,
  generateMacrosChart,
  getUserGoals,
  createUserGoal,
  trackCheckoutEvent,
};
