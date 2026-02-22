/**
 * Tasks API Route
 *
 * GET /api/oneagenda/tasks - List tasks
 * POST /api/oneagenda/tasks - Create task
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@giulio-leone/lib-core/auth';
import { oneagendaDB } from '@giulio-leone/oneagenda-core';
import { logger } from '@giulio-leone/lib-shared';
import type { TaskStatus, TaskPriority } from '@giulio-leone/oneagenda-core';

/**
 * GET /api/oneagenda/tasks
 *
 * Query params:
 * - status?: TaskStatus
 * - priority?: TaskPriority
 * - tags?: string (comma-separated)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      status: searchParams.get('status') as TaskStatus | undefined,
      priority: searchParams.get('priority') as TaskPriority | undefined,
      tags: searchParams.get('tags')?.split(','),
      goalId: searchParams.get('goalId') || undefined,
    };

    const tasks = await oneagendaDB.getTasks(session.user.id, filters);

    return NextResponse.json(tasks);
  } catch (error: unknown) {
    logger.error('Error fetching tasks', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/oneagenda/tasks
 *
 * Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const task = await oneagendaDB.createTask(session.user.id, body);

    return NextResponse.json(task, { status: 201 });
  } catch (error: unknown) {
    logger.error('Error creating task', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
