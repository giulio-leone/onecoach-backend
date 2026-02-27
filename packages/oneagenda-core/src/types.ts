/**
 * OneAgenda Core Types
 *
 * Enums and interfaces used across the agenda domain.
 */

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
  BLOCKED = 'BLOCKED',
}

export enum TaskPriority {
  URGENT = 'URGENT',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface GoalData {
  title: string;
  description?: string;
  targetDate?: string;
  priority?: TaskPriority;
  metadata?: Record<string, unknown>;
}

export interface TaskData {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  estimatedMinutes?: number;
  goalId?: string;
  projectId?: string;
  metadata?: Record<string, unknown>;
}

export interface TaskUpdateData {
  title?: string;
  description?: string;
  dueDate?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  estimatedMinutes?: number;
  metadata?: Record<string, unknown>;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  goalId?: string;
  projectId?: string;
  dueBefore?: string;
  dueAfter?: string;
}

export interface QueryOptions {
  role?: string;
  summary?: boolean;
}

export interface CalendarProvider {
  id: string;
  provider: string;
  userId: string;
  calendarUrl?: string;
  syncEnabled: boolean;
  lastSyncAt?: string;
}

export interface CalendarProviderConfig {
  provider: string;
  userId: string;
  calendarUrl?: string;
  syncEnabled?: boolean;
}

export interface UserPreferences {
  timezone: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  focusPreference: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANY';
  workingDays: number[];
}

export interface PlanDayInput {
  userId: string;
  date: string;
  tasks: unknown[];
  events: unknown[];
}

export interface SuggestInput {
  userId: string;
  currentContext: Record<string, unknown>;
}

export interface TrackProgressInput {
  userId: string;
  tasks: unknown[];
  goals: unknown[];
  milestones?: unknown[];
  periodStart: string;
  periodEnd: string;
}
