/**
 * Nutrition Query Keys and Functions
 *
 * Standardized query keys and query functions for nutrition-related queries
 */
import type { NutritionPlanResponse, NutritionPlansResponse } from '../nutrition';
/**
 * Query keys for nutrition queries
 */
export declare const nutritionKeys: {
  readonly all: readonly ['nutrition'];
  readonly lists: () => readonly ['nutrition', 'list'];
  readonly list: (
    filters?: Record<string, unknown>
  ) => readonly ['nutrition', 'list', Record<string, unknown> | undefined];
  readonly details: () => readonly ['nutrition', 'detail'];
  readonly detail: (id: string) => readonly ['nutrition', 'detail', string];
  readonly versions: (id: string) => readonly ['nutrition', 'detail', string, 'versions'];
  readonly logs: () => readonly ['nutrition', 'logs'];
  readonly log: (logId: string) => readonly ['nutrition', 'logs', string];
};
/**
 * Query functions for nutrition
 */
export declare const nutritionQueries: {
  /**
   * Get all nutrition plans
   */
  getAll: () => Promise<NutritionPlansResponse>;
  /**
   * Get nutrition plan by ID
   */
  getById: (id: string) => Promise<NutritionPlanResponse>;
  /**
   * Get nutrition plan versions
   */
  getVersions: (id: string) => Promise<{
    versions: unknown[];
  }>;
  /**
   * Get nutrition day log by ID
   */
  getDayLog: (logId: string) => Promise<{
    log: unknown;
  }>;
};
//# sourceMappingURL=nutrition.queries.d.ts.map
