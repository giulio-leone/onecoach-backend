/**
 * Schedule API Route
 *
 * POST /api/oneagenda/schedule - Generate daily schedule
 * GET /api/oneagenda/schedule - Get daily schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@giulio-leone/lib-core/auth';
import { IntelligentAssistantService, type CalendarEvent, type Task } from '@giulio-leone/oneagenda-core';
import { oneagendaDB } from '@giulio-leone/oneagenda-core';
import { logger } from '@giulio-leone/lib-shared';

/**
 * POST /api/oneagenda/schedule
 *
 * Body:
 * - date: string (ISO date)
 * - tasks?: Task[]
 * - events?: CalendarEvent[]
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  let requestedDate: string | undefined;

  try {
    const body = (await request.json()) as {
      date?: string;
      tasks?: unknown[];
      events?: unknown[];
    };

    requestedDate = body.date;
    const tasks = (Array.isArray(body.tasks) ? body.tasks : []) as Task[];
    const events = (Array.isArray(body.events) ? body.events : []) as CalendarEvent[];

    // Validate required fields
    if (!requestedDate) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Create intelligent assistant
    const assistant = new IntelligentAssistantService();

    // Get user preferences (for future use)
    // If no tasks provided, fetch from database
    const tasksToUse = tasks.length > 0 ? tasks : await oneagendaDB.getTasks(userId);

    // Generate schedule
    const scheduleResult = await assistant.planDay({
      userId,
      date: requestedDate,
      tasks: tasksToUse,
      events,
    });

    // Return schedule in the format expected by the UI
    return NextResponse.json({
      date: scheduleResult.schedule.date,
      blocks: scheduleResult.schedule.blocks,
    });
  } catch (error: unknown) {
    logger.error('Error generating schedule', { error, userId, date: requestedDate });
    // Return empty schedule instead of error to allow UI to render
    return NextResponse.json({
      date: requestedDate ?? new Date().toISOString().split('T')[0],
      blocks: [],
    });
  }
}

/**
 * GET /api/oneagenda/schedule
 *
 * Query params:
 * - date: string (ISO date)
 */
export async function GET(request: NextRequest) {
  // Keep searchParams available in the whole scope (including catch) to avoid ReferenceError
  const searchParams = request.nextUrl.searchParams;
  const requestedDate = searchParams.get('date');
  const fallbackDate = requestedDate || new Date().toISOString().split('T')[0];

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const date = requestedDate;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Fetch tasks and events from database
    const tasks = await oneagendaDB.getTasks(session.user.id);

    // Calendar events persistence is not available in the agenda schema yet.
    // Provide empty events for now.
    const events: CalendarEvent[] = [];

    // If no tasks, return empty schedule immediately
    if (tasks.length === 0) {
      return NextResponse.json({
        date,
        blocks: [],
      });
    }

    // Get user preferences (optional, will use defaults if not available, reserved for future use)
    // Create intelligent assistant
    const assistant = new IntelligentAssistantService();

    // Generate schedule
    const scheduleResult = await assistant.planDay({
      userId: session.user.id,
      date,
      tasks,
      events,
    });

    // Return schedule in the format expected by the UI
    return NextResponse.json({
      date: scheduleResult.schedule.date,
      blocks: scheduleResult.schedule.blocks,
    });
  } catch (error: unknown) {
    logger.error('Error fetching schedule', { error });
    // Return empty schedule instead of error to allow UI to render
    return NextResponse.json({
      date: fallbackDate,
      blocks: [],
    });
  }
}
