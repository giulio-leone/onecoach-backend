/**
 * Milestone Service for MCP Tools
 *
 * Servizio server-side per gestione milestone OneAgenda
 * Usa Prisma direttamente invece di API HTTP calls
 */

import { getTypedDbClient } from '@giulio-leone/core';
const prisma = getTypedDbClient();
import type { MilestoneStatus } from '@prisma/client';

export interface CreateMilestoneInput {
  projectId: string;
  name: string;
  description?: string;
  dueDate?: string;
  dependencies?: string[];
}

export interface UpdateMilestoneInput {
  name?: string;
  description?: string;
  status?: MilestoneStatus;
  dueDate?: string;
  dependencies?: string[];
}

export interface MilestoneWithDetails {
  id: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  dueDate: Date | null;
  order: number;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

class MilestoneService {
  /**
   * Crea una nuova milestone
   */
  async create(userId: string, input: CreateMilestoneInput): Promise<MilestoneWithDetails> {
    // Verifica che il progetto appartenga all'utente
    const project = await prisma.agenda_projects.findFirst({
      where: { id: input.projectId, userId },
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    // Trova l'ordine massimo per le milestone del progetto
    const maxOrderResult = await prisma.agenda_milestones.aggregate({
      where: { projectId: input.projectId },
      _max: { order: true },
    });
    const nextOrder = (maxOrderResult._max.order ?? -1) + 1;

    const milestone = await prisma.agenda_milestones.create({
      data: {
        name: input.name,
        description: input.description,
        status: 'PENDING',
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        order: nextOrder,
        projectId: input.projectId,
      },
    });

    // Crea dipendenze se specificate
    if (input.dependencies && input.dependencies.length > 0) {
      await prisma.agenda_milestone_dependencies.createMany({
        data: input.dependencies.map((blockerId: any) => ({
          blockedId: milestone.id,
          blockerId,
        })),
      });
    }

    return {
      id: milestone.id,
      title: milestone.name,
      description: milestone.description,
      status: milestone.status,
      dueDate: milestone.dueDate,
      order: milestone.order,
      projectId: milestone.projectId,
      createdAt: milestone.createdAt,
      updatedAt: milestone.updatedAt,
    };
  }

  /**
   * Aggiorna una milestone
   */
  async update(
    userId: string,
    milestoneId: string,
    input: UpdateMilestoneInput
  ): Promise<MilestoneWithDetails | null> {
    const existingMilestone = await prisma.agenda_milestones.findFirst({
      where: { id: milestoneId },
    });

    if (!existingMilestone) {
      return null;
    }

    const ownerProject = await prisma.agenda_projects.findFirst({
      where: { id: existingMilestone.projectId, userId },
    });

    if (!ownerProject) {
      return null;
    }

    const milestone = await prisma.agenda_milestones.update({
      where: { id: milestoneId },
      data: {
        name: input.name,
        description: input.description,
        status: input.status,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      },
    });

    // Aggiorna dipendenze se specificate
    if (input.dependencies !== undefined) {
      // Rimuovi dipendenze esistenti
      await prisma.agenda_milestone_dependencies.deleteMany({
        where: { blockedId: milestoneId },
      });

      // Aggiungi nuove dipendenze
      if (input.dependencies.length > 0) {
        await prisma.agenda_milestone_dependencies.createMany({
          data: input.dependencies.map((blockerId: any) => ({
            blockedId: milestoneId,
            blockerId,
          })),
        });
      }
    }

    return {
      id: milestone.id,
      title: milestone.name,
      description: milestone.description,
      status: milestone.status,
      dueDate: milestone.dueDate,
      order: milestone.order,
      projectId: milestone.projectId,
      createdAt: milestone.createdAt,
      updatedAt: milestone.updatedAt,
    };
  }

  /**
   * Elimina una milestone
   */
  async delete(userId: string, milestoneId: string): Promise<boolean> {
    const existingMilestone = await prisma.agenda_milestones.findFirst({
      where: { id: milestoneId },
    });

    if (!existingMilestone) {
      return false;
    }

    const ownerProject = await prisma.agenda_projects.findFirst({
      where: { id: existingMilestone.projectId, userId },
    });

    if (!ownerProject) {
      return false;
    }

    await prisma.agenda_milestones.delete({
      where: { id: milestoneId },
    });

    return true;
  }
}

export const milestoneService = new MilestoneService();
