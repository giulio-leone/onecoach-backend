import { useQuery } from '@tanstack/react-query';
import { marketplaceApi } from '../marketplace';

export const marketplaceKeys = {
  plans: (filters?: Record<string, unknown>) => ['marketplace', 'plans', filters] as const,
};

export function useMarketplacePlans(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: marketplaceKeys.plans(filters),
    queryFn: async () => {
      return marketplaceApi.getAll(filters);
    },
  });
}
