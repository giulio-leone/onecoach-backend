/**
 * OneAgenda Database Service
 *
 * CRUD operations for goals and tasks via Prisma.
 * Follows hexagonal architecture: this is the adapter for persistence.
 */

import { getDbClient } from '@giulio-leone/core';
const prisma = getDbClient() as import('@prisma/client').PrismaClient;
import type {
  GoalData,
  TaskData,
  TaskUpdateData,
  TaskFilters,
  QueryOptions,
  UserPreferences,
} from './types';

class OneAgendaDB {
  // --- Goals ---

  async getGoals(
    userId: string,
    filters?: Record<string, unknown>,
    options?: QueryOptions,
  ): Promise<unknown[]> {
    const where: Record<string, unknown> = { userId };

    if (options?.role === 'COACH') {
      // Coach can see assigned user goals
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const goals = await prisma.agenda_goals.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return goals;
  }

  async getGoal(
    id: string,
    userId: string,
  ): Promise<unknown | null> {
    return prisma.agenda_goals.findFirst({
      where: { id, userId },
      include: {
        milestones: true,
      } as any,
    });
  }

  async createGoal(
    userId: string,
    data: GoalData,
  ): Promise<unknown> {
    return prisma.agenda_goals.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        status: 'ACTIVE',
        percentComplete: 0,
        context: (data.metadata ?? {}) as any,
      },
    });
  }

  async deleteGoal(
    id: string,
    userId: string,
  ): Promise<void> {
    await prisma.agenda_goals.deleteMany({
      where: { id, userId },
    });
  }

  // --- Tasks ---

  async getTasks(
    userId: string,
    filters?: TaskFilters,
    options?: QueryOptions,
  ): Promise<unknown[]> {
    const where: Record<string, unknown> = { userId };

    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.goalId) where.goalId = filters.goalId;
    if (filters?.projectId) where.projectId = filters.projectId;

    const tasks = await prisma.agenda_tasks.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });

    if (options?.summary) {
      return tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
      }));
    }

    return tasks;
  }

  async getTask(
    id: string,
    userId: string,
    _options?: QueryOptions,
  ): Promise<unknown | null> {
    return prisma.agenda_tasks.findFirst({
      where: { id, userId },
    });
  }

  async createTask(
    userId: string,
    data: TaskData,
    _options?: QueryOptions,
  ): Promise<unknown> {
    return prisma.agenda_tasks.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: (data.priority ?? 'MEDIUM') as any,
        status: (data.status ?? 'TODO') as any,
        estimatedMinutes: data.estimatedMinutes,
        goalId: data.goalId,
        projectId: data.projectId,
        metadata: (data.metadata ?? {}) as any,
      },
    });
  }

  async updateTask(
    id: string,
    userId: string,
    data: TaskUpdateData,
    _options?: QueryOptions,
  ): Promise<unknown> {
    return prisma.agenda_tasks.updateMany({
      where: { id, userId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(data.priority !== undefined && { priority: data.priority as any }),
        ...(data.status !== undefined && { status: data.status as any }),
        ...(data.estimatedMinutes !== undefined && {
          estimatedMinutes: data.estimatedMinutes,
        }),
        ...(data.metadata !== undefined && { metadata: data.metadata as any }),
      },
    });
  }

  async deleteTask(
    id: string,
    userId: string,
    _options?: QueryOptions,
  ): Promise<void> {
    await prisma.agenda_tasks.deleteMany({
      where: { id, userId },
    });
  }

  // --- Preferences ---

  async getUserPreferences(
    userId: string,
  ): Promise<UserPreferences | null> {
    const prefs = await prisma.agenda_user_preferences.findUnique({
      where: { userId },
    });

    if (!prefs) return null;

    return {
      timezone: prefs.timezone ?? 'Europe/Rome',
      workingHoursStart: prefs.workingHoursStart ?? '09:00',
      workingHoursEnd: prefs.workingHoursEnd ?? '18:00',
      focusPreference: 'ANY',
      workingDays: [1, 2, 3, 4, 5],
    };
  }
}

export const oneagendaDB = new OneAgendaDB();
