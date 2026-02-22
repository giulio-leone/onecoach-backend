/**
 * Profile React Query Hooks
 *
 * Custom hooks for user profile queries and mutations
 */
import type { UserProfileData } from '../queries/profile.queries';
import type { WeightUnit } from '@giulio-leone/types/client';
/**
 * Hook to get user profile
 *
 * @returns Query result with profile data
 */
export declare function useProfile(): import("@tanstack/react-query").UseQueryResult<UserProfileData, Error>;
/**
 * Hook to update user profile
 *
 * @returns Mutation result with update function
 */
export declare function useUpdateProfile(): import("@tanstack/react-query").UseMutationResult<UserProfileData, Error, Partial<Omit<UserProfileData, "id" | "userId">>, {
    previousProfile: UserProfileData | undefined;
}>;
/**
 * Hook to get user's weight unit preference
 *
 * @returns Weight unit ('KG' or 'LBS')
 */
export declare function useWeightUnit(): WeightUnit;
/**
 * Hook to check if profile is complete
 *
 * @returns Boolean indicating if profile has all required fields
 */
export declare function useIsProfileComplete(): boolean;
//# sourceMappingURL=use-profile.d.ts.map