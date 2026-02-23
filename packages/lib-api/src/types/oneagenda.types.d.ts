export declare enum TaskPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}
export declare enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
  CANCELLED = 'CANCELLED',
}
export type Task = {
  id: string;
  title?: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags?: string[];
  goalId?: string;
  milestoneId?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};
export declare enum GoalStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ON_TRACK = 'ON_TRACK',
  AT_RISK = 'AT_RISK',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}
export declare enum GoalTimeHorizon {
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
//# sourceMappingURL=oneagenda.types.d.ts.map
