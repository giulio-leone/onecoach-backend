/**
 * Intelligent Assistant Service
 *
 * AI-powered planning, activity suggestions, and progress tracking.
 * Uses the one-agenda planner under the hood.
 */

import { planDay } from '@giulio-leone/one-agenda';
import type { PlanDayInput, SuggestInput, TrackProgressInput } from './types';

export class IntelligentAssistantService {
  async planDay(input: PlanDayInput): Promise<unknown> {
    const { tasks, events } = input;

    // Map tasks to planner format
    const plannerTasks = (tasks as Array<Record<string, unknown>>).map(
      (t, i) => ({
        id: (t.id as string) ?? `task-${i}`,
        title: (t.title as string) ?? 'Untitled',
        estimatedMinutes: (t.estimatedMinutes as number) ?? 30,
        dueDate: (t.dueDate as string) ?? null,
        priority: this.mapPriority((t.priority as string) ?? 'MEDIUM'),
        score: 50,
        tags: [],
        project: null,
        dependencies: [],
        requiredPeople: [],
        preferredWindow: null,
        allowFragmentation: false,
        focusType: 'DEEP' as const,
      }),
    );

    // Map events to planner format
    const plannerEvents = (events as Array<Record<string, unknown>>).map(
      (e, i) => ({
        id: (e.id as string) ?? `event-${i}`,
        title: (e.title as string) ?? 'Event',
        start: (e.startTime as string) ?? (e.start as string) ?? '',
        end: (e.endTime as string) ?? (e.end as string) ?? '',
        source: 'EXTERNAL' as const,
        meeting: { attendees: [], meetingLink: null },
        category: 'OTHER' as const,
        flexibility: 'FIXED' as const,
        createdFrom: 'CALENDAR' as const,
      }),
    );

    const plan = planDay({
      date: input.date,
      timezone: 'Europe/Rome',
      tasks: plannerTasks,
      events: plannerEvents,
      constraints: [],
      preferences: {
        workingHours: [{ start: '09:00', end: '18:00' }],
        focusBlocks: [],
        meetingFreeDays: [],
        timezone: 'Europe/Rome',
        minimumBreakMinutes: 15,
        transitionBufferMinutes: 5,
        defaultMeetingDurationMinutes: 30,
      },
      emailActions: [],
    });

    return plan;
  }

  async suggestNextActivity(input: SuggestInput): Promise<unknown> {
    const { currentContext } = input;
    const timeOfDay = this.getTimeOfDay();
    const energyLevel = (currentContext.energyLevel as string) ?? 'medium';

    return {
      suggestion: {
        type: timeOfDay === 'morning' ? 'DEEP_WORK' : 'LIGHT_TASK',
        reason: `Based on ${timeOfDay} time slot and ${energyLevel} energy`,
        estimatedMinutes: timeOfDay === 'morning' ? 90 : 30,
      },
      alternatives: [
        { type: 'BREAK', reason: 'Take a short break', estimatedMinutes: 15 },
        {
          type: 'REVIEW',
          reason: 'Review completed work',
          estimatedMinutes: 20,
        },
      ],
    };
  }

  async trackProgress(input: TrackProgressInput): Promise<unknown> {
    const { tasks, goals, periodStart, periodEnd } = input;
    const taskList = tasks as Array<Record<string, unknown>>;
    const goalList = goals as Array<Record<string, unknown>>;

    const completed = taskList.filter((t) => t.status === 'DONE').length;
    const total = taskList.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const goalProgress = goalList.map((g) => ({
      id: g.id,
      title: g.title,
      percentComplete: g.percentComplete ?? 0,
      status: g.status,
    }));

    return {
      period: { start: periodStart, end: periodEnd },
      tasks: {
        total,
        completed,
        inProgress: taskList.filter((t) => t.status === 'IN_PROGRESS').length,
        blocked: taskList.filter((t) => t.status === 'BLOCKED').length,
        completionRate,
      },
      goals: goalProgress,
      insights: [
        completionRate >= 80
          ? 'Excellent productivity this period!'
          : completionRate >= 50
            ? 'Good progress, keep going!'
            : 'Consider breaking tasks into smaller chunks.',
      ],
    };
  }

  // --- Private ---

  private mapPriority(
    p: string,
  ): 'MUST' | 'SHOULD' | 'COULD' | 'WONT' {
    const upper = p.toUpperCase();
    if (upper === 'URGENT' || upper === 'HIGH') return 'MUST';
    if (upper === 'MEDIUM') return 'SHOULD';
    if (upper === 'LOW') return 'COULD';
    return 'SHOULD';
  }

  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }
}
