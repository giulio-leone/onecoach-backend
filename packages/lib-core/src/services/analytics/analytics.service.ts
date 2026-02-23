import 'server-only';
import { prisma } from '@giulio-leone/lib-core';
import { toExerciseArrayTyped, toMacros } from '@giulio-leone/lib-shared';
import { getExerciseSets, hasValidSetGroups } from '@giulio-leone/one-workout';
import type { body_measurements, user_goals } from '@prisma/client';
import type {
  UserAnalyticsReport,
  AnalyticsChartData,
  TimeSeriesDataPoint,
} from '@giulio-leone/types/analytics';
import type { BodyMeasurement, UserGoal } from '@giulio-leone/types/analytics';
import type { ExerciseSet } from '@giulio-leone/types/workout';

/**
 * Analytics Service
 *
 * Comprehensive analytics and progress tracking service.
 * Follows SOLID principles with single responsibility.
 */

// ============================================
// TYPE CONVERSION HELPERS
// ============================================

/**
 * Converts Prisma body_measurements to BodyMeasurement type
 */
function toBodyMeasurement(measurement: body_measurements): BodyMeasurement {
  if (!measurement.userId) {
    throw new Error('body_measurement senza userId');
  }

  return {
    id: measurement.id,
    userId: measurement.userId,
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
    notes: measurement.notes ?? undefined,
    photos: measurement.photos as string[] | undefined,
    createdAt: measurement.createdAt.toISOString(),
    updatedAt: measurement.updatedAt.toISOString(),
  };
}

/**
 * Converts Prisma user_goals to UserGoal type
 */
function toUserGoal(goal: user_goals): UserGoal {
  if (!goal.userId) {
    throw new Error('user_goal senza userId');
  }

  const targetRaw = goal.target as {
    metric: string;
    targetValue: number;
    currentValue?: number;
    unit: string;
  } | null;

  const target = targetRaw ?? { metric: '', targetValue: 0, currentValue: 0, unit: '' };

  const progressLogs =
    (goal.progressLogs as Array<{ date: string | Date; value: number; notes?: string }> | null) ??
    [];

  return {
    id: goal.id,
    userId: goal.userId,
    type: goal.type,
    target: {
      metric: target.metric,
      targetValue: target.targetValue,
      currentValue: target.currentValue ?? 0,
      unit: target.unit,
    },
    deadline: goal.deadline ?? undefined,
    status: goal.status as 'ACTIVE' | 'COMPLETED' | 'ABANDONED',
    startDate: goal.startDate,
    completedDate: goal.completedDate ?? undefined,
    progressLogs: progressLogs.map((log) => ({
      date: typeof log.date === 'string' ? new Date(log.date) : log.date,
      value: log.value,
      notes: log.notes,
    })),
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
  const measurements = await prisma.body_measurements.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  });

  return measurements
    .filter((m) => m[metric] !== null)
    .map((m) => ({
      date: m.date,
      value: Number(m[metric as keyof typeof m] ?? 0),
    }));
}

export async function getBodyMetricsChange(userId: string, startDate: Date, endDate: Date) {
  const [start, end] = await Promise.all([
    prisma.body_measurements.findFirst({
      where: { userId, date: { gte: startDate } },
      orderBy: { date: 'asc' },
    }),
    prisma.body_measurements.findFirst({
      where: { userId, date: { lte: endDate } },
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
  const sessions = await prisma.workout_sessions.findMany({
    where: {
      userId,
      startedAt: {
        gte: startDate,
        lte: endDate,
      },
      completedAt: { not: null },
    },
    orderBy: { startedAt: 'asc' },
  });

  return sessions.map((session) => {
    const exercises = toExerciseArrayTyped(session.exercises);
    const totalVolume = exercises.reduce((sum: number, exercise) => {
      if (!hasValidSetGroups(exercise)) return sum;

      // Usa helper SSOT per estrarre le serie da setGroups
      const sets = getExerciseSets(exercise);
      const exerciseVolume = sets.reduce((setSum: number, set: ExerciseSet) => {
        if (set.done && set.repsDone !== undefined && set.weightDone !== undefined) {
          const reps = set.repsDone ?? set.reps ?? 0;
          const weight = set.weightDone ?? set.weight ?? 0;
          return setSum + reps * weight;
        }
        return setSum;
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
): Promise<{
  exerciseId: string;
  startDate: Date;
  endDate: Date;
  startWeight: number;
  endWeight: number;
  percentChange: number;
  records: Array<{
    date: Date;
    weight: number;
    reps: number | null;
    volume: number;
  }>;
} | null> {
  const records = await prisma.exercise_performance_records.findMany({
    where: {
      userId,
      exerciseId,
      date: {
        gte: startDate,
        lte: endDate,
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

  const startMax = Number(firstRecord.weight);
  const endMax = Number(lastRecord.weight);
  const percentChange = ((endMax - startMax) / startMax) * 100;

  return {
    exerciseId,
    startDate: firstRecord.date,
    endDate: lastRecord.date,
    startWeight: startMax,
    endWeight: endMax,
    percentChange,
    records: records.map((r) => ({
      date: r.date,
      weight: Number(r.weight),
      reps: r.reps,
      volume: Number(r.volume),
    })),
  };
}

export async function calculateWorkoutMetrics(userId: string, startDate: Date, endDate: Date) {
  const sessions = await prisma.workout_sessions.findMany({
    where: {
      userId,
      startedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const completedSessions = sessions.filter((s) => s.completedAt !== null);

  const totalVolume = completedSessions.reduce((sum: number, session) => {
    const exercises = toExerciseArrayTyped(session.exercises);
    const sessionVolume = exercises.reduce((exSum: number, exercise) => {
      if (!hasValidSetGroups(exercise)) return exSum;

      // Usa helper SSOT per estrarre le serie da setGroups
      const sets = getExerciseSets(exercise);
      return (
        exSum +
        sets.reduce((setSum: number, set: ExerciseSet) => {
          if (set.done && set.repsDone !== undefined && set.weightDone !== undefined) {
            const reps = set.repsDone ?? set.reps ?? 0;
            const weight = set.weightDone ?? set.weight ?? 0;
            return setSum + reps * weight;
          }
          return setSum;
        }, 0)
      );
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

  // Calculate average macros
  const totals = logs.reduce(
    (sum, log) => {
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
  const logs = await prisma.nutrition_day_logs.findMany({
    where: {
      userId,
      planId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  });

  return logs
    .filter((log) => log.actualDailyMacros !== null)
    .map((log) => {
      const macros = toMacros(log.actualDailyMacros);
      return {
        date: log.date,
        value: macros[macro] || 0,
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
  // Get body metrics
  const bodyMetricsChange = await getBodyMetricsChange(userId, startDate, endDate);

  const [currentBodyMetrics, previousBodyMetrics] = await Promise.all([
    prisma.body_measurements.findFirst({
      where: { userId, date: { lte: endDate } },
      orderBy: { date: 'desc' },
    }),
    prisma.body_measurements.findFirst({
      where: { userId, date: { gte: startDate } },
      orderBy: { date: 'asc' },
    }),
  ]);

  // Get workout metrics
  const workoutMetrics = await calculateWorkoutMetrics(userId, startDate, endDate);

  // Get strength gains
  const performanceRecords = await prisma.exercise_performance_records.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  });

  // Group by exercise and calculate gains
  const exerciseMap = new Map<string, Array<(typeof performanceRecords)[number]>>();

  performanceRecords.forEach((record) => {
    if (!exerciseMap.has(record.exerciseId)) {
      exerciseMap.set(record.exerciseId, []);
    }
    exerciseMap.get(record.exerciseId)!.push(record);
  });

  const strengthGains = Array.from(exerciseMap.entries())
    .map(([exerciseId, records]) => {
      if (records.length < 2) return null;

      const firstRecord = records[0];
      const lastRecord = records[records.length - 1];
      if (!firstRecord || !lastRecord) return null;

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
    .filter((g): g is NonNullable<typeof g> => g !== null);

  // Lookup nome esercizio dalle traduzioni (locale it), fallback exerciseId
  if (strengthGains.length > 0) {
    const exerciseIds = strengthGains.map((g) => g.exerciseId);
    const translations = await prisma.exercise_translations.findMany({
      where: { exerciseId: { in: exerciseIds }, locale: 'it' },
      select: { exerciseId: true, name: true },
    });
    const nameMap = new Map(translations.map((t) => [t.exerciseId, t.name] as const));
    for (const g of strengthGains) {
      g.exerciseName = nameMap.get(g.exerciseId) || g.exerciseId;
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

  const avgMacros = nutritionLogs.reduce(
    (sum, log) => {
      const macros = toMacros(log.actualDailyMacros);
      return {
        calories: sum.calories + macros.calories,
        protein: sum.protein + macros.protein,
        carbs: sum.carbs + macros.carbs,
        fats: sum.fats + macros.fats,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const logCount = nutritionLogs.length || 1;
  avgMacros.calories /= logCount;
  avgMacros.protein /= logCount;
  avgMacros.carbs /= logCount;
  avgMacros.fats /= logCount;

  // Calorie variance series: target vs actual per log day
  let calorieVariance: Array<{ date: string; target: number; actual: number; variance: number }> =
    [];
  if (nutritionLogs.length > 0) {
    const planIds = Array.from(new Set(nutritionLogs.map((l) => l.planId).filter(Boolean)));
    const plans = planIds.length
      ? await prisma.nutrition_plans.findMany({ where: { id: { in: planIds } } })
      : [];
    const planTargetMap = new Map<string, { calories: number }>();
    for (const p of plans) {
      const macros = toMacros(p.targetMacros);
      planTargetMap.set(p.id, { calories: macros.calories });
    }

    calorieVariance = nutritionLogs
      .filter((log) => log.actualDailyMacros)
      .map((log) => {
        const target = planTargetMap.get(log.planId)?.calories ?? 0;
        const macros = toMacros(log.actualDailyMacros);
        const actual = macros.calories;
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
    nutritionLogs.map((l) => new Date(l.date.toDateString()).toISOString())
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
    const activePlan = userPlans.find((plan) => plan.status === 'ACTIVE') || userPlans[0];
    if (activePlan) {
      targetForVariance = toMacros(activePlan.targetMacros);
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

  const activeGoals = goals.filter((g) => g.status === 'ACTIVE');
  const completedGoals = goals.filter((g) => g.status === 'COMPLETED');

  // Calculate onTrack and atRisk goals
  const now = new Date();
  let onTrackCount = 0;
  let atRiskCount = 0;

  for (const goal of activeGoals) {
    const progressLogs = (goal.progressLogs as Array<{ date: string; value: number }>) || [];
    const latestProgress = progressLogs.length > 0 ? progressLogs[progressLogs.length - 1] : null;
    const target = goal.target as { metric: string; targetValue: number; currentValue?: number };
    const currentValue = target.currentValue ?? latestProgress?.value ?? 0;
    const targetValue = target.targetValue;

    if (goal.deadline) {
      const deadline = new Date(goal.deadline);
      const startDate = new Date(goal.startDate);
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
    userId,
    period: { start: startDate, end: endDate },
    bodyMetrics: {
      current: currentBodyMetrics ? toBodyMeasurement(currentBodyMetrics) : null,
      previous: previousBodyMetrics ? toBodyMeasurement(previousBodyMetrics) : null,
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
    goals: {
      active: activeGoals.map(toUserGoal),
      completed: completedGoals.map(toUserGoal),
      onTrack: onTrackCount,
      atRisk: atRiskCount,
    },
  };
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
