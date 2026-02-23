/**
 * Marketplace Service
 *
 * CRUD operations for marketplace plans, purchases, and ratings
 * Implements SOLID principles (SRP, DIP)
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@giulio-leone/lib-core';
import type {
  MarketplacePlanType,
  PurchaseStatus,
  marketplace_plans,
  plan_purchases,
  plan_ratings,
} from '@prisma/client';
import type { MarketplacePlanDetails as ContractMarketplacePlanDetails } from '@giulio-leone/lib-shared';

/**
 * Interface for Marketplace Service
 */
export interface IMarketplaceService {
  // Plans
  createPlan(data: CreateMarketplacePlanInput): Promise<marketplace_plans>;
  updatePlan(planId: string, data: UpdateMarketplacePlanInput): Promise<marketplace_plans>;
  deletePlan(planId: string): Promise<void>;
  getPlan(planId: string): Promise<ContractMarketplacePlanDetails | null>;
  listPlans(filters: MarketplaceFilters): Promise<MarketplacePlanList>;
  publishPlan(planId: string): Promise<marketplace_plans>;
  unpublishPlan(planId: string): Promise<marketplace_plans>;

  // Purchases
  createPurchase(data: CreatePurchaseInput): Promise<plan_purchases>;
  getPurchase(purchaseId: string): Promise<plan_purchases | null>;
  getUserPurchases(userId: string): Promise<plan_purchases[]>;
  updatePurchaseStatus(purchaseId: string, status: PurchaseStatus): Promise<plan_purchases>;

  // Ratings
  ratePlan(data: RatePlanInput): Promise<plan_ratings>;
  getPlanRatings(planId: string): Promise<plan_ratings[]>;
  updatePlanStats(planId: string): Promise<marketplace_plans>;
}

/**
 * Input types
 */
export interface CreateMarketplacePlanInput {
  coachId: string;
  planType: MarketplacePlanType;
  workoutProgramId?: string;
  nutritionPlanId?: string;
  title: string;
  description: string;
  coverImage?: string;
  price: number;
  currency?: string;
}

export interface UpdateMarketplacePlanInput {
  title?: string;
  description?: string;
  coverImage?: string;
  price?: number;
  currency?: string;
}

export interface MarketplaceFilters {
  planType?: MarketplacePlanType;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  coachId?: string;
  searchQuery?: string;
  sortBy?: 'rating' | 'price' | 'recent' | 'popular';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreatePurchaseInput {
  userId: string;
  marketplacePlanId: string;
  price: number;
  currency: string;
  stripePaymentId?: string;
}

export interface RatePlanInput {
  userId: string;
  marketplacePlanId: string;
  rating: number;
  review?: string;
}

// Internal interface for extended plan details (includes extra fields for UI)
export interface MarketplacePlanDetails extends marketplace_plans {
  coach: {
    userId: string;
    name: string | null;
    image: string | null;
    coach_profile: {
      bio: string | null;
      verificationStatus: string;
      averageRating: number | null;
      totalReviews: number;
    } | null;
  };
  workout_program?: {
    name: string;
    description: string;
    difficulty: string;
    durationWeeks: number;
  };
  nutrition_plan?: {
    name: string;
    description: string;
    durationWeeks: number;
  };
}

export interface MarketplacePlanList {
  plans: ContractMarketplacePlanDetails[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Implementation Marketplace Service
 */
class MarketplaceService implements IMarketplaceService {
  /**
   * Create marketplace plan
   */
  async createPlan(data: CreateMarketplacePlanInput): Promise<marketplace_plans> {
    return await prisma.marketplace_plans.create({
      data: {
        ...data,
        currency: data.currency || 'EUR',
        isPublished: false,
        totalPurchases: 0,
        totalReviews: 0,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Update marketplace plan
   */
  async updatePlan(planId: string, data: UpdateMarketplacePlanInput): Promise<marketplace_plans> {
    return await prisma.marketplace_plans.update({
      where: { id: planId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete marketplace plan
   */
  async deletePlan(planId: string): Promise<void> {
    await prisma.marketplace_plans.delete({
      where: { id: planId },
    });
  }

  /**
   * Get marketplace plan with details
   */
  async getPlan(planId: string): Promise<ContractMarketplacePlanDetails | null> {
    const plan = await prisma.marketplace_plans.findUnique({
      where: { id: planId },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            image: true,
            coach_profile: {
              select: {
                bio: true,
                verificationStatus: true,
                averageRating: true,
                totalReviews: true,
              },
            },
          },
        },
        workout_program: {
          select: {
            name: true,
            description: true,
            difficulty: true,
            durationWeeks: true,
          },
        },
        nutrition_plan: {
          select: {
            name: true,
            description: true,
            durationWeeks: true,
          },
        },
      },
    });

    if (!plan) return null;

    // Map to contract format: coach.id and coach.userId are both users.id
    return {
      ...plan,
      coach: plan.coach
        ? {
            id: plan.coach.id,
            userId: plan.coach.id, // coach.id is users.id
            name: plan.coach.name,
            image: plan.coach.image,
            bio: plan.coach.coach_profile?.bio || null,
          }
        : undefined,
    } as ContractMarketplacePlanDetails;
  }

  /**
   * List marketplace plans with filters
   */
  async listPlans(filters: MarketplaceFilters): Promise<MarketplacePlanList> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.marketplace_plansWhereInput = { isPublished: true };

    if (filters.planType) {
      where.planType = filters.planType;
    }

    if (filters.coachId) {
      where.coachId = filters.coachId;
    }

    if (filters.minPrice || filters.maxPrice) {
      where.price = {
        ...(filters.minPrice ? { gte: filters.minPrice } : {}),
        ...(filters.maxPrice ? { lte: filters.maxPrice } : {}),
      };
    }

    if (filters.minRating) {
      where.averageRating = { gte: filters.minRating };
    }

    if (filters.searchQuery) {
      where.OR = [
        { title: { contains: filters.searchQuery, mode: 'insensitive' } },
        { description: { contains: filters.searchQuery, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause
    let orderBy: Prisma.marketplace_plansOrderByWithRelationInput = { createdAt: 'desc' };
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'rating':
          orderBy = { averageRating: filters.sortOrder || 'desc' };
          break;
        case 'price':
          orderBy = { price: filters.sortOrder || 'asc' };
          break;
        case 'popular':
          orderBy = { totalPurchases: 'desc' };
          break;
        case 'recent':
          orderBy = { publishedAt: 'desc' };
          break;
      }
    }

    // Execute queries
    const [plans, total] = await Promise.all([
      prisma.marketplace_plans.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          coach: {
            select: {
              id: true,
              name: true,
              image: true,
              coach_profile: {
                select: {
                  bio: true,
                  verificationStatus: true,
                },
              },
            },
          },
        },
      }),
      prisma.marketplace_plans.count({ where }),
    ]);

    // Map plans to contract format
    const mappedPlans: ContractMarketplacePlanDetails[] = plans.map((plan) => ({
      ...plan,
      coach: plan.coach
        ? {
            id: plan.coach.id,
            userId: plan.coach.id, // coach.id is users.id
            name: plan.coach.name,
            image: plan.coach.image,
            bio: plan.coach.coach_profile?.bio || null,
          }
        : undefined,
    }));

    return {
      plans: mappedPlans,
      total,
      page,
      limit,
      hasMore: skip + plans.length < total,
    };
  }

  /**
   * Publish marketplace plan
   */
  async publishPlan(planId: string): Promise<marketplace_plans> {
    return await prisma.marketplace_plans.update({
      where: { id: planId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Unpublish marketplace plan
   */
  async unpublishPlan(planId: string): Promise<marketplace_plans> {
    return await prisma.marketplace_plans.update({
      where: { id: planId },
      data: {
        isPublished: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Create purchase
   */
  async createPurchase(data: CreatePurchaseInput): Promise<plan_purchases> {
    // Get plan details for commission calculation
    const plan = await prisma.marketplace_plans.findUnique({
      where: { id: data.marketplacePlanId },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    // Calculate commission split (70% coach, 30% platform)
    const coachCommission = Number(plan.price) * 0.7;
    const platformCommission = Number(plan.price) * 0.3;

    return await prisma.plan_purchases.create({
      data: {
        ...data,
        coachCommission,
        platformCommission,
        status: 'PENDING',
      },
    });
  }

  /**
   * Get purchase by ID
   */
  async getPurchase(purchaseId: string): Promise<plan_purchases | null> {
    return await prisma.plan_purchases.findUnique({
      where: { id: purchaseId },
    });
  }

  /**
   * Get user purchases
   */
  async getUserPurchases(userId: string): Promise<plan_purchases[]> {
    return await prisma.plan_purchases.findMany({
      where: { userId },
      orderBy: { purchasedAt: 'desc' },
    });
  }

  /**
   * Update purchase status
   */
  async updatePurchaseStatus(purchaseId: string, status: PurchaseStatus): Promise<plan_purchases> {
    const purchase = await prisma.plan_purchases.update({
      where: { id: purchaseId },
      data: { status },
    });

    // If completed, increment plan purchase count
    if (status === 'COMPLETED') {
      await prisma.marketplace_plans.update({
        where: { id: purchase.marketplacePlanId },
        data: {
          totalPurchases: { increment: 1 },
        },
      });
    }

    return purchase;
  }

  /**
   * Rate a plan
   */
  async ratePlan(data: RatePlanInput): Promise<plan_ratings> {
    const rating = await prisma.plan_ratings.upsert({
      where: {
        userId_marketplacePlanId: {
          userId: data.userId,
          marketplacePlanId: data.marketplacePlanId,
        },
      } as Prisma.plan_ratingsWhereUniqueInput,
      update: {
        rating: data.rating,
        review: data.review,
        updatedAt: new Date(),
      },
      create: {
        ...data,
        updatedAt: new Date(),
      },
    });

    // Update plan statistics
    await this.updatePlanStats(data.marketplacePlanId);

    return rating;
  }

  /**
   * Get plan ratings
   */
  async getPlanRatings(planId: string): Promise<plan_ratings[]> {
    return await prisma.plan_ratings.findMany({
      where: { marketplacePlanId: planId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update plan statistics (rating, reviews)
   */
  async updatePlanStats(planId: string): Promise<marketplace_plans> {
    const ratings = await prisma.plan_ratings.findMany({
      where: { marketplacePlanId: planId },
    });

    const totalReviews = ratings.length;
    const averageRating =
      totalReviews > 0
        ? ratings.reduce((sum: number, r: plan_ratings) => sum + r.rating, 0) / totalReviews
        : null;

    return await prisma.marketplace_plans.update({
      where: { id: planId },
      data: {
        averageRating,
        totalReviews,
        updatedAt: new Date(),
      },
    });
  }
}

/**
 * Export singleton instance
 */
export const marketplaceService = new MarketplaceService();
