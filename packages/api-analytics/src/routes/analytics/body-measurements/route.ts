/**
 * Body Measurements API
 *
 * GET  /api/analytics/body-measurements - Get measurement history
 * POST /api/analytics/body-measurements - Create new measurement
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@giulio-leone/lib-core';
import {
  createBodyMeasurement,
  getBodyMeasurementHistory,
  getLatestBodyMeasurement,
  getBodyMeasurementStats,
} from '@giulio-leone/lib-analytics';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().optional(),
  latest: z.string().optional(),
});

const createSchema = z.object({
  date: z.string(),
  weight: z.number().optional(),
  bodyFat: z.number().optional(),
  muscleMass: z.number().optional(),
  chest: z.number().optional(),
  waist: z.number().optional(),
  hips: z.number().optional(),
  thigh: z.number().optional(),
  arm: z.number().optional(),
  calf: z.number().optional(),
  neck: z.number().optional(),
  shoulders: z.number().optional(),
  notes: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

/**
 * GET /api/analytics/body-measurements
 *
 * Get body measurement history.
 *
 * Query params:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - limit: number of results (optional)
 * - latest: 'true' to get only the latest measurement
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const { searchParams } = new URL(_request.url);
    const query = querySchema.parse({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') || undefined,
      latest: searchParams.get('latest') || undefined,
    });

    // If latest requested, return only the latest measurement
    if (query.latest === 'true') {
      const measurement = await getLatestBodyMeasurement((userOrError as { id: string }).id);
      return NextResponse.json({
        success: true,
        measurement,
      });
    }

    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    const limit = query.limit ? parseInt(query.limit, 10) : undefined;

    const measurements = await getBodyMeasurementHistory((userOrError as { id: string }).id, startDate, endDate, limit);

    // Include stats if date range is provided
    let stats = null;
    if (startDate && endDate) {
      stats = await getBodyMeasurementStats((userOrError as { id: string }).id, startDate, endDate);
    }

    return NextResponse.json({
      success: true,
      measurements,
      stats,
    });
  } catch (_error: unknown) {
    if (_error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: _error.issues },
        { status: 400 }
      );
    }

    const message = _error instanceof Error ? _error.message : 'Error fetching measurements';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/analytics/body-measurements
 *
 * Create a new body measurement.
 */
export async function POST(_request: NextRequest): Promise<NextResponse> {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const body = await _request.json();
    const validated = createSchema.parse(body);

    const measurement = await createBodyMeasurement((userOrError as { id: string }).id, {
      ...validated,
      date: new Date(validated.date),
    });

    return NextResponse.json({
      success: true,
      measurement,
    });
  } catch (_error: unknown) {
    if (_error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: _error.issues },
        { status: 400 }
      );
    }

    const message = _error instanceof Error ? _error.message : 'Error creating measurement';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
