/**
 * Progress Snapshot Service
 *
 * Generates and manages periodic snapshots of user progress.
 * Snapshots are used for historical tracking and performance optimization.
 * Follows SOLID principles with single responsibility.
 */
import { Prisma } from '@prisma/client';
export declare function generateProgressSnapshot(userId: string, date: Date): Promise<{
    id: string;
    createdAt: Date;
    userId: string | null;
    date: Date;
    weight: Prisma.Decimal | null;
    bodyFat: Prisma.Decimal | null;
    muscleMass: Prisma.Decimal | null;
    workoutSessions7d: number;
    workoutSessions30d: number;
    avgVolumePerSession: Prisma.Decimal | null;
    strengthProgress: Prisma.JsonValue | null;
    nutritionLogs7d: number;
    nutritionLogs30d: number;
    avgCalories: Prisma.Decimal | null;
    avgProtein: Prisma.Decimal | null;
    avgCarbs: Prisma.Decimal | null;
    avgFats: Prisma.Decimal | null;
    adherenceRate: Prisma.Decimal | null;
    activeGoals: string[];
    completedGoals: string[];
}>;
export declare function getProgressSnapshot(userId: string, date: Date): Promise<{
    id: string;
    createdAt: Date;
    userId: string | null;
    date: Date;
    weight: Prisma.Decimal | null;
    bodyFat: Prisma.Decimal | null;
    muscleMass: Prisma.Decimal | null;
    workoutSessions7d: number;
    workoutSessions30d: number;
    avgVolumePerSession: Prisma.Decimal | null;
    strengthProgress: Prisma.JsonValue | null;
    nutritionLogs7d: number;
    nutritionLogs30d: number;
    avgCalories: Prisma.Decimal | null;
    avgProtein: Prisma.Decimal | null;
    avgCarbs: Prisma.Decimal | null;
    avgFats: Prisma.Decimal | null;
    adherenceRate: Prisma.Decimal | null;
    activeGoals: string[];
    completedGoals: string[];
} | null>;
export declare function getProgressSnapshots(userId: string, startDate: Date, endDate: Date): Promise<{
    id: string;
    createdAt: Date;
    userId: string | null;
    date: Date;
    weight: Prisma.Decimal | null;
    bodyFat: Prisma.Decimal | null;
    muscleMass: Prisma.Decimal | null;
    workoutSessions7d: number;
    workoutSessions30d: number;
    avgVolumePerSession: Prisma.Decimal | null;
    strengthProgress: Prisma.JsonValue | null;
    nutritionLogs7d: number;
    nutritionLogs30d: number;
    avgCalories: Prisma.Decimal | null;
    avgProtein: Prisma.Decimal | null;
    avgCarbs: Prisma.Decimal | null;
    avgFats: Prisma.Decimal | null;
    adherenceRate: Prisma.Decimal | null;
    activeGoals: string[];
    completedGoals: string[];
}[]>;
export declare function getLatestProgressSnapshot(userId: string): Promise<{
    id: string;
    createdAt: Date;
    userId: string | null;
    date: Date;
    weight: Prisma.Decimal | null;
    bodyFat: Prisma.Decimal | null;
    muscleMass: Prisma.Decimal | null;
    workoutSessions7d: number;
    workoutSessions30d: number;
    avgVolumePerSession: Prisma.Decimal | null;
    strengthProgress: Prisma.JsonValue | null;
    nutritionLogs7d: number;
    nutritionLogs30d: number;
    avgCalories: Prisma.Decimal | null;
    avgProtein: Prisma.Decimal | null;
    avgCarbs: Prisma.Decimal | null;
    avgFats: Prisma.Decimal | null;
    adherenceRate: Prisma.Decimal | null;
    activeGoals: string[];
    completedGoals: string[];
} | null>;
/**
 * Generate snapshots for all active users for a specific date.
 * Useful for scheduled jobs (e.g., daily cron).
 */
export declare function generateSnapshotsForAllUsers(date: Date): Promise<{
    total: number;
    successful: number;
    failed: number;
    errors: unknown[];
}>;
/**
 * Generate missing snapshots for a user within a date range.
 * Useful for backfilling data.
 */
export declare function backfillSnapshots(userId: string, startDate: Date, endDate: Date): Promise<unknown[]>;
//# sourceMappingURL=progress-snapshot.service.d.ts.map