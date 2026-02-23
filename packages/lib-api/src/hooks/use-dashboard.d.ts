/**
 * Dashboard React Query Hooks
 *
 * Custom hooks for dashboard queries
 */
/**
 * Hook to get all dashboard data
 * Combines stats, credits, and activities
 */
export declare function useDashboardData(): {
  stats:
    | {
        workoutsThisWeek: number;
        workoutsThisMonth: number;
        caloriesTrackedToday: number;
        currentStreak: number;
        weightChange30Days: number;
        totalVolumeThisMonth: number;
      }
    | undefined;
  credits: import('..').CreditBalanceResponse | undefined;
  activities: import('..').DashboardActivity[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};
//# sourceMappingURL=use-dashboard.d.ts.map
