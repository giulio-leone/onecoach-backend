/**
 * Marketplace API Client
 *
 * API client for marketplace-related operations
 */
export interface MarketplacePlan {
  id: string;
  title: string;
  description: string;
  planType: 'WORKOUT' | 'NUTRITION';
  price: number;
  currency: string;
  coverImage?: string | null;
  coachId: string;
  coachName?: string;
  averageRating?: number;
  totalPurchases?: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface MarketplacePlansResponse {
  plans: MarketplacePlan[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
export interface MarketplacePlanResponse {
  plan: MarketplacePlan;
}
export declare const marketplaceApi: {
  /**
   * Get all marketplace plans with filters
   */
  getAll(filters?: {
    planType?: 'WORKOUT' | 'NUTRITION';
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    coachId?: string;
    searchQuery?: string;
    sortBy?: 'rating' | 'price' | 'recent' | 'popular';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<MarketplacePlansResponse>;
  /**
   * Get marketplace plan by ID
   */
  getById(id: string): Promise<MarketplacePlanResponse>;
};
//# sourceMappingURL=marketplace.d.ts.map
