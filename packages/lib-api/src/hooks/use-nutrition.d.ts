/**
 * Nutrition React Query Hooks
 *
 * Custom hooks for nutrition-related queries and mutations
 */
/**
 * Hook to get all nutrition plans
 */
export declare function useNutritionPlans(): import('@tanstack/react-query').UseQueryResult<
  import('..').NutritionPlansResponse,
  Error
>;
/**
 * Hook to get a nutrition plan by ID
 */
export declare function useNutritionPlan(
  id: string | null | undefined
): import('@tanstack/react-query').UseQueryResult<import('..').NutritionPlanResponse, Error>;
/**
 * Hook to get nutrition plan versions
 */
export declare function useNutritionPlanVersions(
  id: string | null | undefined
): import('@tanstack/react-query').UseQueryResult<
  {
    versions: unknown[];
  },
  Error
>;
/**
 * Hook to get a nutrition day log by ID
 */
export declare function useNutritionDayLog(
  logId: string | null | undefined
): import('@tanstack/react-query').UseQueryResult<
  {
    log: unknown;
  },
  Error
>;
/**
 * Hook to create a nutrition plan
 */
export declare function useCreateNutritionPlan(): import('@tanstack/react-query').UseMutationResult<
  import('..').NutritionPlanResponse,
  Error,
  unknown,
  unknown
>;
/**
 * Hook to update a nutrition plan
 */
export declare function useUpdateNutritionPlan(): import('@tanstack/react-query').UseMutationResult<
  import('..').NutritionPlanResponse,
  Error,
  {
    id: string;
    data: unknown;
  },
  unknown
>;
/**
 * Hook to delete a nutrition plan
 */
export declare function useDeleteNutritionPlan(): import('@tanstack/react-query').UseMutationResult<
  void,
  Error,
  string,
  unknown
>;
/**
 * Hook to create a nutrition day log
 */
export declare function useCreateNutritionDayLog(): import('@tanstack/react-query').UseMutationResult<
  {
    log: unknown;
  },
  Error,
  {
    planId: string;
    data: {
      weekNumber: number;
      dayNumber: number;
    };
  },
  unknown
>;
/**
 * Hook to update a nutrition day log
 */
export declare function useUpdateNutritionDayLog(): import('@tanstack/react-query').UseMutationResult<
  {
    log: unknown;
  },
  Error,
  {
    logId: string;
    data: unknown;
  },
  unknown
>;
//# sourceMappingURL=use-nutrition.d.ts.map
