import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@giulio-leone/lib-core/auth/config';
import { prisma as db } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health/summary
 * Get health data summary for the authenticated user
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    // Get steps data
    const todaySteps = await db.health_steps.findFirst({
      where: {
        userId,
        date: {
          gte: todayStart,
        },
      },
    });

    const weekSteps = await db.health_steps.aggregate({
      where: {
        userId,
        date: {
          gte: weekStart,
        },
      },
      _sum: {
        steps: true,
      },
    });

    const lastStepsSync = await db.health_steps.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    // Get heart rate data
    const latestHeartRate = await db.health_heart_rate.findFirst({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    });

    const avgHeartRate = await db.health_heart_rate.aggregate({
      where: {
        userId,
        recordedAt: {
          gte: weekStart,
        },
      },
      _avg: {
        bpm: true,
      },
    });

    const lastHRSync = await db.health_heart_rate.findFirst({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      select: { recordedAt: true },
    });

    // Get active calories data
    const todayCalories = await db.health_active_calories.findFirst({
      where: {
        userId,
        date: {
          gte: todayStart,
        },
      },
    });

    const weekCalories = await db.health_active_calories.aggregate({
      where: {
        userId,
        date: {
          gte: weekStart,
        },
      },
      _sum: {
        calories: true,
      },
    });

    const lastCaloriesSync = await db.health_active_calories.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    // Get weight data
    const latestWeight = await db.health_weight.findFirst({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    });

    const previousWeight = await db.health_weight.findFirst({
      where: {
        userId,
        recordedAt: {
          lt: latestWeight?.recordedAt || now,
        },
      },
      orderBy: { recordedAt: 'desc' },
    });

    let weightTrend: 'up' | 'down' | 'stable' | null = null;
    if (latestWeight && previousWeight) {
      const diff = latestWeight.weight.toNumber() - previousWeight.weight.toNumber();
      if (Math.abs(diff) < 0.5) {
        weightTrend = 'stable';
      } else if (diff > 0) {
        weightTrend = 'up';
      } else {
        weightTrend = 'down';
      }
    }

    const lastWeightSync = await db.health_weight.findFirst({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      select: { recordedAt: true },
    });

    // Get workout data
    const weekWorkouts = await db.health_workout.findMany({
      where: {
        userId,
        startDate: {
          gte: weekStart,
        },
      },
    });

    type WorkoutType = (typeof weekWorkouts)[number];
    const totalWorkoutMinutes = weekWorkouts.reduce(
      (sum: number, workout: WorkoutType) => sum + workout.duration,
      0
    );

    const lastWorkoutSync = await db.health_workout.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    const summary = {
      steps: {
        today: todaySteps?.steps || 0,
        week: weekSteps._sum.steps || 0,
        lastSync: lastStepsSync?.updatedAt || null,
      },
      heartRate: {
        latest: latestHeartRate?.bpm || null,
        average: avgHeartRate._avg.bpm ? Math.round(avgHeartRate._avg.bpm) : null,
        lastSync: lastHRSync?.recordedAt || null,
      },
      activeCalories: {
        today: todayCalories?.calories || 0,
        week: weekCalories._sum.calories || 0,
        lastSync: lastCaloriesSync?.updatedAt || null,
      },
      weight: {
        latest: latestWeight?.weight ? latestWeight.weight.toNumber() : null,
        trend: weightTrend,
        lastSync: lastWeightSync?.recordedAt || null,
      },
      workouts: {
        count: weekWorkouts.length,
        totalMinutes: Math.round(totalWorkoutMinutes),
        lastSync: lastWorkoutSync?.createdAt || null,
      },
    };

    return NextResponse.json(summary);
  } catch (error: unknown) {
    logError('Internal server error', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
