/**
 * Body Measurements Query Keys and Functions
 *
 * Standardized query keys and query functions for body measurements queries
 */
import type { BodyMeasurement } from '@giulio-leone/types';
/**
 * Query keys for body measurements queries
 */
export declare const bodyMeasurementsKeys: {
    readonly all: readonly ["body-measurements"];
    readonly lists: () => readonly ["body-measurements", "list"];
    readonly list: (filters?: BodyMeasurementsFilters) => readonly ["body-measurements", "list", BodyMeasurementsFilters | undefined];
    readonly details: () => readonly ["body-measurements", "detail"];
    readonly detail: (id: string) => readonly ["body-measurements", "detail", string];
};
/**
 * Filters for body measurements list
 */
export interface BodyMeasurementsFilters {
    startDate?: string;
    endDate?: string;
    limit?: number;
    latest?: boolean;
}
/**
 * Body measurements list response
 */
export interface BodyMeasurementsListResponse {
    success: boolean;
    measurements: BodyMeasurement[];
    stats?: BodyMeasurementStats | null;
}
/**
 * Body measurements stats
 */
export interface BodyMeasurementStats {
    weightChange?: number;
    bodyFatChange?: number;
    muscleMassChange?: number;
    averageWeight?: number;
    averageBodyFat?: number;
    averageMuscleMass?: number;
}
/**
 * Single body measurement response
 */
export interface BodyMeasurementResponse {
    success: boolean;
    measurement: BodyMeasurement;
}
/**
 * Create body measurement input
 */
export type CreateBodyMeasurementInput = Omit<BodyMeasurement, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
/**
 * Update body measurement input
 */
export type UpdateBodyMeasurementInput = Partial<Omit<BodyMeasurement, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
/**
 * Query functions for body measurements
 */
export declare const bodyMeasurementsQueries: {
    /**
     * Get body measurements list
     */
    list: (filters?: BodyMeasurementsFilters) => Promise<BodyMeasurement[]>;
    /**
     * Get single body measurement by ID
     */
    detail: (id: string) => Promise<BodyMeasurement>;
    /**
     * Create body measurement
     */
    create: (input: CreateBodyMeasurementInput) => Promise<BodyMeasurement>;
    /**
     * Update body measurement
     */
    update: (id: string, input: UpdateBodyMeasurementInput) => Promise<BodyMeasurement>;
    /**
     * Delete body measurement
     */
    delete: (id: string) => Promise<void>;
};
//# sourceMappingURL=body-measurements.queries.d.ts.map