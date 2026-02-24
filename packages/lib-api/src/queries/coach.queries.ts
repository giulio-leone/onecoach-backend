/**
 * Coach Query Keys and Functions
 *
 * Standardized query keys and query functions for coach-related queries
 */

import type { PublicCoachProfileResponse } from '../coach';
// MarketplacePlanCardProps type - using inline type for now
type MarketplacePlanCardProps = {
  id: string;
  name: string;
  description: string;
  planType: MarketplacePlanType;
  isPublished: boolean;
  [key: string]: unknown;
};
import type { MarketplacePlanType } from '@giulio-leone/types/database';

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
export const coachKeys = {
  all: ['coach'] as const,
  profile: () => [...coachKeys.all, 'profile'] as const,
  publicProfile: (userId: string) => [...coachKeys.all, 'public', userId] as const,
  dashboardStats: () => [...coachKeys.all, 'dashboard', 'stats'] as const,
  dashboardPlans: (filters?: CoachDashboardPlansFilters) =>
    [...coachKeys.all, 'dashboard', 'plans', filters] as const,
  clients: (filters?: CoachClientsFilters) => [...coachKeys.all, 'clients', filters] as const,
} as const;

/**
 * Query functions for coach
 */
export const coachQueries = {
  /**
   * Get public coach profile
   */
  getPublicProfile: async (userId: string): Promise<PublicCoachProfileResponse> => {
    const response = await fetch(`/api/coach/public/${userId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Profilo non trovato o non pubblicamente visibile');
      }
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch coach profile');
    }

    return response.json();
  },

  /**
   * Get coach dashboard stats
   */
  getDashboardStats: async () => {
    const response = await fetch('/api/coach/dashboard/stats', {
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch dashboard stats');
    }

    return response.json();
  },

  /**
   * Get coach dashboard plans with filters
   */
  getDashboardPlans: async (
    filters?: CoachDashboardPlansFilters
  ): Promise<CoachDashboardPlansResponse> => {
    const params = new URLSearchParams();
    if (filters?.planType) params.append('planType', filters.planType);
    if (filters?.isPublished !== undefined)
      params.append('isPublished', filters.isPublished.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`/api/coach/dashboard/plans?${params.toString()}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch dashboard plans');
    }

    return response.json();
  },

  /**
   * Get coach's clients
   */
  getClients: async (filters?: CoachClientsFilters): Promise<CoachClientsResponse> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await fetch(`/api/coach/clients?${params.toString()}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch clients');
    }

    return response.json();
  },
};
