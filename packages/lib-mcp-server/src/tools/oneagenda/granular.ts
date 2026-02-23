/**
 * MCP Tools: Granular OneAgenda Management
 *
 * Advanced MCP tools for granular manipulation of OneAgenda projects/tasks.
 * Provides unified interface for the Modification Agent.
 *
 * @module lib-mcp-server/tools/oneagenda/granular
 */

import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { prisma, type Prisma } from '@giulio-leone/lib-core';
import { successResult } from '@giulio-leone/lib-copilot/framework';

// =====================================================
// Schema Definitions
// =====================================================

const AgendaModificationActionSchema = z.enum([
  'update_project',
  'update_task',
  'complete_task',
  'update_milestone',
]);

const AgendaModificationTargetSchema = z.object({
  // Targeting
  taskId: z.string().optional().describe('Task ID'),
  taskTitle: z.string().optional().describe('Task title (fuzzy match)'),
  milestoneId: z.string().optional().describe('Milestone ID'),
});

const AgendaModificationChangesSchema = z.object({
  // Common
  title: z.string().optional().describe('New title'),
  description: z.string().optional().describe('New description'),
  dueDate: z.string().optional().describe('ISO date string'),

  // Status/Priority
  status: z
    .enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED', 'ON_HOLD', 'ACTIVE'])
    .optional()
    .describe(
      'New status. Task: TODO/IN_PROGRESS/COMPLETED. Project: ACTIVE/COMPLETED/ARCHIVED/ON_HOLD'
    ),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().describe('New priority'),

  // Project specific
  color: z.string().optional().describe('Hex color'),
});

const agendaApplyModificationParams = z
  .object({
    projectId: z.string().describe('Project ID'),
    action: AgendaModificationActionSchema,
    target: AgendaModificationTargetSchema,
    changes: AgendaModificationChangesSchema.optional(),
  })
  .refine(
    (data) => {
      // For update actions, changes must be present (except complete_task which implies status=COMPLETED)
      if (data.action !== 'complete_task') {
        return data.changes && Object.keys(data.changes).length > 0;
      }
      return true;
    },
    { message: 'You MUST provide at least one field in "changes"' }
  );

type AgendaApplyModificationParams = z.infer<typeof agendaApplyModificationParams>;

// =====================================================
// Tool Implementation
// =====================================================

export const agendaApplyModificationTool: McpTool<AgendaApplyModificationParams> = {
  name: 'oneagenda_apply_modification',
  description: `Applies granular modifications to OneAgenda projects and tasks.
  
Supported Actions:
- update_project: Change title, status, color
- update_task: Change title, priority, due date
- complete_task: Quickly mark task as COMPLETED
- update_milestone: Change milestone properties

Examples:
- "Completa il task 'Design'": action=complete_task, target={taskTitle: 'Design'}
- "Rendi urgente il task X": action=update_task, changes={priority: 'HIGH'}`,

  parameters: agendaApplyModificationParams,

  execute: async (args, _context: McpContext) => {
    const { projectId, action, target, changes } = args;

    // Verify project exists
    const project = await prisma.agenda_projects.findUnique({
      where: { id: projectId },
    });

    if (!project) throw new Error('Project not found');

    let message = '';

    switch (action) {
      case 'update_project': {
        const updateData: Prisma.agenda_projectsUpdateInput = {};
        if (changes?.title) updateData.title = changes.title;
        if (changes?.description) updateData.description = changes.description;
        if (changes?.status)
          updateData.status = changes.status as unknown as typeof updateData.status; // Cast needed as enum might differ slightly or be safe
        if (changes?.dueDate) updateData.endDate = changes.dueDate;
        if (changes?.color) updateData.color = changes.color;

        await prisma.agenda_projects.update({
          where: { id: projectId },
          data: updateData,
        });
        message = `Project updated`;
        break;
      }

      case 'update_task': {
        let taskId = target.taskId;

        // Fuzzy finding if no ID
        if (!taskId && target.taskTitle) {
          const tasks = await prisma.agenda_tasks.findMany({
            where: {
              projectId,
              title: { contains: target.taskTitle, mode: 'insensitive' },
            },
            take: 1,
          });
          if (tasks[0]) taskId = tasks[0].id;
        }

        if (!taskId) throw new Error('Task not found');

        const updateData: Prisma.agenda_tasksUpdateInput = {};
        if (changes?.title) updateData.title = changes.title;
        if (changes?.description) updateData.description = changes.description;
        if (changes?.status)
          updateData.status = changes.status as unknown as typeof updateData.status;
        if (changes?.priority)
          updateData.priority = changes.priority as unknown as typeof updateData.priority;
        if (changes?.dueDate) updateData.dueDate = changes.dueDate;

        await prisma.agenda_tasks.update({
          where: { id: taskId },
          data: updateData,
        });
        message = `Task updated`;
        break;
      }

      case 'complete_task': {
        let taskId = target.taskId;

        // Fuzzy finding if no ID
        if (!taskId && target.taskTitle) {
          const tasks = await prisma.agenda_tasks.findMany({
            where: {
              projectId,
              title: { contains: target.taskTitle, mode: 'insensitive' },
            },
            take: 1,
          });
          if (tasks[0]) taskId = tasks[0].id;
        }

        if (!taskId) throw new Error('Task not found');

        await prisma.agenda_tasks.update({
          where: { id: taskId },
          data: { status: 'COMPLETED' },
        });
        message = `Task completed`;
        break;
      }

      case 'update_milestone': {
        if (!target.milestoneId) throw new Error('Milestone ID required');

        const updateData: Prisma.agenda_milestonesUpdateInput = {};
        if (changes?.title) updateData.name = changes.title;
        if (changes?.dueDate) updateData.dueDate = changes.dueDate;
        // Status enum map might cover milestone status too

        await prisma.agenda_milestones.update({
          where: { id: target.milestoneId },
          data: updateData,
        });
        message = `Milestone updated`;
        break;
      }
    }

    return successResult(message, { projectId });
  },
};
