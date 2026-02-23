/**
 * Dashboard Query Keys and Functions
 *
 * Standardized query keys and query functions for dashboard-related queries
 */
/**
 * Dashboard stats response
 */
export interface DashboardStatsResponse {
  stats: {
    workoutsThisWeek: number;
    workoutsThisMonth: number;
    caloriesTrackedToday: number;
    currentStreak: number;
    weightChange30Days: number;
    totalVolumeThisMonth: number;
  };
}
/**
 * Dashboard activity item
 */
export interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}
/**
 * Dashboard activity response
 */
export interface DashboardActivityResponse {
  activities: DashboardActivity[];
}
/**
 * Query keys for dashboard queries
 */
export declare const dashboardKeys: {
  readonly all: readonly ['dashboard'];
  readonly stats: () => readonly ['dashboard', 'stats'];
  readonly activity: () => readonly ['dashboard', 'activity'];
};
/**
 * Query functions for dashboard
 */
export declare const dashboardQueries: {
  /**
   * Get dashboard stats
   * Note: This endpoint may not exist yet, using a fallback
   */
  getStats: () => Promise<DashboardStatsResponse>;
  /**
   * Get dashboard activity
   * Note: This endpoint may not exist yet, using a fallback
   */
  getActivity: () => Promise<DashboardActivityResponse>;
};
//# sourceMappingURL=dashboard.queries.d.ts.map
