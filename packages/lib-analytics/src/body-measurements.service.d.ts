/**
 * Body Measurements Service
 *
 * CRUD operations for body measurements tracking.
 * Follows SOLID principles with single responsibility.
 */
import 'server-only';
import type { BodyMeasurement } from '@giulio-leone/types';
export interface CreateBodyMeasurementInput {
    date: Date;
    weight?: number;
    bodyFat?: number;
    muscleMass?: number;
    chest?: number;
    waist?: number;
    hips?: number;
    thigh?: number;
    arm?: number;
    calf?: number;
    neck?: number;
    shoulders?: number;
    height?: number;
    visceralFat?: number;
    waterPercentage?: number;
    boneMass?: number;
    metabolicAge?: number;
    bmr?: number;
    notes?: string;
    photos?: string[];
}
export interface UpdateBodyMeasurementInput extends Partial<CreateBodyMeasurementInput> {
}
export declare function createBodyMeasurement(userId: string, data: CreateBodyMeasurementInput): Promise<BodyMeasurement>;
export declare function getBodyMeasurement(userId: string, date: Date): Promise<BodyMeasurement | null>;
export declare function getBodyMeasurementById(measurementId: string, userId: string): Promise<BodyMeasurement | null>;
export declare function getBodyMeasurementHistory(userId: string, startDate?: Date, endDate?: Date, limit?: number): Promise<BodyMeasurement[]>;
export declare function getLatestBodyMeasurement(userId: string): Promise<BodyMeasurement | null>;
export declare function updateBodyMeasurement(measurementId: string, userId: string, data: UpdateBodyMeasurementInput): Promise<BodyMeasurement>;
export declare function deleteBodyMeasurement(measurementId: string, userId: string): Promise<void>;
export declare function getBodyMeasurementStats(userId: string, startDate: Date, endDate: Date): Promise<{
    totalMeasurements: number;
    firstDate: Date;
    lastDate: Date;
    changes: {
        weight: number | undefined;
        bodyFat: number | undefined;
        muscleMass: number | undefined;
    };
    latest: BodyMeasurement;
} | null>;
//# sourceMappingURL=body-measurements.service.d.ts.map