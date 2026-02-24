/**
 * Profile React Query Hooks
 *
 * Custom hooks for user profile queries and mutations
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileKeys, profileQueries } from '../queries/profile.queries';
import type { UserProfileData } from '../queries/profile.queries';
import type { WeightUnit } from '@prisma/client';

/**
 * Hook to get user profile
 *
 * @returns Query result with profile data
 */
export function useProfile() {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: profileQueries.get,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message === 'UNAUTHENTICATED') {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update user profile
 *
 * @returns Mutation result with update function
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileQueries.update,
    onMutate: async (newProfile) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: profileKeys.detail() });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData<UserProfileData>(profileKeys.detail());

      // Optimistically update to the new value
      if (previousProfile) {
        queryClient.setQueryData<UserProfileData>(profileKeys.detail(), {
          ...previousProfile,
          ...newProfile,
        });
      }

      // Return a context object with the snapshotted value
      return { previousProfile };
    },
    onError: (_err, _newProfile, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProfile) {
        queryClient.setQueryData(profileKeys.detail(), context.previousProfile);
      }
    },
    onSuccess: (data) => {
      // Update the cache with the response data
      queryClient.setQueryData(profileKeys.detail(), data);
    },
  });
}

/**
 * Hook to get user's weight unit preference
 *
 * @returns Weight unit ('KG' or 'LBS')
 */
export function useWeightUnit(): WeightUnit {
  const { data: profile } = useProfile();
  return profile?.weightUnit ?? 'KG';
}

/**
 * Hook to check if profile is complete
 *
 * @returns Boolean indicating if profile has all required fields
 */
export function useIsProfileComplete(): boolean {
  const { data: profile } = useProfile();

  if (!profile) return false;

  return !!(
    profile.age &&
    profile.sex &&
    profile.heightCm &&
    profile.weightKg &&
    profile.activityLevel
  );
}
