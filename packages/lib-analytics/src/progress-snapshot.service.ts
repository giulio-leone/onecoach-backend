/**
 * Progress Snapshot Service
 *
 * Generates and manages periodic snapshots of user progress.
 * Snapshots are used for historical tracking and performance optimization.
 * Follows SOLID principles with single responsibility.
 */

import { prisma } from '@onecoach/lib-core';
import { getExerciseSets } from '@onecoach/one-workout';
import type { Exercise } from '@onecoach/types';
import { Prisma } from '@prisma/client';

import { logger } from '@onecoach/lib-core';
// ============================================
// SNAPSHOT GENERATION
// ============================================

export async function generateProgressSnapshot(userId: string, date: Date) {
  // Get date ranges for 7 and 30 days
  const sevenDaysAgo = new Date(date);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date(date);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get latest body measurements
  const latestBodyMeasurement = await prisma.body_measurements.findFirst({
    where: {
      userId,
      date: { lte: date },
    },
    orderBy: { date: 'desc' },
  });

  // Calculate workout metrics
  const workoutSessions7d = await prisma.workout_sessions.count({
    where: {
      userId,
      startedAt: {
        gte: sevenDaysAgo,
        lte: date,
      },
    },
  });

  const workoutSessions30d = await prisma.workout_sessions.count({
    where: {
      userId,
      startedAt: {
        gte: thirtyDaysAgo,
        lte: date,
      },
    },
  });

  const completedSessions30d = await prisma.workout_sessions.findMany({
    where: {
      userId,
      startedAt: {
        gte: thirtyDaysAgo,
        lte: date,
      },
      completedAt: { not: null },
    },
  });

  // Calculate average volume (SSOT: usa getExerciseSets)
  let totalVolume = 0;
  completedSessions30d.forEach((session: any) => {
    const exercises = session.exercises as Exercise[];
    exercises.forEach((exercise: Exercise) => {
      const sets = getExerciseSets(exercise);
      sets.forEach((set: any) => {
        if (set.done && set.repsDone && set.weightDone) {
          totalVolume += set.repsDone * set.weightDone;
        }
      });
    });
  });

  const avgVolumePerSession =
    completedSessions30d.length > 0 ? totalVolume / completedSessions30d.length : 0;

  // Get strength progress
  const performanceRecords = await prisma.exercise_performance_records.findMany({
    where: {
      userId,
      date: {
        gte: thirtyDaysAgo,
        lte: date,
      },
    },
    orderBy: { date: 'asc' },
  });

  // Group by exercise and calculate progress
  type PerformanceRecord = (typeof performanceRecords)[number];
  const exerciseMap = new Map<string, PerformanceRecord[]>();
  performanceRecords.forEach((record: any) => {
    if (!exerciseMap.has(record.exerciseId)) {
      exerciseMap.set(record.exerciseId, []);
    }
    exerciseMap.get(record.exerciseId)!.push(record);
  });

  const strengthProgress: Record<
    string,
    { startWeight: number; endWeight: number; percentChange: number }
  > = {};
  exerciseMap.forEach((records, exerciseId) => {
    if (records.length >= 2) {
      const first = records[0]!;
      const last = records[records.length - 1]!;
      const percentChange =
        ((Number(last.weight) - Number(first.weight)) / Number(first.weight)) * 100;

      strengthProgress[exerciseId] = {
        startWeight: Number(first.weight),
        endWeight: Number(last.weight),
        percentChange,
      };
    }
  });

  // Calculate nutrition metrics
  const nutritionLogs7d = await prisma.nutrition_day_logs.count({
    where: {
      userId,
      date: {
        gte: sevenDaysAgo,
        lte: date,
      },
    },
  });

  const nutritionLogs30d = await prisma.nutrition_day_logs.count({
    where: {
      userId,
      date: {
        gte: thirtyDaysAgo,
        lte: date,
      },
    },
  });

  const nutritionLogsWithMacros = await prisma.nutrition_day_logs.findMany({
    where: {
      userId,
      date: {
        gte: thirtyDaysAgo,
        lte: date,
      },
      actualDailyMacros: {
        not: Prisma.JsonNull,
      },
    },
  });

  // Calculate average macros
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFats = 0;

  nutritionLogsWithMacros.forEach((log: any) => {
    const macros = log.actualDailyMacros as Record<string, number> | null;
    if (macros) {
      totalCalories += macros.calories || 0;
      totalProtein += macros.protein || 0;
      totalCarbs += macros.carbs || 0;
      totalFats += macros.fats || 0;
    }
  });

  const count = nutritionLogsWithMacros.length || 1;
  const avgCalories = totalCalories / count;
  const avgProtein = totalProtein / count;
  const avgCarbs = totalCarbs / count;
  const avgFats = totalFats / count;

  // Calculate adherence rate
  const adherenceRate = (nutritionLogs30d / 30) * 100;

  // Get active and completed goals
  const activeGoals = await prisma.user_goals.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    select: { id: true },
  });

  const completedGoals = await prisma.user_goals.findMany({
    where: {
      userId,
      status: 'COMPLETED',
      completedDate: {
        gte: thirtyDaysAgo,
        lte: date,
      },
    },
    select: { id: true },
  });

  // Create or update snapshot
  const existingSnapshot = await prisma.user_progress_snapshots.findFirst({
    where: { userId, date },
  });

  const snapshotData = {
    weight: latestBodyMeasurement?.weight
      ? new Prisma.Decimal(Number(latestBodyMeasurement.weight))
      : null,
    bodyFat: latestBodyMeasurement?.bodyFat
      ? new Prisma.Decimal(Number(latestBodyMeasurement.bodyFat))
      : null,
    muscleMass: latestBodyMeasurement?.muscleMass
      ? new Prisma.Decimal(Number(latestBodyMeasurement.muscleMass))
      : null,
    workoutSessions7d,
    workoutSessions30d,
    avgVolumePerSession: new Prisma.Decimal(avgVolumePerSession),
    strengthProgress: strengthProgress as Prisma.InputJsonValue,
    nutritionLogs7d,
    nutritionLogs30d,
    avgCalories: new Prisma.Decimal(avgCalories),
    avgProtein: new Prisma.Decimal(avgProtein),
    avgCarbs: new Prisma.Decimal(avgCarbs),
    avgFats: new Prisma.Decimal(avgFats),
    adherenceRate: new Prisma.Decimal(adherenceRate),
    activeGoals: activeGoals.map((g: any) => g.id),
    completedGoals: completedGoals.map((g: any) => g.id),
  };

  const snapshot = existingSnapshot
    ? await prisma.user_progress_snapshots.update({
        where: { id: existingSnapshot.id },
        data: snapshotData,
      })
    : await prisma.user_progress_snapshots.create({
        data: {
          userId,
          date,
          ...snapshotData,
        },
      });

  return snapshot;
}

// ============================================
// SNAPSHOT RETRIEVAL
// ============================================

export async function getProgressSnapshot(userId: string, date: Date) {
  const snapshot = await prisma.user_progress_snapshots.findFirst({
    where: {
      userId,
      date,
    },
  });

  return snapshot;
}

export async function getProgressSnapshots(userId: string, startDate: Date, endDate: Date) {
  const snapshots = await prisma.user_progress_snapshots.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  });

  return snapshots;
}

export async function getLatestProgressSnapshot(userId: string) {
  const snapshot = await prisma.user_progress_snapshots.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
  });

  return snapshot;
}

// ============================================
// BATCH SNAPSHOT GENERATION
// ============================================

/**
 * Generate snapshots for all active users for a specific date.
 * Useful for scheduled jobs (e.g., daily cron).
 */
export async function generateSnapshotsForAllUsers(date: Date) {
  const users = await prisma.users.findMany({
    select: { id: true },
  });

  const results = await Promise.allSettled(
    users.map((user: any) => generateProgressSnapshot(user.id, date))
  );

  const successful = results.filter((r: any) => r.status === 'fulfilled').length;
  const failed = results.filter((r: any) => r.status === 'rejected').length;

  return {
    total: users.length,
    successful,
    failed,
    errors: results
      .filter((r: any) => r.status === 'rejected')
      .map((r: any) => (r as PromiseRejectedResult).reason),
  };
}

/**
 * Generate missing snapshots for a user within a date range.
 * Useful for backfilling data.
 */
export async function backfillSnapshots(userId: string, startDate: Date, endDate: Date) {
  const snapshots: unknown[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    try {
      const snapshot = await generateProgressSnapshot(userId, new Date(currentDate));
      snapshots.push(snapshot);
    } catch (error: unknown) {
      logger.error('Error generating progress snapshot', error);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return snapshots;
}
