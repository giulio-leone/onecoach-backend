import type { Task as BaseTask } from '@giulio-leone/types/domain';

export enum TaskPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
  CANCELLED = 'CANCELLED',
}

export type Task = BaseTask & {
  tags?: string[];
  goalId?: string;
  [key: string]: unknown;
};

export enum GoalStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ON_TRACK = 'ON_TRACK',
  AT_RISK = 'AT_RISK',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export enum GoalTimeHorizon {
  SHORT_TERM = 'SHORT_TERM',
  MEDIUM_TERM = 'MEDIUM_TERM',
  LONG_TERM = 'LONG_TERM',
}

export type Goal = {
  id: string;
  title?: string;
  description?: string;
  status: GoalStatus;
  timeHorizon?: GoalTimeHorizon;
  startDate?: string;
  targetDate?: string;
  completedAt?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};
