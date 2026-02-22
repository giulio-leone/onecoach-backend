/**
 * Marketplace Service
 *
 * CRUD operations for marketplace plans, purchases, and ratings
 * Implements SOLID principles (SRP, DIP)
 */
import type { MarketplacePlanType, PurchaseStatus, marketplace_plans, plan_purchases, plan_ratings } from '@prisma/client';
import type { MarketplacePlanDetails as ContractMarketplacePlanDetails } from '@giulio-leone/contracts';
/**
 * Interface for Marketplace Service
 */
export interface IMarketplaceService {
    createPlan(data: CreateMarketplacePlanInput): Promise<marketplace_plans>;
    updatePlan(planId: string, data: UpdateMarketplacePlanInput): Promise<marketplace_plans>;
    deletePlan(planId: string): Promise<void>;
    getPlan(planId: string): Promise<ContractMarketplacePlanDetails | null>;
    listPlans(filters: MarketplaceFilters): Promise<MarketplacePlanList>;
    publishPlan(planId: string): Promise<marketplace_plans>;
    unpublishPlan(planId: string): Promise<marketplace_plans>;
    createPurchase(data: CreatePurchaseInput): Promise<plan_purchases>;
    getPurchase(purchaseId: string): Promise<plan_purchases | null>;
    getUserPurchases(userId: string): Promise<plan_purchases[]>;
    updatePurchaseStatus(purchaseId: string, status: PurchaseStatus): Promise<plan_purchases>;
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
declare class MarketplaceService implements IMarketplaceService {
    /**
     * Create marketplace plan
     */
    createPlan(data: CreateMarketplacePlanInput): Promise<marketplace_plans>;
    /**
     * Update marketplace plan
     */
    updatePlan(planId: string, data: UpdateMarketplacePlanInput): Promise<marketplace_plans>;
    /**
     * Delete marketplace plan
     */
    deletePlan(planId: string): Promise<void>;
    /**
     * Get marketplace plan with details
     */
    getPlan(planId: string): Promise<ContractMarketplacePlanDetails | null>;
    /**
     * List marketplace plans with filters
     */
    listPlans(filters: MarketplaceFilters): Promise<MarketplacePlanList>;
    /**
     * Publish marketplace plan
     */
    publishPlan(planId: string): Promise<marketplace_plans>;
    /**
     * Unpublish marketplace plan
     */
    unpublishPlan(planId: string): Promise<marketplace_plans>;
    /**
     * Create purchase
     */
    createPurchase(data: CreatePurchaseInput): Promise<plan_purchases>;
    /**
     * Get purchase by ID
     */
    getPurchase(purchaseId: string): Promise<plan_purchases | null>;
    /**
     * Get user purchases
     */
    getUserPurchases(userId: string): Promise<plan_purchases[]>;
    /**
     * Update purchase status
     */
    updatePurchaseStatus(purchaseId: string, status: PurchaseStatus): Promise<plan_purchases>;
    /**
     * Rate a plan
     */
    ratePlan(data: RatePlanInput): Promise<plan_ratings>;
    /**
     * Get plan ratings
     */
    getPlanRatings(planId: string): Promise<plan_ratings[]>;
    /**
     * Update plan statistics (rating, reviews)
     */
    updatePlanStats(planId: string): Promise<marketplace_plans>;
}
/**
 * Export singleton instance
 */
export declare const marketplaceService: MarketplaceService;
export {};
//# sourceMappingURL=marketplace.service.d.ts.map