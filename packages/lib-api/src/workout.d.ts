/**
 * Workout API
 *
 * API functions per workout programs
 */
import type { WorkoutProgram } from '@giulio-leone/types';
export interface WorkoutProgramResponse {
    program: WorkoutProgram;
}
export interface WorkoutProgramsResponse {
    programs: WorkoutProgram[];
}
export declare const workoutApi: {
    /**
     * Get all workout programs
     */
    getAll(): Promise<WorkoutProgramsResponse>;
    /**
     * Get workout program by ID
     */
    getById(id: string): Promise<WorkoutProgramResponse>;
    /**
     * Create workout program
     */
    create(data: unknown): Promise<WorkoutProgramResponse>;
    /**
     * Update workout program
     */
    update(id: string, data: unknown): Promise<WorkoutProgramResponse>;
    /**
     * Delete workout program
     */
    delete(id: string): Promise<void>;
    /**
     * Create a new workout session
     */
    createSession(programId: string, data: {
        weekNumber: number;
        dayNumber: number;
    }): Promise<{
        session: unknown;
    }>;
    /**
     * Get workout session by ID
     */
    getSession(sessionId: string): Promise<{
        session: unknown;
    }>;
    /**
     * Update workout session
     */
    updateSession(sessionId: string, data: unknown): Promise<{
        session: unknown;
    }>;
};
//# sourceMappingURL=workout.d.ts.map