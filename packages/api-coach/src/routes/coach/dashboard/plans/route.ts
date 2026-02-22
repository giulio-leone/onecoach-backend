/**
 * Coach Dashboard Plans API
 * GET /api/coach/dashboard/plans - Get coach's plans with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, roleSatisfies } from '@giulio-leone/lib-core/auth';
import { prisma } from '@giulio-leone/lib-core';
import type { MarketplacePlanType } from '@giulio-leone/types';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

/**
 * GET /api/coach/dashboard/plans
 * Get coach's plans with filters
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

    // Parse filters
    const planType = searchParams.get('planType') as MarketplacePlanType | null;
    const isPublished = searchParams.get('isPublished');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      coachId: session.user.id,
      ...(planType && { planType }),
      ...(isPublished !== null && { isPublished: isPublished === 'true' }),
    };

    // Execute queries
    const [plans, total] = await Promise.all([
      prisma.marketplace_plans.findMany({
        where,
        include: {
          plan_ratings: {
            select: {
              rating: true,
            },
          },
          plan_purchases: {
            where: {
              status: 'COMPLETED',
            },
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.marketplace_plans.count({ where }),
    ]);

    type PlanType = (typeof plans)[number];
    type RatingType = (typeof plans)[number]['plan_ratings'][number];

    // Format response with statistics
    const formattedPlans = plans.map((plan: PlanType) => {
      const purchasesCount = plan.plan_purchases.length;
      const ratings = plan.plan_ratings.map((r: RatingType) => r.rating);
      const averageRating =
        ratings.length > 0
          ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
          : null;

      return {
        id: plan.id,
        title: plan.title,
        description: plan.description,
        planType: plan.planType,
        coverImage: plan.coverImage,
        price: Number(plan.price),
        currency: plan.currency,
        isPublished: plan.isPublished,
        createdAt: plan.createdAt,
        publishedAt: plan.publishedAt,
        totalPurchases: purchasesCount,
        averageRating,
        totalReviews: ratings.length,
        workoutProgramId: plan.workoutProgramId,
        nutritionPlanId: plan.nutritionPlanId,
      };
    });

    return NextResponse.json({
      plans: formattedPlans,
      total,
      page,
      limit,
      hasMore: skip + formattedPlans.length < total,
    });
  } catch (error: unknown) {
    logError('Internal server error', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
