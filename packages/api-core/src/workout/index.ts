/**
 * @giulio-leone/api-workout
 *
 * API routes per il dominio workout
 */

import { getService } from '@giulio-leone/lib-core/registry';
import type { NextRequest } from 'next/server';

/**
 * GET /api/workout
 */
export async function GET(_request: NextRequest) {
  try {
    const workoutService = getService('workout');
    const result = await workoutService.getAll();

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json(result.data);
  } catch (error: unknown) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workout
 */
export async function POST(request: NextRequest) {
  try {
    const workoutService = getService('workout');
    const body = await request.json();

    const result = await workoutService.create(body);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json(result.data, { status: 201 });
  } catch (error: unknown) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
