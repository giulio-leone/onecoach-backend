/**
 * Food API
 *
 * API functions per food items
 */
export interface Food {
  id: string;
  name: string;
  nameNormalized?: string;
  barcode?: string;
  macrosPer100g: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber?: number;
  };
  servingSize: number;
  unit: string;
  imageUrl?: string;
  metadata?: {
    brand?: string;
    category?: string;
    [key: string]: unknown;
  };
  brand?: {
    id: string;
    name: string;
  };
  categories?: Array<{
    id: string;
    name: string;
    slug?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}
export interface FoodResponse {
  foodItem: Food;
}
export interface FoodsResponse {
  data: Food[];
  total?: number;
  page?: number;
  pageSize?: number;
}
export interface FoodListParams {
  search?: string;
  brandId?: string;
  categoryIds?: string[];
  barcode?: string;
  kcalMin?: number;
  kcalMax?: number;
  macroDominant?: 'protein' | 'carbs' | 'fats';
  minProteinPct?: number;
  minCarbPct?: number;
  minFatPct?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
export declare const foodApi: {
  /**
   * Get all foods with optional filters
   */
  list(params?: FoodListParams): Promise<FoodsResponse>;
  /**
   * Get food by ID
   */
  getById(id: string): Promise<FoodResponse>;
  /**
   * Create food
   */
  create(data: unknown): Promise<FoodResponse>;
  /**
   * Update food
   */
  update(id: string, data: unknown): Promise<FoodResponse>;
  /**
   * Delete food
   */
  delete(id: string): Promise<void>;
  /**
   * Update food using AI
   */
  updateWithAI(
    id: string,
    data: {
      description: string;
      customPrompt?: string;
    }
  ): Promise<FoodResponse>;
  /**
   * Batch operations (delete, update)
   */
  batch(
    action: 'delete' | 'update',
    ids: string[],
    data?: Record<string, unknown>
  ): Promise<{
    success: boolean;
    results: Array<{
      id: string;
      success: boolean;
      error?: string;
    }>;
    deleted?: number;
    updated?: number;
  }>;
};
//# sourceMappingURL=food.d.ts.map
