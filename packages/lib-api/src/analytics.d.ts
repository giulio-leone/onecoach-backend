/**
 * Analytics API
 *
 * API functions per analytics data
 */
export interface AnalyticsOverviewParams {
  startDate?: string;
  endDate?: string;
  period?: '7d' | '30d' | '90d' | '1y';
}
export interface AnalyticsOverviewResponse {
  report: unknown;
}
export interface ChartDataParams {
  type: string;
  startDate?: string;
  endDate?: string;
  period?: string;
}
export declare const analyticsApi: {
  /**
   * Get analytics overview
   */
  getOverview(params?: AnalyticsOverviewParams): Promise<AnalyticsOverviewResponse>;
  /**
   * Get chart data
   */
  getChartData(params: ChartDataParams): Promise<unknown[]>;
  /**
   * Get AI insights
   */
  getAiInsights(period?: string): Promise<{
    insights: unknown[];
  }>;
};
//# sourceMappingURL=analytics.d.ts.map
