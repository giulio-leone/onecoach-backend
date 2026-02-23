/**
 * Task Detail API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@giulio-leone/lib-core/auth';
import { oneagendaDB } from '@giulio-leone/oneagenda-core';
import { logger } from '@giulio-leone/lib-shared';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  void request;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await context.params;
    const task = await oneagendaDB.getTask(id, session.user.id);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error: unknown) {
    logger.error('Error fetching task', { error, taskId: (await context.params).id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await context.params;
    const body = await request.json();

    const updatedTask = await oneagendaDB.updateTask(id, session.user.id, body);

    return NextResponse.json(updatedTask);
  } catch (error: unknown) {
    logger.error('Error updating task', { error, taskId: (await context.params).id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  void request;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await context.params;

    await oneagendaDB.deleteTask(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error deleting task', { error, taskId: (await context.params).id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
