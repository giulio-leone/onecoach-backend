/**
 * Coach Analytics Rating API
 * GET /api/coach/analytics/rating - Get rating trends for coach
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, roleSatisfies } from '@giulio-leone/lib-core/auth';
import { prisma } from '@giulio-leone/lib-core';
import { getRatingTrends, type Period } from '@giulio-leone/lib-analytics';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

/**
 * GET /api/coach/analytics/rating
 * Get rating trends for coach
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a coach
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !roleSatisfies('COACH', user.role)) {
      return NextResponse.json({ error: 'Coach role required' }, { status: 403 });
    }

    const { searchParams } = new URL(_request.url);
    const period = (searchParams.get('period') as Period) || '30d';

    const trends = await getRatingTrends(session.user.id, period);

    return NextResponse.json({ trends });
  } catch (error: unknown) {
    logError('Internal server error', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
