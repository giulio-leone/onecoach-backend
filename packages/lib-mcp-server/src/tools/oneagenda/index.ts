/**
 * OneAgenda MCP Tools
 *
 * Tool per gestione progetti, task, milestone e habit
 * Usa servizi server-side con Prisma direttamente (non API HTTP)
 *
 * Pattern: Come food_create, tutti i tool accedono direttamente al database
 * tramite i servizi, passando userId dal context MCP
 */

import { z } from 'zod';
import type { McpTool } from '../../types';
import {
  projectService,
  taskService,
  milestoneService,
  habitService,
} from '../../services/oneagenda';
import { oneAgendaImportTool } from './import';

// ============================================================================
// PROJECT TOOLS
// ============================================================================

export const createProjectTool: McpTool = {
  name: 'oneagenda_create_project',
  description: 'Creates a new project in OneAgenda',
  parameters: z.object({
    title: z.string().describe('The title of the project'),
    description: z.string().optional().describe('The description of the project'),
    dueDate: z.string().optional().describe('The due date (ISO string)'),
    color: z.string().optional().describe('The color hex code (e.g. #3B82F6)'),
  }),
  execute: async (args, context) => {
    console.log('📁 [oneagenda_create_project] Creazione progetto...');
    console.log('📁 [oneagenda_create_project] Args:', JSON.stringify(args, null, 2));
    console.log('📁 [oneagenda_create_project] UserId:', context.userId);

    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const project = await projectService.create(context.userId, {
      title: args.title,
      description: args.description,
      dueDate: args.dueDate ? new Date(args.dueDate) : undefined,
      color: args.color,
    });

    console.log('✅ [oneagenda_create_project] Progetto creato:', project.id);

    return {
      content: [
        {
          type: 'text',
          text: `Project created successfully: "${project.title}" (ID: ${project.id})`,
        },
      ],
      project,
    };
  },
};

export const listProjectsTool: McpTool = {
  name: 'oneagenda_list_projects',
  description: 'Lists all projects in OneAgenda',
  parameters: z.object({
    status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED', 'ON_HOLD']).optional(),
  }),
  execute: async (args, context) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const projects = await projectService.list(context.userId, args.status);

    return {
      content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }],
      projects,
    };
  },
};

export const getProjectTool: McpTool = {
  name: 'oneagenda_get_project',
  description: 'Gets a specific project with all milestones and tasks',
  parameters: z.object({
    projectId: z.string().describe('The ID of the project'),
  }),
  execute: async (args, context) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const project = await projectService.getById(context.userId, args.projectId);

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(project, null, 2) }],
      project,
    };
  },
};

export const updateProjectTool: McpTool = {
  name: 'oneagenda_update_project',
  description: 'Updates a project in OneAgenda',
  parameters: z.object({
    projectId: z.string().describe('The ID of the project to update'),
    title: z.string().optional().describe('New title'),
    description: z.string().optional().describe('New description'),
    status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED', 'ON_HOLD']).optional(),
    dueDate: z.string().optional().describe('New due date (ISO string)'),
    color: z.string().optional().describe('New color hex code'),
  }),
  execute: async (args, context) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const { projectId, ...updates } = args;
    const project = await projectService.update(context.userId, projectId, {
      title: updates.title,
      description: updates.description,
      status: updates.status,
      dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
      color: updates.color,
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    return {
      content: [{ type: 'text', text: `Project updated: ${project.title}` }],
      project,
    };
  },
};

export const deleteProjectTool: McpTool = {
  name: 'oneagenda_delete_project',
  description: 'Deletes a project and all its milestones and tasks',
  parameters: z.object({
    projectId: z.string().describe('The ID of the project to delete'),
  }),
  execute: async (args, context) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const success = await projectService.delete(context.userId, args.projectId);

    if (!success) {
      throw new Error('Project not found or access denied');
    }

    return {
      content: [{ type: 'text', text: `Project deleted successfully` }],
    };
  },
};

// ============================================================================
// MILESTONE TOOLS
// ============================================================================

export const createMilestoneTool: McpTool = {
  name: 'oneagenda_create_milestone',
  description: 'Creates a new milestone in a project',
  parameters: z.object({
    projectId: z.string().describe('The project ID'),
    title: z.string().describe('The title of the milestone'),
    description: z.string().optional().describe('Description'),
    dueDate: z.string().optional().describe('Due date (ISO string)'),
    dependencies: z.array(z.string()).optional().describe('IDs of milestones this depends on'),
  }),
  execute: async (args, context) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const milestone = await milestoneService.create(context.userId, {
      projectId: args.projectId,
      name: args.title,
      description: args.description,
      dueDate: args.dueDate,
      dependencies: args.dependencies,
    });

    return {
      content: [
        { type: 'text', text: `Milestone created: ${milestone.title} (ID: ${milestone.id})` },
      ],
      milestone,
    };
  },
};

export const updateMilestoneTool: McpTool = {
  name: 'oneagenda_update_milestone',
  description: 'Updates a milestone',
  parameters: z.object({
    milestoneId: z.string().describe('The milestone ID'),
    title: z.string().optional().describe('New title'),
    description: z.string().optional().describe('New description'),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
    dueDate: z.string().optional().describe('New due date (ISO string)'),
    dependencies: z.array(z.string()).optional().describe('New dependency IDs'),
  }),
  execute: async (args, context) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const { milestoneId, title, ...updates } = args;
    const milestone = await milestoneService.update(context.userId, milestoneId, {
      name: title,
      ...updates,
    });

    if (!milestone) {
      throw new Error('Milestone not found or access denied');
    }

    return {
      content: [{ type: 'text', text: `Milestone updated: ${milestone.title}` }],
      milestone,
    };
  },
};

export const deleteMilestoneTool: McpTool = {
  name: 'oneagenda_delete_milestone',
  description: 'Deletes a milestone',
  parameters: z.object({
    milestoneId: z.string().describe('The milestone ID to delete'),
  }),
  execute: async (args, context) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const success = await milestoneService.delete(context.userId, args.milestoneId);

    if (!success) {
      throw new Error('Milestone not found or access denied');
    }

    return {
      content: [{ type: 'text', text: `Milestone deleted successfully` }],
    };
  },
};

// ============================================================================
// TASK TOOLS
// ============================================================================

export const createTaskTool: McpTool = {
  name: 'oneagenda_create_task',
  description: 'Creates a new task in OneAgenda',
  parameters: z.object({
    projectId: z.string().describe('The project ID'),
    title: z.string().describe('The title of the task'),
    description: z.string().optional().describe('The description'),
    milestoneId: z.string().optional().describe('The milestone ID (optional)'),
    parentId: z.string().optional().describe('Parent task ID for sub-tasks'),
    dueDate: z.string().optional().describe('Due date (ISO string)'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
    dependencies: z.array(z.string()).optional().describe('IDs of tasks this depends on'),
  }),
  execute: async (args, context) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const task = await taskService.create(context.userId, {
      projectId: args.projectId,
      title: args.title,
      description: args.description,
      milestoneId: args.milestoneId,
      parentId: args.parentId,
      dueDate: args.dueDate ? new Date(args.dueDate) : undefined,
      priority: args.priority,
      dependencies: args.dependencies,
    });

    return {
      content: [{ type: 'text', text: `Task created: ${task.title} (ID: ${task.id})` }],
      task,
    };
  },
};

export const listTasksTool: McpTool = {
  name: 'oneagenda_list_tasks',
  description: 'Lists tasks, optionally filtered by project or status',
  parameters: z.object({
    projectId: z.string().optional().describe('Filter by project ID'),
    status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
  }),
  execute: async (args, context) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const tasks = await taskService.list(context.userId, args.projectId, args.status);

    return {
      content: [{ type: 'text', text: JSON.stringify(tasks, null, 2) }],
      tasks,
    };
  },
};

export const updateTaskTool: McpTool = {
  name: 'oneagenda_update_task',
  description: 'Updates a task',
  parameters: z.object({
    taskId: z.string().describe('The task ID'),
    title: z.string().optional().describe('New title'),
    description: z.string().optional().describe('New description'),
    status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    dueDate: z.string().optional().describe('New due date (ISO string)'),
    milestoneId: z.string().optional().describe('Move to milestone'),
    parentId: z.string().optional().describe('Move to parent task'),
    dependencies: z.array(z.string()).optional().describe('New dependency IDs'),
  }),
  execute: async (args, context) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const { taskId, dueDate, ...updates } = args;
    const task = await taskService.update(context.userId, taskId, {
      ...updates,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    if (!task) {
      throw new Error('Task not found or access denied');
    }

    return {
      content: [{ type: 'text', text: `Task updated: ${task.title}` }],
      task,
    };
  },
};

export const updateTaskStatusTool: McpTool = {
  name: 'oneagenda_update_task_status',
  description: 'Quickly updates task status',
  parameters: z.object({
    taskId: z.string().describe('The task ID'),
    status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).describe('New status'),
  }),
  execute: async (args, context) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const task = await taskService.update(context.userId, args.taskId, {
      status: args.status,
    });

    if (!task) {
      throw new Error('Task not found or access denied');
    }

    return {
      content: [{ type: 'text', text: `Task "${task.title}" status changed to ${args.status}` }],
      task,
    };
  },
};

export const deleteTaskTool: McpTool = {
  name: 'oneagenda_delete_task',
  description: 'Deletes a task',
  parameters: z.object({
    taskId: z.string().describe('The task ID to delete'),
  }),
  execute: async (args, context) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const success = await taskService.delete(context.userId, args.taskId);

    if (!success) {
      throw new Error('Task not found or access denied');
    }

    return {
      content: [{ type: 'text', text: `Task deleted successfully` }],
    };
  },
};

export const reorderTasksTool: McpTool = {
  name: 'oneagenda_reorder_tasks',
  description: 'Reorders tasks by providing new order values',
  parameters: z.object({
    tasks: z
      .array(
        z.object({
          id: z.string(),
          order: z.number(),
        })
      )
      .describe('Array of task IDs with new order values'),
  }),
  execute: async (args, context) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const success = await taskService.reorder(context.userId, args.tasks);

    if (!success) {
      throw new Error('Failed to reorder tasks - some tasks not found or access denied');
    }

    return {
      content: [{ type: 'text', text: `Reordered ${args.tasks.length} tasks` }],
    };
  },
};

// ============================================================================
// HABIT TOOLS
// ============================================================================

export const createHabitTool: McpTool = {
  name: 'oneagenda_create_habit',
  description: 'Creates a new habit in OneAgenda',
  parameters: z.object({
    title: z.string().describe('The title of the habit'),
    frequency: z.enum(['DAILY', 'WEEKLY']).describe('The frequency'),
    description: z.string().optional().describe('Description'),
    color: z.string().optional().describe('Color hex code'),
  }),
  execute: async (args, context) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const habit = await habitService.create(context.userId, {
      title: args.title,
      frequency: args.frequency,
      description: args.description,
      color: args.color,
    });

    return {
      content: [{ type: 'text', text: `Habit created: ${habit.title} (ID: ${habit.id})` }],
      habit,
    };
  },
};

export const updateHabitTool: McpTool = {
  name: 'oneagenda_update_habit',
  description: 'Updates a habit in OneAgenda',
  parameters: z.object({
    habitId: z.string().describe('The habit ID to update'),
    title: z.string().optional().describe('New title'),
    description: z.string().optional().describe('New description'),
    frequency: z.enum(['DAILY', 'WEEKLY']).optional().describe('New frequency'),
    color: z.string().optional().describe('New color hex code'),
  }),
  execute: async (args, context) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const { habitId, ...updates } = args;
    const habit = await habitService.update(context.userId, habitId, updates);

    if (!habit) {
      throw new Error('Habit not found or access denied');
    }

    return {
      content: [{ type: 'text', text: `Habit updated: ${habit.title}` }],
      habit,
    };
  },
};

export const deleteHabitTool: McpTool = {
  name: 'oneagenda_delete_habit',
  description: 'Deletes a habit from OneAgenda',
  parameters: z.object({
    habitId: z.string().describe('The habit ID to delete'),
  }),
  execute: async (args, context) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const success = await habitService.delete(context.userId, args.habitId);

    if (!success) {
      throw new Error('Habit not found or access denied');
    }

    return {
      content: [{ type: 'text', text: `Habit deleted successfully` }],
    };
  },
};

export const toggleHabitTool: McpTool = {
  name: 'oneagenda_toggle_habit',
  description: 'Toggles habit completion for today',
  parameters: z.object({
    habitId: z.string().describe('The habit ID'),
  }),
  execute: async (args, context) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const habit = await habitService.toggle(context.userId, args.habitId);

    if (!habit) {
      throw new Error('Habit not found or access denied');
    }

    const statusText = habit.completedToday ? 'completed' : 'uncompleted';
    return {
      content: [{ type: 'text', text: `Habit "${habit.title}" ${statusText} for today` }],
      habit,
    };
  },
};

export const listHabitsTool: McpTool = {
  name: 'oneagenda_list_habits',
  description: 'Lists all habits with streak and completion info',
  parameters: z.object({}),
  execute: async (_args, context) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const habits = await habitService.list(context.userId);

    return {
      content: [{ type: 'text', text: JSON.stringify(habits, null, 2) }],
      habits,
    };
  },
};

// ============================================================================
// DASHBOARD TOOLS
// ============================================================================

export const getAgendaDashboardTool: McpTool = {
  name: 'oneagenda_get_dashboard',
  description: "Gets a summary of today's agenda including tasks, habits, and projects",
  parameters: z.object({}),
  execute: async (_args, context) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const [projects, habits, tasks] = await Promise.all([
      projectService.list(context.userId),
      habitService.list(context.userId),
      taskService.list(context.userId),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueTodayTasks = tasks.filter((t) => {
      if (!t.dueDate) return false;
      const taskDate = new Date(t.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime() && t.status !== 'COMPLETED';
    });

    const overdueTasks = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'COMPLETED') return false;
      const taskDate = new Date(t.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() < today.getTime();
    });

    const summary = {
      projects: {
        total: projects.length,
        active: projects.filter((p) => p.status === 'ACTIVE').length,
      },
      habits: {
        total: habits.length,
        completedToday: habits.filter((h) => h.completedToday).length,
      },
      tasks: {
        total: tasks.length,
        dueToday: dueTodayTasks.length,
        overdue: overdueTasks.length,
      },
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
      summary,
    };
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

import { agendaApplyModificationTool } from './granular';

export const oneagendaTools: McpTool[] = [
  // Projects
  createProjectTool,
  listProjectsTool,
  getProjectTool,
  updateProjectTool,
  deleteProjectTool,
  // Milestones
  createMilestoneTool,
  updateMilestoneTool,
  deleteMilestoneTool,
  // Tasks
  createTaskTool,
  listTasksTool,
  updateTaskTool,
  updateTaskStatusTool,
  deleteTaskTool,
  reorderTasksTool,
  // Import
  oneAgendaImportTool,
  // Habits
  createHabitTool,
  updateHabitTool,
  deleteHabitTool,
  toggleHabitTool,
  listHabitsTool,
  // Granular Modifications
  agendaApplyModificationTool,
  // Dashboard
  getAgendaDashboardTool,
];
