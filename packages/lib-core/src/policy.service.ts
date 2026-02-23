/**
 * Policy Service
 *
 * Gestione delle policy pages (Privacy, Terms, GDPR, Content Policy)
 */

import { prisma } from './prisma';
import { PolicyStatus, PolicyType, type Prisma } from '@prisma/client';
import type { policies, policy_history } from '@prisma/client';

export interface CreatePolicyParams {
  slug: string;
  type: PolicyType;
  title: string;
  content: string;
  metaDescription?: string;
  status?: PolicyStatus;
  createdById: string;
}

export interface UpdatePolicyParams {
  id: string;
  slug?: string;
  title?: string;
  content?: string;
  metaDescription?: string;
  status?: PolicyStatus;
  updatedById: string;
  changeReason?: string;
}

export interface PolicyWithCreator extends policies {
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  updatedBy?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

/**
 * Policy Service
 */
export class PolicyService {
  /**
   * Ottiene tutte le policy
   */
  static async getAllPolicies(includeCreator = false): Promise<PolicyWithCreator[]> {
    return (await prisma.policies.findMany({
      include: includeCreator
        ? {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            updatedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    })) as PolicyWithCreator[];
  }

  /**
   * Ottiene le policy pubblicate
   */
  static async getPublishedPolicies(): Promise<policies[]> {
    return await prisma.policies.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Ottiene una policy per ID
   */
  static async getPolicyById(
    id: string,
    includeCreator = false
  ): Promise<PolicyWithCreator | null> {
    return (await prisma.policies.findUnique({
      where: { id },
      include: includeCreator
        ? {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            updatedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          }
        : undefined,
    })) as PolicyWithCreator | null;
  }

  /**
   * Ottiene una policy per slug
   */
  static async getPolicyBySlug(slug: string): Promise<policies | null> {
    return await prisma.policies.findUnique({
      where: { slug },
    });
  }

  /**
   * Ottiene una policy per tipo
   */
  static async getPolicyByType(type: PolicyType): Promise<policies | null> {
    return await prisma.policies.findUnique({
      where: { type },
    });
  }

  /**
   * Crea una nuova policy
   */
  static async createPolicy(params: CreatePolicyParams): Promise<policies> {
    const { slug, type, title, content, metaDescription, status, createdById } = params;

    // Verifica che non esista già una policy di questo tipo
    const existing = await this.getPolicyByType(type);
    if (existing) {
      throw new Error(`Una policy di tipo ${type} esiste già`);
    }

    const policy = await prisma.policies.create({
      data: {
        slug,
        type,
        title,
        content,
        metaDescription,
        status: status ?? 'DRAFT',
        version: 1,
        createdById,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    // Crea record nello storico
    await this.createHistoryRecord(policy, createdById, 'Creazione iniziale');

    return policy;
  }

  /**
   * Aggiorna una policy esistente
   */
  static async updatePolicy(params: UpdatePolicyParams): Promise<policies> {
    const { id, slug, title, content, metaDescription, status, updatedById, changeReason } = params;

    // Ottieni policy corrente per storico
    const currentPolicy = await this.getPolicyById(id);

    if (!currentPolicy) {
      throw new Error('Policy non trovata');
    }

    // Prepara i dati da aggiornare
    const updateData: Prisma.policiesUpdateInput = {
      updatedAt: new Date(),
      ...(updatedById
        ? {
            updatedBy: {
              connect: { id: updatedById },
            },
          }
        : {}),
    };

    if (slug !== undefined) updateData.slug = slug;
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;

    // Gestione cambio di stato
    if (status !== undefined && status !== currentPolicy.status) {
      updateData.status = status;

      // Se viene pubblicata, incrementa la versione e setta publishedAt
      if (status === 'PUBLISHED' && currentPolicy.status !== 'PUBLISHED') {
        updateData.version = currentPolicy.version + 1;
        updateData.publishedAt = new Date();
      }
    }

    // Aggiorna la policy
    const updatedPolicy = await prisma.policies.update({
      where: { id },
      data: updateData,
    });

    // Crea record nello storico
    await this.createHistoryRecord(updatedPolicy, updatedById, changeReason);

    return updatedPolicy;
  }

  /**
   * Elimina una policy
   */
  static async deletePolicy(id: string): Promise<void> {
    await prisma.policies.delete({
      where: { id },
    });
  }

  /**
   * Crea un record nello storico
   */
  private static async createHistoryRecord(
    policy: policies,
    changedBy: string,
    changeReason?: string
  ): Promise<policy_history> {
    return await prisma.policy_history.create({
      data: {
        policyId: policy.id,
        version: policy.version,
        slug: policy.slug,
        type: policy.type,
        title: policy.title,
        content: policy.content,
        metaDescription: policy.metaDescription,
        status: policy.status,
        changedBy,
        changeReason,
      },
    });
  }

  /**
   * Ottiene lo storico di una policy
   */
  static async getPolicyHistory(policyId: string, limit = 20): Promise<policy_history[]> {
    return await prisma.policy_history.findMany({
      where: { policyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Ottiene tutto lo storico
   */
  static async getAllHistory(limit = 50): Promise<policy_history[]> {
    return await prisma.policy_history.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Verifica se uno slug è disponibile
   */
  static async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await prisma.policies.findFirst({
      where: {
        slug,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return !existing;
  }

  /**
   * Genera uno slug da un titolo
   */
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Pubblica una policy
   */
  static async publishPolicy(id: string, userId: string): Promise<policies> {
    return await this.updatePolicy({
      id,
      status: 'PUBLISHED',
      updatedById: userId,
      changeReason: 'Pubblicazione policy',
    });
  }

  /**
   * Archivia una policy
   */
  static async archivePolicy(id: string, userId: string): Promise<policies> {
    return await this.updatePolicy({
      id,
      status: 'ARCHIVED',
      updatedById: userId,
      changeReason: 'Archiviazione policy',
    });
  }

  /**
   * Ottiene le statistiche delle policy
   */
  static async getPolicyStats() {
    const total = await prisma.policies.count();
    const published = await prisma.policies.count({ where: { status: 'PUBLISHED' } });
    const draft = await prisma.policies.count({ where: { status: 'DRAFT' } });
    const archived = await prisma.policies.count({ where: { status: 'ARCHIVED' } });

    return {
      total,
      published,
      draft,
      archived,
    };
  }
}
