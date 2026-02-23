/**
 * Coach API Client
 *
 * API client for coach-related operations
 */
export interface CoachProfile {
  id: string;
  userId: string;
  bio?: string | null;
  credentials?: string[] | null;
  coachingStyle?: string | null;
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
  isPubliclyVisible: boolean;
  verificationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface PublicCoachProfile extends CoachProfile {
  stats?: {
    totalPlans: number;
    totalSales: number;
    averageRating: number;
  };
}
export interface CoachProfileResponse {
  profile: CoachProfile;
}
export interface PublicCoachProfileResponse {
  profile: PublicCoachProfile;
  plans: unknown[];
  totalPlans: number;
}
export declare const coachApi: {
  /**
   * Get coach profile (current user's profile)
   */
  getProfile(): Promise<CoachProfileResponse>;
  /**
   * Get public coach profile
   */
  getPublicProfile(userId: string): Promise<PublicCoachProfileResponse>;
  /**
   * Create coach profile
   */
  createProfile(data: Partial<CoachProfile>): Promise<CoachProfileResponse>;
  /**
   * Update coach profile
   */
  updateProfile(data: Partial<CoachProfile>): Promise<CoachProfileResponse>;
};
//# sourceMappingURL=coach.d.ts.map
