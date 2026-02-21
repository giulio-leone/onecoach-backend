/**
 * Timeline Service
 *
 * Auto-tracking service for significant user events.
 * KISS: Simple event detection and creation
 * SOLID: Single responsibility - only timeline management
 */

import { prisma } from '../prisma';
import { createId } from '@onecoach/lib-shared/id-generator';
import { Prisma } from '@prisma/client';
import type { TimelineEvent, TimelineEventType, MemoryDomain, ProgressEventData } from './types';

/**
 * Timeline Service
 */
export class TimelineService {
  /**
   * Create timeline event
   */
  async createEvent(
    userId: string,
    event: Omit<TimelineEvent, 'id' | 'userId' | 'createdAt'>
  ): Promise<TimelineEvent> {
    const timelineEvent = await prisma.user_memory_timeline.create({
      data: {
        id: createId(),
        userId,
        eventType: event.eventType,
        domain: event.domain || null,
        title: event.title,
        description: event.description || null,
        data: (event.data as Prisma.InputJsonValue) || Prisma.JsonNull,
        date: new Date(event.date),
      },
    });

    return {
      id: timelineEvent.id,
      userId: timelineEvent.userId,
      eventType: timelineEvent.eventType as TimelineEventType,
      domain: timelineEvent.domain as MemoryDomain | undefined,
      title: timelineEvent.title,
      description: timelineEvent.description || undefined,
      data: timelineEvent.data as Record<string, unknown> | undefined,
      date: timelineEvent.date.toISOString().split('T')[0]!,
      createdAt: timelineEvent.createdAt.toISOString(),
    };
  }

  /**
   * Auto-detect weight progress (significant changes)
   */
  async detectWeightProgress(userId: string): Promise<void> {
    // Get last 2 body measurements
    const measurements = await prisma.body_measurements.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 2,
    });

    if (measurements.length < 2) return;

    const latest = measurements[0]!;
    const previous = measurements[1]!;

    if (!latest.weight || !previous.weight) return;

    const weightDiff = Number(latest.weight) - Number(previous.weight);
    const daysDiff = Math.floor(
      (latest.date.getTime() - previous.date.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Significant change: > 2kg in < 60 days
    if (Math.abs(weightDiff) >= 2 && daysDiff <= 60) {
      const eventType: TimelineEventType = weightDiff < 0 ? 'progress' : 'progress';
      const progressType: ProgressEventData['type'] =
        weightDiff < 0 ? 'weight_loss' : 'weight_gain';

      // Check if event already exists for this period
      const existing = await prisma.user_memory_timeline.findFirst({
        where: {
          userId,
          eventType: 'progress',
          domain: 'general',
          date: latest.date,
          title: { contains: weightDiff < 0 ? 'Dimagrimento' : 'Aumento peso' },
        },
      });

      if (!existing) {
        await this.createEvent(userId, {
          eventType,
          domain: 'general',
          title:
            weightDiff < 0
              ? `Dimagrimento di ${Math.abs(weightDiff).toFixed(1)}kg`
              : `Aumento peso di ${weightDiff.toFixed(1)}kg`,
          description: `Da ${Number(previous.weight).toFixed(1)}kg a ${Number(latest.weight).toFixed(1)}kg in ${daysDiff} giorni`,
          data: {
            type: progressType,
            value: Math.abs(weightDiff),
            unit: 'kg',
            previousValue: Number(previous.weight),
            period: `${daysDiff} giorni`,
          } as Record<string, unknown>,
          date: latest.date.toISOString().split('T')[0]!,
        });
      }
    }
  }

  /**
   * Track injury from health notes or user input
   */
  async trackInjury(
    userId: string,
    bodyPart: string,
    severity: 'mild' | 'moderate' | 'severe',
    notes?: string
  ): Promise<void> {
    await this.createEvent(userId, {
      eventType: 'injury',
      domain: 'workout',
      title: `Infortunio: ${bodyPart}`,
      description: notes || `Infortunio di gravità ${severity}`,
      data: {
        bodyPart,
        severity,
        recoveryStatus: 'recovering',
        notes,
      } as Record<string, unknown>,
      date: new Date().toISOString().split('T')[0]!,
    });
  }

  /**
   * Track goal status from OneAgenda
   */
  async trackGoal(
    userId: string,
    goalId: string,
    goalType: string,
    status: 'completed' | 'failed' | 'in_progress' | 'behind_schedule',
    targetDate?: Date,
    progress?: number
  ): Promise<void> {
    const title =
      status === 'completed'
        ? `Obiettivo completato: ${goalType}`
        : status === 'failed'
          ? `Obiettivo non raggiunto: ${goalType}`
          : status === 'behind_schedule'
            ? `Obiettivo in ritardo: ${goalType}`
            : `Obiettivo in corso: ${goalType}`;

    await this.createEvent(userId, {
      eventType: 'goal',
      domain: 'oneagenda',
      title,
      description:
        status === 'behind_schedule'
          ? 'Obiettivo in ritardo rispetto alla scadenza prevista'
          : undefined,
      data: {
        goalId,
        goalType,
        status,
        targetDate: targetDate?.toISOString().split('T')[0],
        progress,
      } as Record<string, unknown>,
      date: new Date().toISOString().split('T')[0]!,
    });
  }

  /**
   * Get timeline events for user
   */
  async getTimeline(
    userId: string,
    options: {
      eventType?: TimelineEventType;
      domain?: MemoryDomain;
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {}
  ): Promise<TimelineEvent[]> {
    const where: {
      userId: string;
      eventType?: string;
      domain?: string;
      date?: { gte?: Date; lte?: Date };
    } = {
      userId,
    };

    if (options.eventType) {
      where.eventType = options.eventType;
    }

    if (options.domain) {
      where.domain = options.domain;
    }

    if (options.startDate || options.endDate) {
      where.date = {};
      if (options.startDate) {
        where.date.gte = new Date(options.startDate);
      }
      if (options.endDate) {
        where.date.lte = new Date(options.endDate);
      }
    }

    const events = await prisma.user_memory_timeline.findMany({
      where,
      orderBy: { date: 'desc' },
      take: options.limit || 50,
    });

    return events.map(
      (e: {
        id: string;
        userId: string;
        eventType: string;
        domain: string | null;
        title: string;
        description: string | null;
        data: unknown;
        date: Date;
        createdAt: Date;
      }) => ({
        id: e.id,
        userId: e.userId,
        eventType: e.eventType as TimelineEventType,
        domain: e.domain as MemoryDomain | undefined,
        title: e.title,
        description: e.description || undefined,
        data: e.data as Record<string, unknown> | undefined,
        date: e.date.toISOString().split('T')[0]!,
        createdAt: e.createdAt.toISOString(),
      })
    );
  }

  /**
   * Periodic check for auto-tracking (called by background job)
   */
  async performAutoTracking(userId: string): Promise<void> {
    // Detect weight progress
    await this.detectWeightProgress(userId);

    // Check OneAgenda goals (behind schedule, failed, completed)
    const goals = await prisma.user_goals.findMany({
      where: {
        userId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
    });

    if (goals.length === 0) return;

    // Batch fetch existing timeline events for all goals (avoid N+1)
    const existingEvents = await prisma.user_memory_timeline.findMany({
      where: {
        userId,
        eventType: 'goal',
        domain: 'oneagenda',
      },
      select: {
        data: true,
      },
    });

    // Build a Set of goalIds that already have timeline events
    const trackedGoalIds = new Set<string>();
    for (const event of existingEvents) {
      const data = event.data as Record<string, unknown> | null;
      if (data?.goalId && typeof data.goalId === 'string') {
        trackedGoalIds.add(data.goalId);
      }
    }

    const now = new Date();

    for (const goal of goals) {
      const deadline = goal.deadline ? new Date(goal.deadline) : null;
      const completedDate = goal.completedDate ? new Date(goal.completedDate) : null;

      if (goal.status === 'COMPLETED' && completedDate) {
        // Check if we already tracked this completion (using pre-fetched data)
        if (!trackedGoalIds.has(goal.id)) {
          await this.trackGoal(userId, goal.id, goal.type, 'completed', deadline || undefined);
        }
      } else if (deadline && now > deadline && goal.status === 'ACTIVE') {
        // Goal is behind schedule
        await this.trackGoal(userId, goal.id, goal.type, 'behind_schedule', deadline);
      }
    }
  }
}

// Export singleton
export const timelineService = new TimelineService();
