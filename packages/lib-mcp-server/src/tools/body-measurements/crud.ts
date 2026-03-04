/**
 * MCP Tools: Body Measurements CRUD
 *
 * Tools for managing body measurements data.
 *
 * @module lib-mcp-server/tools/body-measurements/crud
 */

import { z } from 'zod';
import type { McpTool } from '../../types';
import { getTypedDbClient } from '@giulio-leone/core';
const prisma = getTypedDbClient();

// ==================== LIST ====================

const listParams = z.object({
  userId: z.string().optional().describe('User ID (defaults to current user)'),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
  startDate: z.string().optional().describe('Filter by start date (ISO)'),
  endDate: z.string().optional().describe('Filter by end date (ISO)'),
});

export const bodyMeasurementsListTool: McpTool<z.infer<typeof listParams>> = {
  name: 'body_measurements_list',
  description: 'List body measurements history with pagination and date filtering.',
  parameters: listParams,
  execute: async (args, context) => {
    const userId = args.userId || context.userId;
    if (!userId) throw new Error('User ID required');

    const where: Record<string, unknown> = { userId };
    if (args.startDate) where.date = { ...(where.date as Record<string, unknown>), gte: new Date(args.startDate) };
    if (args.endDate) where.date = { ...(where.date as Record<string, unknown>), lte: new Date(args.endDate) };

    const [items, total] = await Promise.all([
      prisma.body_measurements.findMany({
        where,
        orderBy: { date: 'desc' },
        take: args.limit,
        skip: args.offset,
      }),
      prisma.body_measurements.count({ where }),
    ]);

    return {
      content: [
        {
          type: 'text',
          text: `Found ${total} measurements. Showing ${items.length}.`,
        },
      ],
      data: items,
      meta: {
        total,
        limit: args.limit,
        offset: args.offset,
      },
    };
  },
};

// ==================== CREATE ====================

const createParams = z.object({
  userId: z.string().optional(),
  date: z.string().describe('Date of measurement (ISO)'),
  weight: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  bodyFat: z.number().nullable().optional(),
  muscleMass: z.number().nullable().optional(),
  visceralFat: z.number().nullable().optional(),
  waterPercentage: z.number().nullable().optional(),
  boneMass: z.number().nullable().optional(),
  metabolicAge: z.number().nullable().optional(),
  bmr: z.number().nullable().optional(),
  chest: z.number().nullable().optional(),
  waist: z.number().nullable().optional(),
  hips: z.number().nullable().optional(),
  shoulders: z.number().nullable().optional(),
  arm: z.number().nullable().optional(),
  thigh: z.number().nullable().optional(),
  calf: z.number().nullable().optional(),
  neck: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const bodyMeasurementsCreateTool: McpTool<z.infer<typeof createParams>> = {
  name: 'body_measurements_create',
  description: 'Record new body measurements for a specific date.',
  parameters: createParams,
  execute: async (args, context) => {
    const userId = args.userId || context.userId;
    if (!userId) throw new Error('User ID required');

    const date = new Date(args.date);
    if (isNaN(date.getTime())) throw new Error('Invalid date');

    // Check if entry exists for this date -> preventing duplicates logic if strict, or upsert?
    // User might want to overwrite. Let's use Upsert logic effectively to avoid error.
    // Assuming unique constraint on user+date might exist or not.
    // Logic: Find first by date, if exists update, else create.

    const existing = await prisma.body_measurements.findFirst({
      where: { userId, date },
    });

    const dataPayload = { ...args, userId: undefined, date: undefined }; // exclude special fields

    let result;
    if (existing) {
      result = await prisma.body_measurements.update({
        where: { id: existing.id },
        data: { ...dataPayload, date },
      });
    } else {
      result = await prisma.body_measurements.create({
        data: { ...dataPayload, userId, date },
      });
    }

    return {
      success: true,
      data: result,
      message: existing ? 'Measurement updated' : 'Measurement recorded',
    };
  },
};

// ==================== UPDATE ====================

const updateParamsFull = createParams.omit({ userId: true, date: true }).partial().extend({
  id: z.string(),
  date: z.string().optional(),
});

export const bodyMeasurementsUpdateTool: McpTool<z.infer<typeof updateParamsFull>> = {
  name: 'body_measurements_update',
  description: 'Update an existing measurement entry.',
  parameters: updateParamsFull,
  execute: async (args, context) => {
    const userId = context.userId;
    if (!userId) throw new Error('User ID required');

    const { id, ...data } = args;

    // Verify ownership
    const existing = await prisma.body_measurements.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      throw new Error('Measurement not found or access denied');
    }

    let updateData: Record<string, unknown> = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }

    const result = await prisma.body_measurements.update({
      where: { id },
      data: updateData,
    });

    return { success: true, data: result };
  },
};

// ==================== DELETE ====================

const deleteParams = z.object({
  id: z.string(),
});

export const bodyMeasurementsDeleteTool: McpTool<z.infer<typeof deleteParams>> = {
  name: 'body_measurements_delete',
  description: 'Delete a measurement entry.',
  parameters: deleteParams,
  execute: async (args, context) => {
    const userId = context.userId;
    if (!userId) throw new Error('User ID required');

    // Verify ownership
    const existing = await prisma.body_measurements.findUnique({
      where: { id: args.id },
    });

    if (!existing || existing.userId !== userId) {
      throw new Error('Measurement not found or access denied');
    }

    await prisma.body_measurements.delete({
      where: { id: args.id },
    });
    return { success: true };
  },
};
