/**
 * Coach Analytics Service
 *
 * Analytics calculations for coach dashboard
 * Implements SOLID principles (SRP)
 */

import { prisma } from '@giulio-leone/lib-core';

export type Period = '7d' | '30d' | '90d' | '1y';

export interface SalesTrendPoint {
  date: string;
  sales: number;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
}

export interface RatingTrendPoint {
  date: string;
  rating: number | null;
  reviews: number;
}

export interface TopPlan {
  planId: string;
  title: string;
  planType: 'WORKOUT' | 'NUTRITION';
  sales: number;
  revenue: number;
  averageRating: number | null;
}

/**
 * Calculate date range from period
 */
function getDateRange(period: Period): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();
  const daysAgo = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  }[period];

  startDate.setDate(startDate.getDate() - daysAgo);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

/**
 * Group data by date based on period
 */
function groupByDate(period: Period): 'day' | 'week' | 'month' {
  if (period === '7d') return 'day';
  if (period === '30d') return 'day';
  if (period === '90d') return 'week';
  return 'month';
}

/**
 * Format date for grouping
 */
function formatDateForGroup(date: Date, groupBy: 'day' | 'week' | 'month'): string {
  if (groupBy === 'day') {
    const dateStr = date.toISOString().split('T')[0];
    return dateStr || '';
  }
  if (groupBy === 'week') {
    const week = getWeek(date);
    return `${date.getFullYear()}-W${week}`;
  }
  // month
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get week number
 */
function getWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get sales trends for a coach
 */
export async function getSalesTrends(
  userId: string,
  period: Period = '30d'
): Promise<SalesTrendPoint[]> {
  const { startDate, endDate } = getDateRange(period);
  const groupBy = groupByDate(period);

  // Get all completed purchases for coach's plans
  const purchases = await prisma.plan_purchases.findMany({
    where: {
      marketplace_plan: {
        coachId: userId,
      },
      status: 'COMPLETED',
      purchasedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      purchasedAt: true,
    },
    orderBy: {
      purchasedAt: 'asc',
    },
  });

  // Group by date
  const grouped = new Map<string, number>();
  for (const purchase of purchases) {
    const dateKey = formatDateForGroup(purchase.purchasedAt, groupBy);
    grouped.set(dateKey, (grouped.get(dateKey) || 0) + 1);
  }

  // Convert to array and fill gaps
  const result: SalesTrendPoint[] = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    const dateKey = formatDateForGroup(currentDate, groupBy);
    result.push({
      date: dateKey,
      sales: grouped.get(dateKey) || 0,
    });

    if (groupBy === 'day') {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (groupBy === 'week') {
      currentDate.setDate(currentDate.getDate() + 7);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  return result;
}

/**
 * Get revenue trends for a coach
 */
export async function getRevenueTrends(
  userId: string,
  period: Period = '30d'
): Promise<RevenueTrendPoint[]> {
  const { startDate, endDate } = getDateRange(period);
  const groupBy = groupByDate(period);

  // Get all completed purchases for coach's plans
  const purchases = await prisma.plan_purchases.findMany({
    where: {
      marketplace_plan: {
        coachId: userId,
      },
      status: 'COMPLETED',
      purchasedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      purchasedAt: true,
      coachCommission: true,
    },
    orderBy: {
      purchasedAt: 'asc',
    },
  });

  // Group by date
  const grouped = new Map<string, number>();
  for (const purchase of purchases) {
    const dateKey = formatDateForGroup(purchase.purchasedAt, groupBy);
    const current = grouped.get(dateKey) || 0;
    grouped.set(dateKey, current + Number(purchase.coachCommission));
  }

  // Convert to array and fill gaps
  const result: RevenueTrendPoint[] = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    const dateKey = formatDateForGroup(currentDate, groupBy);
    result.push({
      date: dateKey,
      revenue: grouped.get(dateKey) || 0,
    });

    if (groupBy === 'day') {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (groupBy === 'week') {
      currentDate.setDate(currentDate.getDate() + 7);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  return result;
}

/**
 * Get rating trends for a coach
 */
export async function getRatingTrends(
  userId: string,
  period: Period = '30d'
): Promise<RatingTrendPoint[]> {
  const { startDate, endDate } = getDateRange(period);
  const groupBy = groupByDate(period);

  // Get all ratings for coach's plans
  const ratings = await prisma.plan_ratings.findMany({
    where: {
      marketplace_plan: {
        coachId: userId,
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      rating: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Group by date
  const grouped = new Map<string, { ratings: number[]; count: number }>();
  ratings.forEach((rating) => {
    const dateKey = formatDateForGroup(rating.createdAt, groupBy);
    const existing = grouped.get(dateKey) || { ratings: [], count: 0 };
    existing.ratings.push(rating.rating);
    existing.count += 1;
    grouped.set(dateKey, existing);
  });

  // Convert to array and fill gaps
  const result: RatingTrendPoint[] = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    const dateKey = formatDateForGroup(currentDate, groupBy);
    const group = grouped.get(dateKey);
    const avgRating =
      group && group.ratings.length > 0
        ? group.ratings.reduce((sum: number, r: number) => sum + r, 0) / group.ratings.length
        : null;

    result.push({
      date: dateKey,
      rating: avgRating,
      reviews: group?.count || 0,
    });

    if (groupBy === 'day') {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (groupBy === 'week') {
      currentDate.setDate(currentDate.getDate() + 7);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  return result;
}

/**
 * Get top plans by sales
 */
export async function getTopPlans(userId: string, limit: number = 5): Promise<TopPlan[]> {
  const plans = await prisma.marketplace_plans.findMany({
    where: {
      coachId: userId,
    },
    include: {
      plan_purchases: {
        where: {
          status: 'COMPLETED',
        },
        select: {
          coachCommission: true,
        },
      },
      plan_ratings: {
        select: {
          rating: true,
        },
      },
    },
  });

  // Calculate stats for each plan
  const plansWithStats = plans.map((plan) => {
    const sales = plan.plan_purchases.length;
    const revenue = plan.plan_purchases.reduce(
      (sum: number, p: { coachCommission: unknown }) => sum + Number(p.coachCommission),
      0
    );
    const ratings = plan.plan_ratings.map((r) => r.rating);
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
        : null;

    return {
      planId: plan.id,
      title: plan.title,
      planType: plan.planType,
      sales,
      revenue,
      averageRating,
    };
  });

  // Sort by sales descending
  plansWithStats.sort((a, b) => b.sales - a.sales);

  return plansWithStats.slice(0, limit);
}
