import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';

export interface AnalyticsReport {
  summary: {
    totalVolume: number;
    completedWorkouts: number;
    averageCalories: number;
    currentWeight: number;
  };
  charts: {
    activity: Array<{ name: string; workout: number; nutrition: number }>;
    muscleDistribution: Array<{ name: string; value: number }>;
    macros: Array<{ name: string; value: number; color: string }>;
  };
  recentPRs: Array<{
    exercise: string;
    value: string;
    date: string;
    improvement: string;
  }>;
}

export const analyticsKeys = {
  overview: (period: string) => ['analytics', 'overview', period] as const,
};

export function useAnalyticsOverview(period: string = '30d') {
  return useQuery({
    queryKey: analyticsKeys.overview(period),
    queryFn: async () => {
      const response = await apiClient.get<{ report: AnalyticsReport }>(
        `/api/analytics/overview?period=${period}`
      );
      return response.report;
    },
  });
}
