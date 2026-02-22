import { prisma } from './prisma';
import { type Prisma, InvitationType, InvitationStatus } from '@prisma/client';

export interface CreateInvitationInput {
  type: InvitationType;
  maxUses?: number;
  expiresAt?: Date;
  createdById: string;
  metadata?: Record<string, unknown>;
  code?: string; // Optional custom code
}

export interface InvitationValidationResult {
  isValid: boolean;
  invitation?: Awaited<ReturnType<typeof prisma.invitations.findUnique>>;
  error?: string;
}

export class InvitationService {
  /**
   * Generate a unique invitation code
   */
  private static async generateUniqueCode(length = 8): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    let isUnique = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    while (!isUnique && attempts < MAX_ATTEMPTS) {
      attempts++;
      code = '';
      for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const existing = await prisma.invitations.findUnique({
        where: { code },
      });

      if (!existing) {
        isUnique = true;
      }
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique invitation code after multiple attempts');
    }

    return code;
  }

  /**
   * Create a new invitation
   */
  static async createInvitation(input: CreateInvitationInput) {
    const code = input.code || (await this.generateUniqueCode());

    // If custom code provided, ensure uniqueness
    if (input.code) {
      const existing = await prisma.invitations.findUnique({
        where: { code: input.code },
      });
      if (existing) {
        throw new Error('Invitation code already exists');
      }
    }

    return prisma.invitations.create({
      data: {
        code,
        type: input.type,
        maxUses: input.type === 'ONE_TIME' ? 1 : input.maxUses || 1,
        expiresAt: input.expiresAt,
        createdById: input.createdById,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Validate an invitation code
   */
  static async validateInvitation(code: string): Promise<InvitationValidationResult> {
    const invitation = await prisma.invitations.findUnique({
      where: { code },
    });

    if (!invitation) {
      return { isValid: false, error: 'Invalid invitation code' };
    }

    if (invitation.status !== 'ACTIVE') {
      return { isValid: false, error: `Invitation is ${invitation.status.toLowerCase()}` };
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      // Auto-expire if date passed
      await prisma.invitations.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return { isValid: false, error: 'Invitation has expired' };
    }

    if (invitation.usedCount >= invitation.maxUses) {
      // Auto-mark used if limit reached
      await prisma.invitations.update({
        where: { id: invitation.id },
        data: { status: 'USED' },
      });
      return { isValid: false, error: 'Invitation usage limit reached' };
    }

    return { isValid: true, invitation };
  }

  /**
   * Use an invitation (to be called during registration)
   */
  static async useInvitation(code: string, userId: string) {
    // Initial validation (checks existence, expiry, status)
    // We don't rely on this for concurrency, but it gives good error messages
    const validation = await this.validateInvitation(code);
    if (!validation.isValid || !validation.invitation) {
      throw new Error(validation.error || 'Invalid invitation');
    }

    const invitationId = validation.invitation.id;

    return prisma.$transaction(async (tx) => {
      // 1. Increment usage count atomically
      const updatedInvitation = await tx.invitations.update({
        where: { id: invitationId },
        data: {
          usedCount: { increment: 1 },
        },
      });

      // 2. Check if we exceeded the limit (Concurrency Check)
      if (updatedInvitation.usedCount > updatedInvitation.maxUses) {
        throw new Error('Invitation usage limit reached');
      }

      // 3. If we reached the limit exactly, mark as USED
      if (updatedInvitation.usedCount === updatedInvitation.maxUses) {
        await tx.invitations.update({
          where: { id: invitationId },
          data: { status: 'USED' },
        });
      }

      // 4. Create usage record
      await tx.invitation_uses.create({
        data: {
          invitationId: invitationId,
          userId,
        },
      });

      // 5. Link user to invitation
      await tx.users.update({
        where: { id: userId },
        data: { invitationId: invitationId },
      });

      return updatedInvitation;
    });
  }

  /**
   * Revoke an invitation
   */
  static async revokeInvitation(id: string) {
    return prisma.invitations.update({
      where: { id },
      data: { status: 'REVOKED' },
    });
  }

  /**
   * Get invitations with filtering
   */
  static async getInvitations(params: {
    page?: number;
    limit?: number;
    status?: InvitationStatus;
    type?: InvitationType;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.invitationsWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.search) {
      where.code = { contains: params.search, mode: 'insensitive' };
    }

    const [total, items] = await Promise.all([
      prisma.invitations.count({ where }),
      prisma.invitations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
          _count: {
            select: { uses: true },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Expire invitations that have passed their expiration date
   */
  static async expireInvitations() {
    const now = new Date();
    const result = await prisma.invitations.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return result.count;
  }
}
