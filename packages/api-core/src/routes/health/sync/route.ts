import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@giulio-leone/lib-core/auth/config';
import { prisma as db } from '@giulio-leone/lib-core';
import { logError, getErrorMessage, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

/**
 * POST /api/health/sync
 * Sync health data from mobile device
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, platform, dataRequests, syncTimestamp } = body;

    // Verify userId matches session
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'User mismatch' }, { status: 403 });
    }

    const syncedDataTypes: string[] = [];
    const errors: string[] = [];

    // Process each data type
    for (const dataRequest of dataRequests) {
      const { dataType, data } = dataRequest;

      try {
        switch (dataType) {
          case 'steps':
            await syncStepsData(userId, data);
            syncedDataTypes.push('steps');
            break;

          case 'heartRate':
            await syncHeartRateData(userId, data);
            syncedDataTypes.push('heartRate');
            break;

          case 'activeCalories':
            await syncActiveCaloriesData(userId, data);
            syncedDataTypes.push('activeCalories');
            break;

          case 'weight':
            await syncWeightData(userId, data);
            syncedDataTypes.push('weight');
            break;

          case 'workout':
            await syncWorkoutData(userId, data);
            syncedDataTypes.push('workout');
            break;

          default:
            errors.push(`Unknown data type: ${dataType}`);
        }
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error);
        errors.push(`Error syncing ${dataType}: ${errorMessage}`);
      }
    }

    // Update last sync time
    await db.users.update({
      where: { id: userId },
      data: {
        healthLastSync: new Date(syncTimestamp),
        healthPlatform: platform.toUpperCase(),
      },
    });

    return NextResponse.json({
      success: errors.length === 0,
      syncedDataTypes,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: unknown) {
    logError('Internal server error', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

interface StepsDataItem {
  value: number;
  startDate: string;
  endDate: string;
  source?: string;
}

async function syncStepsData(userId: string, data: StepsDataItem[]) {
  if (!data || data.length === 0) return;

  for (const item of data) {
    const { value, startDate, endDate, source } = item;

    await db.health_steps.create({
      data: {
        userId,
        steps: value,
        date: new Date(startDate),
        endDate: new Date(endDate),
        source: source || 'unknown',
        updatedAt: new Date(),
      },
    });
  }
}

interface HeartRateDataItem {
  value: number;
  date: string;
  source?: string;
}

async function syncHeartRateData(userId: string, data: HeartRateDataItem[]) {
  if (!data || data.length === 0) return;

  // Keep only latest readings (limit to prevent DB bloat)
  const recentData = data.slice(-100);

  for (const item of recentData) {
    const { value, date, source } = item;

    await db.health_heart_rate.create({
      data: {
        userId,
        bpm: value,
        recordedAt: new Date(date),
        source: source || 'unknown',
      },
    });
  }
}

async function syncActiveCaloriesData(userId: string, data: StepsDataItem[]) {
  if (!data || data.length === 0) return;

  for (const item of data) {
    const { value, startDate, endDate, source } = item;

    await db.health_active_calories.create({
      data: {
        userId,
        calories: value,
        date: new Date(startDate),
        endDate: new Date(endDate),
        source: source || 'unknown',
        updatedAt: new Date(),
      },
    });
  }
}

async function syncWeightData(userId: string, data: HeartRateDataItem[]) {
  if (!data || data.length === 0) return;

  for (const item of data) {
    const { value, date, source } = item;

    await db.health_weight.create({
      data: {
        userId,
        weight: value,
        recordedAt: new Date(date),
        source: source || 'unknown',
      },
    });
  }
}

interface WorkoutDataItem {
  activityType: string;
  duration: number;
  distance?: number;
  calories?: number;
  startDate: string;
  endDate: string;
  source?: string;
}

async function syncWorkoutData(userId: string, data: WorkoutDataItem[]) {
  if (!data || data.length === 0) return;

  for (const item of data) {
    const { activityType, duration, distance, calories, startDate, endDate, source } = item;

    await db.health_workout.create({
      data: {
        userId,
        activityType,
        duration,
        distance: distance || null,
        calories: calories || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        source: source || 'unknown',
      },
    });
  }
}
