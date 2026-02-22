/**
 * Nutrition API
 *
 * API functions per nutrition plans
 */
import type { NutritionPlan } from '@giulio-leone/types';
export interface NutritionPlanResponse {
    plan: NutritionPlan;
}
export interface NutritionPlansResponse {
    plans: NutritionPlan[];
}
export declare const nutritionApi: {
    /**
     * Get all nutrition plans
     */
    getAll(): Promise<NutritionPlansResponse>;
    /**
     * Get nutrition plan by ID
     */
    getById(id: string): Promise<NutritionPlanResponse>;
    /**
     * Create nutrition plan
     */
    create(data: unknown): Promise<NutritionPlanResponse>;
    /**
     * Update nutrition plan
     */
    update(id: string, data: unknown): Promise<NutritionPlanResponse>;
    /**
     * Delete nutrition plan
     */
    delete(id: string): Promise<void>;
    /**
     * Get nutrition plan versions
     */
    getVersions(id: string): Promise<{
        versions: unknown[];
    }>;
    /**
     * Create nutrition day log
     */
    createDayLog(planId: string, data: {
        weekNumber: number;
        dayNumber: number;
    }): Promise<{
        log: unknown;
    }>;
    /**
     * Get nutrition day log by ID
     */
    getDayLog(logId: string): Promise<{
        log: unknown;
    }>;
    /**
     * Update nutrition day log
     */
    updateDayLog(logId: string, data: unknown): Promise<{
        log: unknown;
    }>;
};
//# sourceMappingURL=nutrition.d.ts.map