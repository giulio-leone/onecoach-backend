/**
 * Task Service for MCP Tools
 *
 * Servizio server-side per gestione task OneAgenda
 * Usa Prisma direttamente invece di API HTTP calls
 */

import { prisma } from '@giulio-leone/lib-core';
import type { TaskStatus, TaskPriority } from '@prisma/client';

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  milestoneId?: string;
  parentId?: string;
  dueDate?: Date;
  priority?: TaskPriority;
  dependencies?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  milestoneId?: string;
  parentId?: string;
  dependencies?: string[];
}

export interface TaskWithDetails {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  completedAt: Date | null;
  order: number;
  projectId: string | null;
  milestoneId: string | null;
  parentId: string | null;
  subTasks: SubTaskInfo[];
  createdAt: Date;
  updatedAt: Date;
}

interface SubTaskInfo {
  id: string;
  title: string;
  status: string;
  order: number;
}

class TaskService {
  /**
   * Crea un nuovo task
   */
  async create(userId: string, input: CreateTaskInput): Promise<TaskWithDetails> {
    // Verifica che il progetto appartenga all'utente
    const project = await prisma.agenda_projects.findFirst({
      where: { id: input.projectId, userId },
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    // Trova l'ordine massimo per i task del progetto
    const maxOrderResult = await prisma.agenda_tasks.aggregate({
      where: { projectId: input.projectId },
      _max: { order: true },
    });
    const nextOrder = (maxOrderResult._max.order ?? -1) + 1;

    const task = await prisma.agenda_tasks.create({
      data: {
        title: input.title,
        description: input.description,
        status: 'TODO',
        priority: input.priority ?? 'MEDIUM',
        dueDate: input.dueDate,
        order: nextOrder,
        projectId: input.projectId,
        milestoneId: input.milestoneId,
        parentId: input.parentId,
        userId,
      },
    });

    // Crea dipendenze se specificate
    if (input.dependencies && input.dependencies.length > 0) {
      await prisma.agenda_task_dependencies.createMany({
        data: input.dependencies.map((blockerId: any) => ({
          blockedId: task.id,
          blockerId,
        })),
      });
    }

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      order: task.order,
      projectId: task.projectId,
      milestoneId: task.milestoneId,
      parentId: task.parentId,
      subTasks: [],
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  /**
   * Lista tutti i task dell'utente
   */
  async list(userId: string, projectId?: string, status?: TaskStatus): Promise<TaskWithDetails[]> {
    // Prima trova tutti i progetti dell'utente
    const userProjects = await prisma.agenda_projects.findMany({
      where: { userId },
      select: { id: true },
    });
    const projectIds = userProjects.map((p: any) => p.id);

    interface WhereClause {
      projectId: { in: string[] } | string;
      status?: TaskStatus;
    }

    const whereClause: WhereClause = {
      projectId: projectId ? projectId : { in: projectIds },
    };

    if (status) {
      whereClause.status = status;
    }

    const tasks = await prisma.agenda_tasks.findMany({
      where: whereClause,
      orderBy: { order: 'asc' },
    });

    const taskIds = tasks.map((t: any) => t.id);
    const subTasks = await prisma.agenda_tasks.findMany({
      where: { parentId: { in: taskIds } },
      orderBy: { order: 'asc' },
    });
    const subTaskMap = subTasks.reduce<Record<string, typeof subTasks>>((acc, st) => {
      if (!st.parentId) return acc;
      const parentId = st.parentId;
      acc[parentId] = acc[parentId] || [];
      acc[parentId].push(st);
      return acc;
    }, {});

    return tasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      order: task.order,
      projectId: task.projectId,
      milestoneId: task.milestoneId,
      parentId: task.parentId,
      subTasks: (subTaskMap[task.id] || []).map((st: any) => ({
        id: st.id,
        title: st.title,
        status: st.status,
        order: st.order,
      })),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));
  }

  /**
   * Aggiorna un task
   */
  async update(
    userId: string,
    taskId: string,
    input: UpdateTaskInput
  ): Promise<TaskWithDetails | null> {
    // Verifica che il task appartenga a un progetto dell'utente
    const existingTask = await prisma.agenda_tasks.findFirst({
      where: { id: taskId },
    });

    if (!existingTask) {
      return null;
    }

    const ownerProject = existingTask.projectId
      ? await prisma.agenda_projects.findFirst({
          where: { id: existingTask.projectId, userId },
        })
      : null;

    if (!ownerProject) {
      return null;
    }

    const task = await prisma.agenda_tasks.update({
      where: { id: taskId },
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate,
        milestoneId: input.milestoneId,
        parentId: input.parentId,
        completedAt: input.status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    // Aggiorna dipendenze se specificate
    if (input.dependencies !== undefined) {
      // Rimuovi dipendenze esistenti
      await prisma.agenda_task_dependencies.deleteMany({
        where: { blockedId: taskId },
      });

      // Aggiungi nuove dipendenze
      if (input.dependencies.length > 0) {
        await prisma.agenda_task_dependencies.createMany({
          data: input.dependencies.map((blockerId: any) => ({
            blockedId: taskId,
            blockerId,
          })),
        });
      }
    }

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      order: task.order,
      projectId: task.projectId,
      milestoneId: task.milestoneId,
      parentId: task.parentId,
      subTasks: [],
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  /**
   * Elimina un task
   */
  async delete(userId: string, taskId: string): Promise<boolean> {
    const existingTask = await prisma.agenda_tasks.findFirst({
      where: { id: taskId },
    });

    if (!existingTask) {
      return false;
    }

    const ownerProject = existingTask.projectId
      ? await prisma.agenda_projects.findFirst({
          where: { id: existingTask.projectId, userId },
        })
      : null;

    if (!ownerProject) {
      return false;
    }

    await prisma.agenda_tasks.delete({
      where: { id: taskId },
    });

    return true;
  }

  /**
   * Riordina i task
   */
  async reorder(userId: string, tasks: Array<{ id: string; order: number }>): Promise<boolean> {
    // Verifica che tutti i task appartengano all'utente
    for (const task of tasks) {
      const existingTask = await prisma.agenda_tasks.findFirst({
        where: { id: task.id },
      });

      if (!existingTask) {
        return false;
      }

      const ownerProject = existingTask.projectId
        ? await prisma.agenda_projects.findFirst({
            where: { id: existingTask.projectId, userId },
          })
        : null;

      if (!ownerProject) {
        return false;
      }
    }

    // Aggiorna l'ordine di tutti i task
    await prisma.$transaction(
      tasks.map((task: any) =>
        prisma.agenda_tasks.update({
          where: { id: task.id },
          data: { order: task.order },
        })
      )
    );

    return true;
  }
}

export const taskService = new TaskService();
