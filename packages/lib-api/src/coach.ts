import { apiClient } from './client';
import type { MarketplacePlanType } from '@giulio-leone/types/database';

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

export interface CoachDashboardStats {
  totalSales: number;
  totalRevenue: number;
  averageRating: number | null;
  totalReviews: number;
  totalPlans: number;
  publishedPlans: number;
  draftPlans: number;
}

export interface CoachProfile {
  id: string;
  userId: string;
  bio?: string | null;
  credentials?: string[] | null;
  coachingStyle?: string | null;
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
  isPubliclyVisible: boolean;
  verificationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicCoachProfile extends CoachProfile {
  stats?: {
    totalPlans: number;
    totalSales: number;
    averageRating: number;
  };
}

export interface CoachProfileResponse {
  profile: CoachProfile;
}

export interface PublicCoachProfileResponse {
  profile: PublicCoachProfile;
  plans: unknown[];
  totalPlans: number;
}

export const coachApi = {
  /**
   * Get coach profile (current user's profile)
   */
  async getProfile(): Promise<CoachProfileResponse> {
    return apiClient.get<CoachProfileResponse>(`/api/coach/profile`);
  },

  /**
   * Get public coach profile
   */
  async getPublicProfile(userId: string): Promise<PublicCoachProfileResponse> {
    return apiClient.get<PublicCoachProfileResponse>(`/api/coach/public/${userId}`);
  },

  /**
   * Create coach profile
   */
  async createProfile(data: Partial<CoachProfile>): Promise<CoachProfileResponse> {
    return apiClient.post<CoachProfileResponse>('/api/coach/profile', data);
  },

  /**
   * Update coach profile
   */
  async updateProfile(data: Partial<CoachProfile>): Promise<CoachProfileResponse> {
    return apiClient.put<CoachProfileResponse>('/api/coach/profile', data);
  },

  /**
   * Get coach dashboard stats
   */
  async getDashboardStats(): Promise<CoachDashboardStats> {
    return apiClient.get<CoachDashboardStats>('/api/coach/dashboard/stats');
  },

  /**
   * Get coach dashboard plans with filters
   */
  async getDashboardPlans(filters?: CoachDashboardPlansFilters): Promise<CoachDashboardPlansResponse> {
    const params = new URLSearchParams();
    if (filters?.planType) params.append('planType', filters.planType);
    if (filters?.isPublished !== undefined)
      params.append('isPublished', filters.isPublished.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return apiClient.get<CoachDashboardPlansResponse>(`/api/coach/dashboard/plans?${params.toString()}`);
  },

  /**
   * Get coach's clients
   */
  async getClients(filters?: CoachClientsFilters): Promise<CoachClientsResponse> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    return apiClient.get<CoachClientsResponse>(`/api/coach/clients?${params.toString()}`);
  },
};
