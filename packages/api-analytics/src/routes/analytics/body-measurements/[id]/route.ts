/**
 * Body Measurement Detail API
 *
 * GET    /api/analytics/body-measurements/[id] - Get specific measurement
 * PUT    /api/analytics/body-measurements/[id] - Update measurement
 * DELETE /api/analytics/body-measurements/[id] - Delete measurement
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@giulio-leone/lib-core';
import {
  getBodyMeasurementById,
  updateBodyMeasurement,
  deleteBodyMeasurement,
} from '@giulio-leone/lib-analytics';
import type { UpdateBodyMeasurementInput } from '@giulio-leone/lib-analytics';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
type RouteParams = Promise<{ id: string }>;

const updateSchema = z.object({
  date: z.string().optional(),
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
 * GET /api/analytics/body-measurements/[id]
 */
export async function GET(
  _request: NextRequest,
  context: { params: RouteParams }
): Promise<NextResponse> {
  const params = await context.params;
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const measurement = await getBodyMeasurementById(params.id, userOrError.id);

    if (!measurement) {
      return NextResponse.json({ error: 'Measurement not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      measurement,
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Error fetching measurement';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/analytics/body-measurements/[id]
 */
export async function PUT(
  _request: NextRequest,
  context: { params: RouteParams }
): Promise<NextResponse> {
  const params = await context.params;
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const body = await _request.json();
    const validated = updateSchema.parse(body);

    const { date, ...rest } = validated;
    const updateData: UpdateBodyMeasurementInput = {
      ...rest,
      ...(date ? { date: new Date(date) } : {}),
    };
    const measurement = await updateBodyMeasurement(params.id, userOrError.id, updateData);

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

    const message = _error instanceof Error ? _error.message : 'Error updating measurement';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/analytics/body-measurements/[id]
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: RouteParams }
): Promise<NextResponse> {
  const params = await context.params;
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    await deleteBodyMeasurement(params.id, userOrError.id);

    return NextResponse.json({
      success: true,
      message: 'Measurement deleted successfully',
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Error deleting measurement';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
