/**
 * Body Measurements React Query Hooks
 *
 * Custom hooks for body measurements queries and mutations
 */
import {
  type BodyMeasurementsFilters,
  type CreateBodyMeasurementInput,
  type UpdateBodyMeasurementInput,
} from '../queries/body-measurements.queries';
import type { BodyMeasurement } from '@giulio-leone/types';
/**
 * Hook to get body measurements list
 *
 * @param filters - Optional filters for the list
 * @returns Query result with measurements array
 */
export declare function useBodyMeasurements(
  filters?: BodyMeasurementsFilters
): import('@tanstack/react-query').UseQueryResult<BodyMeasurement[], Error>;
/**
 * Hook to get single body measurement by ID
 *
 * @param id - Measurement ID
 * @param enabled - Whether to enable the query
 * @returns Query result with measurement data
 */
export declare function useBodyMeasurement(
  id: string | undefined,
  enabled?: boolean
): import('@tanstack/react-query').UseQueryResult<BodyMeasurement, Error>;
/**
 * Hook to create body measurement
 *
 * @returns Mutation result with create function
 */
export declare function useCreateBodyMeasurement(): import('@tanstack/react-query').UseMutationResult<
  BodyMeasurement,
  Error,
  CreateBodyMeasurementInput,
  {
    previousMeasurements?: BodyMeasurement[];
    tempId?: string;
  }
>;
/**
 * Hook to update body measurement
 *
 * @returns Mutation result with update function
 */
export declare function useUpdateBodyMeasurement(): import('@tanstack/react-query').UseMutationResult<
  BodyMeasurement,
  Error,
  {
    id: string;
    input: UpdateBodyMeasurementInput;
  },
  {
    previousMeasurement?: BodyMeasurement;
    previousMeasurements?: BodyMeasurement[];
  }
>;
/**
 * Hook to delete body measurement
 *
 * @returns Mutation result with delete function
 */
export declare function useDeleteBodyMeasurement(): import('@tanstack/react-query').UseMutationResult<
  void,
  Error,
  string,
  {
    previousMeasurements?: BodyMeasurement[];
    previousMeasurement?: BodyMeasurement | null;
  }
>;
//# sourceMappingURL=use-body-measurements.d.ts.map
