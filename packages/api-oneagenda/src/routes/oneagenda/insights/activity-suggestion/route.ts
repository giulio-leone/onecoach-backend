/**
 * Activity Suggestion API Route
 *
 * POST /api/oneagenda/insights/activity-suggestion - Get AI-powered activity suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@giulio-leone/lib-core/auth';
import { IntelligentAssistantService, TaskStatus } from '@giulio-leone/oneagenda-core';
import { oneagendaDB } from '@giulio-leone/oneagenda-core';
import { logger } from '@giulio-leone/lib-shared';

/**
 * POST /api/oneagenda/insights/activity-suggestion
 *
 * Body:
 * - timeAvailable: number (minutes)
 * - energyLevel: 'HIGH' | 'MEDIUM' | 'LOW'
 */
export async function POST(request: NextRequest) {
  let userId: string | undefined;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    userId = session.user.id;
    const body = await request.json();
    const { timeAvailable = 60, energyLevel = 'MEDIUM' } = body;

    // Validate energy level
    if (!['HIGH', 'MEDIUM', 'LOW'].includes(energyLevel)) {
      return NextResponse.json(
        { error: 'Invalid energyLevel. Must be HIGH, MEDIUM, or LOW' },
        { status: 400 }
      );
    }

    // Get recent tasks for context
    const recentTasks = await oneagendaDB.getTasks(userId, {
      status: TaskStatus.TODO,
    });

    // Create intelligent assistant
    const assistant = new IntelligentAssistantService();

    // Get activity suggestion
    const suggestion = await assistant.suggestNextActivity({
      userId,
      currentContext: {
        timeAvailable,
        energyLevel: energyLevel as 'HIGH' | 'MEDIUM' | 'LOW',
        recentTasks: recentTasks.slice(0, 10), // Last 10 tasks for context
      },
    });

    return NextResponse.json(suggestion);
  } catch (error: unknown) {
    logger.error('Error generating activity suggestion', {
      error,
      userId,
    });
    return NextResponse.json({ error: 'Failed to generate suggestion' }, { status: 500 });
  }
}
