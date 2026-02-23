/**
 * Analytics Service
 *
 * Comprehensive analytics and progress tracking service.
 * Follows SOLID principles with single responsibility.
 */
import 'server-only';
import type { UserAnalyticsReport, AnalyticsChartData, TimeSeriesDataPoint, UserGoal } from '@giulio-leone/types';
export declare function getBodyMetricsTimeSeries(userId: string, metric: 'weight' | 'bodyFat' | 'muscleMass', startDate: Date, endDate: Date): Promise<TimeSeriesDataPoint[]>;
export declare function getBodyMetricsChange(userId: string, startDate: Date, endDate: Date): Promise<{
    weight: number | undefined;
    bodyFat: number | undefined;
    muscleMass: number | undefined;
} | null>;
export declare function getWorkoutVolumeTimeSeries(userId: string, startDate: Date, endDate: Date): Promise<TimeSeriesDataPoint[]>;
export declare function getStrengthProgress(userId: string, exerciseId: string, startDate: Date, endDate: Date): Promise<{
    exerciseId: string;
    startDate: Date;
    endDate: Date;
    startWeight: number;
    endWeight: number;
    percentChange: number;
    records: {
        date: Date;
        weight: number;
        reps: number;
        volume: number;
    }[];
} | null>;
export declare function calculateWorkoutMetrics(userId: string, startDate: Date, endDate: Date): Promise<{
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
    totalVolume: number;
    avgVolume: number;
}>;
export declare function calculateNutritionAdherence(userId: string, planId: string, weekNumber: number): Promise<{
    daysLogged: number;
    totalDays: number;
    adherenceRate: number;
    avgMacros: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
    };
    variance: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
    };
    avgWaterIntake: number;
}>;
export declare function getNutritionMacrosTimeSeries(userId: string, planId: string, macro: 'calories' | 'protein' | 'carbs' | 'fats', startDate: Date, endDate: Date): Promise<TimeSeriesDataPoint[]>;
export declare function generateAnalyticsReport(userId: string, startDate: Date, endDate: Date): Promise<UserAnalyticsReport>;
export declare function getUserGoals(userId: string): Promise<UserGoal[]>;
export declare function createUserGoal(userId: string, goal: Omit<UserGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<UserGoal>;
export declare function generateWeightChart(userId: string, startDate: Date, endDate: Date): Promise<AnalyticsChartData>;
export declare function generateVolumeChart(userId: string, startDate: Date, endDate: Date): Promise<AnalyticsChartData>;
export declare function generateMacrosChart(userId: string, planId: string, startDate: Date, endDate: Date): Promise<AnalyticsChartData>;
export declare function trackCheckoutEvent(params: {
    type: string;
    userId?: string;
    cartId?: string;
    metadata?: Record<string, unknown>;
}): Promise<void>;
export declare const analyticsService: {
    getBodyMetricsTimeSeries: typeof getBodyMetricsTimeSeries;
    getBodyMetricsChange: typeof getBodyMetricsChange;
    getWorkoutVolumeTimeSeries: typeof getWorkoutVolumeTimeSeries;
    getStrengthProgress: typeof getStrengthProgress;
    calculateWorkoutMetrics: typeof calculateWorkoutMetrics;
    calculateNutritionAdherence: typeof calculateNutritionAdherence;
    getNutritionMacrosTimeSeries: typeof getNutritionMacrosTimeSeries;
    generateAnalyticsReport: typeof generateAnalyticsReport;
    generateWeightChart: typeof generateWeightChart;
    generateVolumeChart: typeof generateVolumeChart;
    generateMacrosChart: typeof generateMacrosChart;
    getUserGoals: typeof getUserGoals;
    createUserGoal: typeof createUserGoal;
    trackCheckoutEvent: typeof trackCheckoutEvent;
};
//# sourceMappingURL=analytics.service.d.ts.map