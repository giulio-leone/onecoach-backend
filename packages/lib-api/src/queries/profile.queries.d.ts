/**
 * Profile Query Keys and Functions
 *
 * Standardized query keys and query functions for user profile queries
 */
import type { ActivityLevel, Sex, WeightUnit, DietType } from '@giulio-leone/types/client';
/**
 * User profile data type
 */
export interface UserProfileData {
    id: string;
    userId: string;
    age: number | null;
    sex: Sex | null;
    heightCm: number | null;
    weightKg: number | null;
    weightUnit: WeightUnit;
    activityLevel: ActivityLevel | null;
    trainingFrequency: number | null;
    dailyCalories: number | null;
    nutritionGoals: string[];
    workoutGoals: string[];
    equipment: string[];
    dietaryRestrictions: string[];
    dietaryPreferences: string[];
    dietType: DietType | null;
    healthNotes: string | null;
    name?: string | null;
    email?: string | null;
    photoUrl?: string | null;
}
/**
 * Profile API response
 */
export interface ProfileResponse {
    profile: UserProfileData & {
        user?: {
            name?: string | null;
            email?: string | null;
            image?: string | null;
        };
    };
}
/**
 * Profile update payload
 */
export type ProfileUpdatePayload = Partial<Omit<UserProfileData, 'id' | 'userId'>>;
/**
 * Query keys for profile queries
 */
export declare const profileKeys: {
    readonly all: readonly ["profile"];
    readonly detail: () => readonly ["profile", "detail"];
    readonly weightUnit: () => readonly ["profile", "weightUnit"];
};
/**
 * Query functions for profile
 */
export declare const profileQueries: {
    /**
     * Get user profile
     */
    get: () => Promise<UserProfileData>;
    /**
     * Update user profile
     */
    update: (payload: ProfileUpdatePayload) => Promise<UserProfileData>;
};
//# sourceMappingURL=profile.queries.d.ts.map