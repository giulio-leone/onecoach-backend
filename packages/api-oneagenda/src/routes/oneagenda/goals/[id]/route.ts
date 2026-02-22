/**
 * Goal Detail API Route
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
    const goal = await oneagendaDB.getGoal(id, session.user.id);

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json(goal);
  } catch (error: unknown) {
    logger.error('Error fetching goal', { error, goalId: (await context.params).id });
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
    await oneagendaDB.deleteGoal(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error deleting goal', { error, goalId: (await context.params).id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
