/**
 * Public Coach Profile API
 * GET /api/coach/public/[userId] - Get public coach profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { coachService } from '@giulio-leone/lib-coach';
import { marketplaceService } from '@giulio-leone/lib-marketplace';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ userId: string }>;
};

/**
 * GET /api/coach/public/[userId]
 * Get public coach profile (no authentication required)
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await context.params;

    // Get public profile
    const profile = await coachService.getPublicProfile(userId);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found or not publicly visible' },
        { status: 404 }
      );
    }

    // Get published plans for this coach
    const plansResult = await marketplaceService.listPlans({
      coachId: userId,
      limit: 20,
      page: 1,
    });

    return NextResponse.json({
      profile,
      plans: plansResult.plans,
      totalPlans: plansResult.total,
    });
  } catch (error: unknown) {
    logError('Internal server error', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
