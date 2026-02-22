/**
 * Coach Service
 *
 * CRUD operations for coach profiles and vetting
 * Implements SOLID principles (SRP, DIP)
 */

import { prisma } from '@giulio-leone/lib-core';
import { Prisma } from '@prisma/client';
import type {
  CoachVerificationStatus,
  VettingStatus,
  coach_profiles,
  coach_vetting_requests,
} from '@prisma/client';

/**
 * Interface for Coach Service
 */
export interface ICoachService {
  // Coach Profile
  getProfile(userId: string): Promise<coach_profiles | null>;
  createProfile(data: CreateCoachProfileInput): Promise<coach_profiles>;
  updateProfile(userId: string, data: UpdateCoachProfileInput): Promise<coach_profiles>;
  getPublicProfile(userId: string): Promise<PublicCoachProfile | null>;

  // Vetting
  submitVettingRequest(data: SubmitVettingInput): Promise<coach_vetting_requests>;
  getVettingRequest(userId: string): Promise<coach_vetting_requests | null>;
  updateVettingStatus(
    requestId: string,
    status: VettingStatus,
    reviewNotes?: string,
    reviewedBy?: string
  ): Promise<coach_vetting_requests>;

  // Statistics
  updateCoachStats(userId: string): Promise<coach_profiles>;
}

/**
 * Input types
 */
export interface CreateCoachProfileInput {
  userId: string;
  bio?: string;
  credentials?: string;
  coachingStyle?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
}

export interface UpdateCoachProfileInput {
  bio?: string;
  credentials?: string;
  coachingStyle?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  isPubliclyVisible?: boolean;
}

export interface SubmitVettingInput {
  userId: string;
  credentialDocuments?: Record<string, unknown>;
}

export interface PublicCoachProfile {
  id: string;
  userId: string;
  bio: string | null;
  credentials: string | null;
  coachingStyle: string | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  verificationStatus: CoachVerificationStatus;
  totalSales: number;
  averageRating: number | null;
  totalReviews: number;
  user: {
    name: string | null;
    image: string | null;
  };
}

/**
 * Implementation Coach Service
 */
class CoachService implements ICoachService {
  /**
   * Get coach profile by user ID
   */
  async getProfile(userId: string): Promise<coach_profiles | null> {
    return await prisma.coach_profiles.findUnique({
      where: { userId },
    });
  }

  /**
   * Create new coach profile
   */
  async createProfile(data: CreateCoachProfileInput): Promise<coach_profiles> {
    return await prisma.coach_profiles.create({
      data: {
        ...data,
        verificationStatus: 'PENDING',
        isPubliclyVisible: false,
        totalSales: 0,
        totalReviews: 0,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Update coach profile
   */
  async updateProfile(userId: string, data: UpdateCoachProfileInput): Promise<coach_profiles> {
    return await prisma.coach_profiles.update({
      where: { userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get public coach profile (for marketplace)
   */
  async getPublicProfile(userId: string): Promise<PublicCoachProfile | null> {
    const profile = await prisma.coach_profiles.findUnique({
      where: { userId },
      include: {
        users: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    if (!profile || !profile.isPubliclyVisible) {
      return null;
    }

    return {
      id: profile.id,
      userId: profile.userId!,
      bio: profile.bio,
      credentials: profile.credentials,
      coachingStyle: profile.coachingStyle,
      linkedinUrl: profile.linkedinUrl,
      instagramUrl: profile.instagramUrl,
      websiteUrl: profile.websiteUrl,
      verificationStatus: profile.verificationStatus,
      totalSales: profile.totalSales,
      averageRating: profile.averageRating ? Number(profile.averageRating) : null,
      totalReviews: profile.totalReviews,
      user: {
        name: profile.users?.name || null,
        image: profile.users?.image || null,
      },
    };
  }

  /**
   * Submit vetting request
   */
  async submitVettingRequest(data: SubmitVettingInput): Promise<coach_vetting_requests> {
    return await prisma.coach_vetting_requests.create({
      data: {
        userId: data.userId,
        credentialDocuments: (data.credentialDocuments || {}) as Prisma.InputJsonValue,
        status: 'PENDING',
        submittedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get vetting request for user
   */
  async getVettingRequest(userId: string): Promise<coach_vetting_requests | null> {
    return await prisma.coach_vetting_requests.findFirst({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /**
   * Update vetting request status
   */
  async updateVettingStatus(
    requestId: string,
    status: VettingStatus,
    reviewNotes?: string,
    reviewedBy?: string
  ): Promise<coach_vetting_requests> {
    const request = await prisma.coach_vetting_requests.update({
      where: { id: requestId },
      data: {
        status,
        reviewNotes,
        reviewedBy,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Update coach profile verification status if approved
    if (status === 'APPROVED' && request.userId) {
      await prisma.coach_profiles.update({
        where: { userId: request.userId! },
        data: {
          verificationStatus: 'APPROVED',
          updatedAt: new Date(),
        },
      });
    } else if (status === 'REJECTED' && request.userId) {
      await prisma.coach_profiles.update({
        where: { userId: request.userId! },
        data: {
          verificationStatus: 'REJECTED',
          updatedAt: new Date(),
        },
      });
    }

    return request;
  }

  /**
   * Update coach statistics (sales, ratings)
   */
  async updateCoachStats(userId: string): Promise<coach_profiles> {
    // Get marketplace plans for this coach
    const plans = await prisma.marketplace_plans.findMany({
      where: { coachId: userId },
      include: {
        plan_ratings: true,
        plan_purchases: {
          where: { status: 'COMPLETED' },
        },
      },
    });

    // Calculate total sales
    const totalSales = plans.reduce(
      (sum, plan) => sum + plan.plan_purchases.length,
      0
    );

    // Calculate average rating and total reviews
    const allRatings = plans.flatMap((plan) => plan.plan_ratings);
    const totalReviews = allRatings.length;
    const averageRating =
      totalReviews > 0
        ? allRatings.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : null;

    // Update coach profile
    return await prisma.coach_profiles.update({
      where: { userId },
      data: {
        totalSales,
        averageRating,
        totalReviews,
        updatedAt: new Date(),
      },
    });
  }
}

/**
 * Export singleton instance
 */
export const coachService = new CoachService();
