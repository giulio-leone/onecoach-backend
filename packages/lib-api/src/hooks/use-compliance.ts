'use client';

import { useQuery } from '@tanstack/react-query';

// --- Query Keys ---

export const complianceKeys = {
  all: ['compliance'] as const,
  dashboard: (period?: string) => [...complianceKeys.all, 'dashboard', period] as const,
};

// --- Types ---

export interface ClientComplianceStats {
  clientId: string;
  clientName: string;
  clientEmail: string;
  periods: {
    '7d': CompliancePeriod;
    '30d': CompliancePeriod;
    '90d': CompliancePeriod;
  };
  riskLevel: 'low' | 'medium' | 'high';
  overallScore: number;
}

export interface CompliancePeriod {
  workoutCompletionRate: number;
  nutritionLoggingRate: number;
  calorieAdherenceRate: number;
}

export interface ComplianceDashboard {
  clients: ClientComplianceStats[];
  summary: {
    totalClients: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    averageWorkoutCompletion: number;
    averageNutritionLogging: number;
  };
}

// --- API ---

const complianceApi = {
  getDashboard: async (period?: string): Promise<ComplianceDashboard> => {
    const params = period ? `?period=${period}` : '';
    const res = await fetch(`/api/coach/compliance${params}`, { credentials: 'include' });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'Failed to fetch compliance');
    return res.json();
  },
};

// --- Hooks ---

export function useComplianceDashboard(period?: string) {
  return useQuery({
    queryKey: complianceKeys.dashboard(period),
    queryFn: () => complianceApi.getDashboard(period),
    staleTime: 2 * 60 * 1000,
  });
}
