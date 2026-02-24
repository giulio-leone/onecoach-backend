import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';

export interface AffiliateStats {
  referralCode: string | null;
  totalEarnings: number;
  invitedCount: number;
  conversionRate: number;
  recentActivity: Array<{
    id: string;
    type: string;
    amount: number;
    date: string;
    status: string;
    source: string;
  }>;
}

export const affiliateKeys = {
  stats: ['affiliate', 'stats'] as const,
};

export function useAffiliateStats() {
  return useQuery({
    queryKey: affiliateKeys.stats,
    queryFn: async () => {
      return apiClient.get<AffiliateStats>('/api/affiliates/stats');
    },
  });
}
