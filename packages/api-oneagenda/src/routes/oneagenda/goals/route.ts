/**
 * Goals API Route
 *
 * GET /api/oneagenda/goals - List goals
 * POST /api/oneagenda/goals - Create goal
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@giulio-leone/lib-core/auth';
import { oneagendaDB } from '@giulio-leone/oneagenda-core';
import { logger } from '@giulio-leone/lib-shared';
import type { GoalStatus } from '@giulio-leone/oneagenda-core';

/**
 * GET /api/oneagenda/goals
 *
 * Query params:
 * - status?: GoalStatus
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      status: searchParams.get('status') as GoalStatus | undefined,
    };

    const goals = await oneagendaDB.getGoals(session.user.id, filters);

    return NextResponse.json(goals);
  } catch (error: unknown) {
    logger.error('Error fetching goals', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/oneagenda/goals
 *
 * Create a new goal
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const goal = await oneagendaDB.createGoal(session.user.id, body);

    return NextResponse.json(goal, { status: 201 });
  } catch (error: unknown) {
    logger.error('Error creating goal', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
