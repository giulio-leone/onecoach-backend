/**
 * Food Query Keys and Functions
 *
 * Standardized query keys and query functions for food-related queries
 */
import type { FoodResponse, FoodsResponse, FoodListParams } from '../food';
/**
 * Query keys for food queries
 */
export declare const foodKeys: {
  readonly all: readonly ['foods'];
  readonly lists: () => readonly ['foods', 'list'];
  readonly list: (
    params?: FoodListParams
  ) => readonly ['foods', 'list', FoodListParams | undefined];
  readonly details: () => readonly ['foods', 'detail'];
  readonly detail: (id: string) => readonly ['foods', 'detail', string];
};
/**
 * Query functions for foods
 */
export declare const foodQueries: {
  /**
   * Get all foods with optional filters
   */
  list: (params?: FoodListParams) => Promise<FoodsResponse>;
  /**
   * Get food by ID
   */
  getById: (id: string) => Promise<FoodResponse>;
};
//# sourceMappingURL=food.queries.d.ts.map
