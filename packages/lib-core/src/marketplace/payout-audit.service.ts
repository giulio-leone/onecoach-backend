/**
 * Payout Audit Service
 *
 * Servizio per gestire audit log dei payout
 */

import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

export type PayoutAuditAction = 'CREATED' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';

interface CreateAuditLogParams {
  userId?: string;
  rewardIds: string[];
  action: PayoutAuditAction;
  amount?: number;
  currencyCode?: string;
  performedBy: string;
  notes?: string;
  metadata?: Prisma.JsonValue;
}

export class PayoutAuditService {
  /**
   * Crea un audit log entry
   */
  static async createAuditLog(params: CreateAuditLogParams) {
    const { userId, rewardIds, action, amount, currencyCode, performedBy, notes, metadata } =
      params;

    return prisma.payout_audit_log.create({
      data: {
        userId: userId || null,
        rewardIds: rewardIds,
        action,
        amount: amount ? new Prisma.Decimal(amount) : null,
        currencyCode: currencyCode || null,
        performedBy,
        notes: notes || null,
        ...(metadata && { metadata }),
      },
    });
  }

  /**
   * Recupera audit logs per utente
   */
  static async getAuditLogsByUser(userId: string, limit = 50) {
    return prisma.payout_audit_log.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Recupera audit logs per admin che ha eseguito azioni
   */
  static async getAuditLogsByPerformer(performedBy: string, limit = 50) {
    return prisma.payout_audit_log.findMany({
      where: { performedBy },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Recupera tutti gli audit logs (con filtri opzionali)
   */
  static async getAllAuditLogs(params?: {
    userId?: string;
    action?: PayoutAuditAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: Prisma.payout_audit_logWhereInput = {};

    if (params?.userId) {
      where.userId = params.userId;
    }

    if (params?.action) {
      where.action = params.action;
    }

    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    return prisma.payout_audit_log.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.limit || 100,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
