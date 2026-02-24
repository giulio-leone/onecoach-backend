/**
 * Coach React Query Hooks
 *
 * Custom hooks for coach-related queries and mutations
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  coachKeys,
  coachQueries,
  type CoachDashboardPlansFilters,
  type CoachClientsFilters,
} from '../queries/coach.queries';

/**
 * Hook to get public coach profile
 *
 * @param userId - Coach user ID
 * @returns Query result with public coach profile data
 */
export function usePublicCoachProfile(userId: string | null) {
  return useQuery({
    queryKey: coachKeys.publicProfile(userId || ''),
    queryFn: () => coachQueries.getPublicProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get coach dashboard stats
 *
 * @returns Query result with dashboard stats
 */
export function useCoachDashboardStats() {
  return useQuery({
    queryKey: coachKeys.dashboardStats(),
    queryFn: coachQueries.getDashboardStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get coach dashboard plans with filters
 *
 * @param filters - Filters for plans (planType, isPublished, page, limit)
 * @returns Query result with dashboard plans data
 */
export function useCoachDashboardPlans(filters?: CoachDashboardPlansFilters) {
  return useQuery({
    queryKey: coachKeys.dashboardPlans(filters),
    queryFn: () => coachQueries.getDashboardPlans(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get coach's clients
 *
 * @param filters - Filters for clients (search, sortBy, sortOrder)
 * @returns Query result with clients data
 */
export function useCoachClients(filters?: CoachClientsFilters) {
  return useQuery({
    queryKey: coachKeys.clients(filters),
    queryFn: () => coachQueries.getClients(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
