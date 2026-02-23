/**
 * Coach Query Keys and Functions
 *
 * Standardized query keys and query functions for coach-related queries
 */
import type { PublicCoachProfileResponse } from '../coach';
import type { MarketplacePlanType } from '@giulio-leone/types';
/**
 * MarketplacePlanCardProps - aligned with CoachPlanCardProps in UI
 */
export interface MarketplacePlanCardProps {
  id: string;
  title: string;
  description: string;
  planType: MarketplacePlanType;
  coverImage?: string | null;
  price: number;
  currency: string;
  isPublished: boolean;
  totalPurchases: number;
  averageRating: number | null;
  totalReviews: number;
  createdAt: Date | string;
}
export interface CoachDashboardPlansFilters {
  planType?: MarketplacePlanType;
  isPublished?: boolean;
  page?: number;
  limit?: number;
}
export interface CoachDashboardPlansResponse {
  plans: MarketplacePlanCardProps[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
export interface CoachClient {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  programsPurchased: number;
  lastActive: Date | null;
  totalSpent: number;
  purchases: Array<{
    id: string;
    planTitle: string;
    planType: string;
    purchasedAt: Date;
    price: number;
  }>;
}
export interface CoachClientsResponse {
  clients: CoachClient[];
  total: number;
}
export interface CoachClientsFilters {
  search?: string;
  sortBy?: 'name' | 'totalSpent' | 'programsPurchased' | 'lastActive';
  sortOrder?: 'asc' | 'desc';
}
/**
 * Query keys for coach queries
 */
export declare const coachKeys: {
  readonly all: readonly ['coach'];
  readonly profile: () => readonly ['coach', 'profile'];
  readonly publicProfile: (userId: string) => readonly ['coach', 'public', string];
  readonly dashboardStats: () => readonly ['coach', 'dashboard', 'stats'];
  readonly dashboardPlans: (
    filters?: CoachDashboardPlansFilters
  ) => readonly ['coach', 'dashboard', 'plans', CoachDashboardPlansFilters | undefined];
  readonly clients: (
    filters?: CoachClientsFilters
  ) => readonly ['coach', 'clients', CoachClientsFilters | undefined];
};
/**
 * Query functions for coach
 */
export declare const coachQueries: {
  /**
   * Get public coach profile
   */
  getPublicProfile: (userId: string) => Promise<PublicCoachProfileResponse>;
  /**
   * Get coach dashboard stats
   */
  getDashboardStats: () => Promise<unknown>;
  /**
   * Get coach dashboard plans with filters
   */
  getDashboardPlans: (filters?: CoachDashboardPlansFilters) => Promise<CoachDashboardPlansResponse>;
  /**
   * Get coach's clients
   */
  getClients: (filters?: CoachClientsFilters) => Promise<CoachClientsResponse>;
};
//# sourceMappingURL=coach.queries.d.ts.map
