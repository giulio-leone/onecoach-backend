/**
 * Project Service for MCP Tools
 *
 * Servizio server-side per gestione progetti OneAgenda
 * Usa Prisma direttamente invece di API HTTP calls
 */

import { prisma } from '@giulio-leone/lib-core';
import type { ProjectStatus } from '@prisma/client';

export interface CreateProjectInput {
  title: string;
  description?: string;
  dueDate?: Date;
  startDate?: Date;
  color?: string;
  icon?: string;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  dueDate?: Date;
  startDate?: Date;
  color?: string;
  icon?: string;
}

export interface ProjectWithDetails {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  startDate: Date | null;
  dueDate: Date | null;
  color: string | null;
  icon: string | null;
  progress: number;
  taskCount: number;
  completedTaskCount: number;
  milestones: MilestoneInfo[];
  tasks: TaskInfo[];
  createdAt: Date;
  updatedAt: Date;
}

interface MilestoneInfo {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: Date | null;
  order: number;
}

interface TaskInfo {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  order: number;
  milestoneId: string | null;
  parentId: string | null;
}

class ProjectService {
  /**
   * Crea un nuovo progetto
   */
  async create(userId: string, input: CreateProjectInput): Promise<ProjectWithDetails> {
    const project = await prisma.agenda_projects.create({
      data: {
        name: input.title,
        description: input.description,
        startDate: input.startDate,
        endDate: input.dueDate,
        status: 'ACTIVE',
        color: input.color,
        icon: input.icon,
        userId,
      },
    });

    return {
      id: project.id,
      title: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      dueDate: project.endDate,
      color: project.color,
      icon: project.icon,
      progress: 0,
      taskCount: 0,
      completedTaskCount: 0,
      milestones: [],
      tasks: [],
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  /**
   * Lista tutti i progetti dell'utente
   */
  async list(userId: string, status?: ProjectStatus): Promise<ProjectWithDetails[]> {
    const whereClause: { userId: string; status?: ProjectStatus } = { userId };
    if (status) {
      whereClause.status = status;
    }

    const projects = await prisma.agenda_projects.findMany({
      where: whereClause,
      include: {
        agenda_milestones: {
          orderBy: { order: 'asc' },
        },
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((p: any) => {
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter((t: any) => t.status === 'COMPLETED').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: p.id,
        title: p.name,
        description: p.description,
        status: p.status,
        startDate: p.startDate,
        dueDate: p.endDate,
        color: p.color,
        icon: p.icon,
        progress,
        taskCount: totalTasks,
        completedTaskCount: completedTasks,
        milestones: p.agenda_milestones.map((m: any) => ({
          id: m.id,
          title: m.name,
          description: m.description,
          status: m.status,
          dueDate: m.dueDate,
          order: m.order,
        })),
        tasks: p.tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
          order: t.order,
          milestoneId: t.milestoneId,
          parentId: t.parentId,
        })),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });
  }

  /**
   * Ottiene un progetto specifico con tutti i dettagli
   */
  async getById(userId: string, projectId: string): Promise<ProjectWithDetails | null> {
    const project = await prisma.agenda_projects.findFirst({
      where: { id: projectId, userId },
      include: {
        agenda_milestones: {
          orderBy: { order: 'asc' },
        },
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!project) return null;

    const p = project as Record<string, unknown> & typeof project;
    const totalTasks = p.tasks.length;
    const completedTasks = p.tasks.filter((t: any) => t.status === 'COMPLETED').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: project.id,
      title: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      dueDate: project.endDate,
      color: project.color,
      icon: project.icon,
      progress,
      taskCount: totalTasks,
      completedTaskCount: completedTasks,
      milestones: p.agenda_milestones.map((m: any) => ({
        id: m.id,
        title: m.name,
        description: m.description,
        status: m.status,
        dueDate: m.dueDate,
        order: m.order,
      })),
      tasks: p.tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        order: t.order,
        milestoneId: t.milestoneId,
        parentId: t.parentId,
      })),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  /**
   * Aggiorna un progetto
   */
  async update(
    userId: string,
    projectId: string,
    input: UpdateProjectInput
  ): Promise<ProjectWithDetails | null> {
    // Verifica che il progetto appartenga all'utente
    const existing = await prisma.agenda_projects.findFirst({
      where: { id: projectId, userId },
    });

    if (!existing) return null;

    const project = await prisma.agenda_projects.update({
      where: { id: projectId },
      data: {
        name: input.title,
        description: input.description,
        status: input.status,
        startDate: input.startDate,
        endDate: input.dueDate,
        color: input.color,
        icon: input.icon,
      },
      include: {
        agenda_milestones: {
          orderBy: { order: 'asc' },
        },
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
    });

    const p = project as Record<string, unknown> & typeof project;
    const totalTasks = p.tasks.length;
    const completedTasks = p.tasks.filter((t: any) => t.status === 'COMPLETED').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: project.id,
      title: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      dueDate: project.endDate,
      color: project.color,
      icon: project.icon,
      progress,
      taskCount: totalTasks,
      completedTaskCount: completedTasks,
      milestones: p.agenda_milestones.map((m: any) => ({
        id: m.id,
        title: m.name,
        description: m.description,
        status: m.status,
        dueDate: m.dueDate,
        order: m.order,
      })),
      tasks: p.tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        order: t.order,
        milestoneId: t.milestoneId,
        parentId: t.parentId,
      })),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  /**
   * Elimina un progetto e tutti i suoi task e milestone
   */
  async delete(userId: string, projectId: string): Promise<boolean> {
    const existing = await prisma.agenda_projects.findFirst({
      where: { id: projectId, userId },
    });

    if (!existing) return false;

    await prisma.agenda_projects.delete({
      where: { id: projectId },
    });

    return true;
  }
}

export const projectService = new ProjectService();
