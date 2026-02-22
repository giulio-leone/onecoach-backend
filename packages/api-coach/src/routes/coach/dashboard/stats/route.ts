/**
 * Coach Dashboard Stats API
 * GET /api/coach/dashboard/stats - Get coach dashboard statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, roleSatisfies } from '@giulio-leone/lib-core/auth';
import { coachService } from '@giulio-leone/lib-coach';
import { prisma } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

/**
 * GET /api/coach/dashboard/stats
 * Get coach dashboard statistics
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
      include: {
        coach_profile: true,
      },
    });

    if (!user || !roleSatisfies('COACH', user.role)) {
      return NextResponse.json({ error: 'Coach role required' }, { status: 403 });
    }

    if (!user.coach_profile) {
      return NextResponse.json({ error: 'Coach profile not found' }, { status: 404 });
    }

    // Update coach stats to ensure they're current
    const profile = await coachService.updateCoachStats(session.user.id);

    // Calculate total revenue from completed purchases
    const completedPurchases = await prisma.plan_purchases.findMany({
      where: {
        marketplace_plan: {
          coachId: session.user.id,
        },
        status: 'COMPLETED',
      },
      select: {
        coachCommission: true,
      },
    });

    type PurchaseType = (typeof completedPurchases)[number];
    const totalRevenue = completedPurchases.reduce(
      (sum: number, purchase: PurchaseType) => sum + Number(purchase.coachCommission),
      0
    );

    // Count total plans (published and unpublished)
    const totalPlans = await prisma.marketplace_plans.count({
      where: { coachId: session.user.id },
    });

    const publishedPlans = await prisma.marketplace_plans.count({
      where: {
        coachId: session.user.id,
        isPublished: true,
      },
    });

    return NextResponse.json({
      totalSales: profile.totalSales,
      totalRevenue,
      averageRating: profile.averageRating ? Number(profile.averageRating) : null,
      totalReviews: profile.totalReviews,
      totalPlans,
      publishedPlans,
      draftPlans: totalPlans - publishedPlans,
    });
  } catch (error: unknown) {
    logError('Internal server error', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
