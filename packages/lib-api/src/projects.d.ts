import type { Project } from '@giulio-leone/types';
export interface ProjectsResponse {
  projects: Project[];
}
export interface CreateProjectInput {
  title: string;
  description?: string;
  dueDate?: Date;
  status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'ON_HOLD';
  color?: string;
}
export declare const projectsApi: {
  getAll: () => Promise<ProjectsResponse>;
  getById: (id: string) => Promise<{
    project: Project;
  }>;
  create: (input: CreateProjectInput) => Promise<{
    project: Project;
  }>;
  update: (
    id: string,
    input: Partial<CreateProjectInput>
  ) => Promise<{
    project: Project;
  }>;
  delete: (id: string) => Promise<void>;
};
export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId: string;
  milestoneId?: string;
  parentId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dueDate?: Date;
  dependencies?: string[];
}
export declare const tasksApi: {
  create: (input: CreateTaskInput) => Promise<{
    task: unknown;
  }>;
  update: (
    id: string,
    input: Partial<CreateTaskInput>
  ) => Promise<{
    task: unknown;
  }>;
  delete: (id: string) => Promise<void>;
  reorder: (
    updates: {
      id: string;
      order: number;
      parentId?: string | null;
    }[]
  ) => Promise<void>;
};
export interface CreateMilestoneInput {
  name: string;
  description?: string;
  projectId: string;
  dueDate?: Date;
  order?: number;
  dependencies?: string[];
}
export declare const milestonesApi: {
  create: (input: CreateMilestoneInput) => Promise<{
    milestone: unknown;
  }>;
  update: (
    id: string,
    input: Partial<CreateMilestoneInput>
  ) => Promise<{
    milestone: unknown;
  }>;
  delete: (id: string) => Promise<void>;
};
//# sourceMappingURL=projects.d.ts.map
