/**
 * Insights API Route
 *
 * GET /api/oneagenda/insights - Get user insights and analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@giulio-leone/lib-core/auth';
import { IntelligentAssistantService, type Milestone } from '@giulio-leone/oneagenda-core';
import { oneagendaDB } from '@giulio-leone/oneagenda-core';
import { logger } from '@giulio-leone/lib-shared';

const assistant = new IntelligentAssistantService();

/**
 * GET /api/oneagenda/insights
 * Get user insights and analytics
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const periodStart = searchParams.get('periodStart');
    const periodEnd = searchParams.get('periodEnd');

    const start = periodStart
      ? new Date(periodStart)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = periodEnd ? new Date(periodEnd) : new Date();

    // Fetch user data
    const tasks = await oneagendaDB.getTasks(session.user.id);
    const goals = await oneagendaDB.getGoals(session.user.id);

    // Milestones persistence is not aligned with the domain model yet.
    // For now, provide an empty list and let the assistant compute insights from tasks/goals.
    const milestones: Milestone[] = [];

    // Generate insights using Reflection Agent
    const insights = await assistant.trackProgress({
      userId: session.user.id,
      tasks,
      goals,
      milestones,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
    });

    return NextResponse.json(insights);
  } catch (error: unknown) {
    logger.error('Get insights error', { error, userId: session.user.id });
    return NextResponse.json({ error: 'Failed to get insights' }, { status: 500 });
  }
}
