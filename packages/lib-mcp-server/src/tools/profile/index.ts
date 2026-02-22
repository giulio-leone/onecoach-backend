/**
 * MCP Profile Tools
 *
 * Tools for managing user profile, body measurements, and goals.
 * KISS: Simple CRUD operations
 * SOLID: Single responsibility per tool
 * DRY: Reuse existing services
 *
 * @module lib-mcp-server/tools/profile
 */

import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { userProfileService, prisma } from '@giulio-leone/lib-core';
import { createId } from '@giulio-leone/lib-shared';

// ============================================================================
// PROFILE TOOLS
// ============================================================================

const profileGetSchema = z.object({
  includeMeasurements: z.boolean().optional().default(false).describe('Include body measurements'),
  includeGoals: z.boolean().optional().default(false).describe('Include goals'),
  includeSnapshots: z.boolean().optional().default(false).describe('Include progress snapshots'),
});

type ProfileGetArgs = z.infer<typeof profileGetSchema>;

export const profileGetTool: McpTool<ProfileGetArgs> = {
  name: 'profile_get',
  description:
    'Retrieves complete user profile including optional measurements, goals, and snapshots. Use this to understand user characteristics and preferences.',
  parameters: profileGetSchema,
  execute: async (args: ProfileGetArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const profile = await userProfileService.getSerialized(context.userId);

    const result: any = { profile };

    if (args.includeMeasurements) {
      const measurements = await prisma.body_measurements.findMany({
        where: { userId: context.userId },
        orderBy: { date: 'desc' },
        take: 10,
      });
      result.measurements = measurements;
    }

    if (args.includeGoals) {
      const goals = await prisma.user_goals.findMany({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      result.goals = goals;
    }

    if (args.includeSnapshots) {
      const snapshots = await prisma.user_progress_snapshots.findMany({
        where: { userId: context.userId },
        orderBy: { date: 'desc' },
        take: 10,
      });
      result.snapshots = snapshots;
    }

    return {
      content: [
        {
          type: 'text',
          text: `👤 **Profilo Utente**

Età: ${profile.age ?? 'N/A'}
Sesso: ${profile.sex ?? 'N/A'}
Altezza: ${profile.heightCm ?? 'N/A'} cm
Peso: ${profile.weightKg ?? 'N/A'} kg
Livello attività: ${profile.activityLevel ?? 'N/A'}
Frequenza allenamento: ${profile.trainingFrequency ?? 'N/A'} volte/settimana
Obiettivi workout: ${profile.workoutGoals?.join(', ') || 'Nessuno'}
Obiettivi nutrizione: ${profile.nutritionGoals?.join(', ') || 'Nessuno'}

${args.includeMeasurements && result.measurements ? `\n📏 Misurazioni: ${result.measurements.length} trovate` : ''}
${args.includeGoals && result.goals ? `\n🎯 Obiettivi: ${result.goals.length} trovati` : ''}
${args.includeSnapshots && result.snapshots ? `\n📊 Snapshot: ${result.snapshots.length} trovati` : ''}`,
        },
      ],
      ...result,
    };
  },
};

const profileUpdateSchema = z.object({
  age: z.number().int().min(1).max(150).optional(),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  heightCm: z.number().positive().optional(),
  weightKg: z.number().positive().optional(),
  weightUnit: z.enum(['KG', 'LBS']).optional(),
  activityLevel: z.enum(['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE']).optional(),
  trainingFrequency: z.number().int().min(0).max(7).optional(),
  dailyCalories: z.number().int().positive().optional(),
  workoutGoals: z.array(z.string()).optional(),
  nutritionGoals: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  dietaryPreferences: z.array(z.string()).optional(),
  dietType: z
    .enum(['OMNIVORE', 'VEGETARIAN', 'VEGAN', 'PESCATARIAN', 'KETO', 'PALEO', 'MEDITERRANEAN'])
    .optional(),
  healthNotes: z.string().max(2000).optional(),
});

type ProfileUpdateArgs = z.infer<typeof profileUpdateSchema>;

export const profileUpdateTool: McpTool<ProfileUpdateArgs> = {
  name: 'profile_update',
  description:
    'Updates one or more profile fields. All fields are optional - only provided fields will be updated.',
  parameters: profileUpdateSchema,
  execute: async (args: ProfileUpdateArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    await userProfileService.update(context.userId, args);

    const updatedFields = Object.keys(args).join(', ');

    return {
      content: [
        {
          type: 'text',
          text: `✅ Profilo aggiornato

Campi modificati: ${updatedFields}`,
        },
      ],
      profile: await userProfileService.getSerialized(context.userId),
    };
  },
};

const profileUpdateBatchSchema = z.object({
  updates: z.record(z.string(), z.unknown()).describe('Object with profile fields to update'),
});

type ProfileUpdateBatchArgs = z.infer<typeof profileUpdateBatchSchema>;

export const profileUpdateBatchTool: McpTool<ProfileUpdateBatchArgs> = {
  name: 'profile_update_batch',
  description:
    'Updates multiple profile fields in a single operation. More efficient than multiple individual updates.',
  parameters: profileUpdateBatchSchema,
  execute: async (args: ProfileUpdateBatchArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    // Validate batch updates using the same schema
    const validated = profileUpdateSchema.parse(args.updates);
    await userProfileService.update(context.userId, validated);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Profilo aggiornato in batch

Campi modificati: ${Object.keys(args.updates).length}`,
        },
      ],
      profile: await userProfileService.getSerialized(context.userId),
    };
  },
};

// ============================================================================
// BODY MEASUREMENT TOOLS
// ============================================================================

const bodyMeasurementCreateSchema = z.object({
  date: z.string().describe('Measurement date (ISO date string)'),
  weight: z.number().positive().optional(),
  bodyFat: z.number().min(0).max(100).optional(),
  muscleMass: z.number().positive().optional(),
  chest: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  hips: z.number().positive().optional(),
  thigh: z.number().positive().optional(),
  arm: z.number().positive().optional(),
  calf: z.number().positive().optional(),
  neck: z.number().positive().optional(),
  shoulders: z.number().positive().optional(),
  notes: z.string().max(2000).optional(),
  photos: z.array(z.string()).optional(),
});

type BodyMeasurementCreateArgs = z.infer<typeof bodyMeasurementCreateSchema>;

export const bodyMeasurementCreateTool: McpTool<BodyMeasurementCreateArgs> = {
  name: 'body_measurement_create',
  description:
    'Creates a new body measurement entry. Use this to track weight, body fat, measurements, etc.',
  parameters: bodyMeasurementCreateSchema,
  execute: async (args: BodyMeasurementCreateArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const measurement = await prisma.body_measurements.create({
      data: {
        id: createId(),
        userId: context.userId,
        date: new Date(args.date),
        weight: args.weight ?? null,
        bodyFat: args.bodyFat ?? null,
        muscleMass: args.muscleMass ?? null,
        chest: args.chest ?? null,
        waist: args.waist ?? null,
        hips: args.hips ?? null,
        thigh: args.thigh ?? null,
        arm: args.arm ?? null,
        calf: args.calf ?? null,
        neck: args.neck ?? null,
        shoulders: args.shoulders ?? null,
        notes: args.notes ?? null,
        photos: args.photos ?? [],
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Misurazione corporea creata

Data: ${args.date}
${args.weight ? `Peso: ${args.weight} kg` : ''}
${args.bodyFat ? `Grasso corporeo: ${args.bodyFat}%` : ''}`,
        },
      ],
      measurement,
    };
  },
};

const bodyMeasurementGetSchema = z.object({
  startDate: z.string().optional().describe('Start date filter (ISO date string)'),
  endDate: z.string().optional().describe('End date filter (ISO date string)'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .describe('Maximum number of results'),
  latest: z.boolean().optional().default(false).describe('Get only the latest measurement'),
});

type BodyMeasurementGetArgs = z.infer<typeof bodyMeasurementGetSchema>;

export const bodyMeasurementGetTool: McpTool<BodyMeasurementGetArgs> = {
  name: 'body_measurement_get',
  description:
    'Retrieves body measurements with optional filters. Use this to track progress over time.',
  parameters: bodyMeasurementGetSchema,
  execute: async (args: BodyMeasurementGetArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    if (args.latest) {
      const measurement = await prisma.body_measurements.findFirst({
        where: { userId: context.userId },
        orderBy: { date: 'desc' },
      });

      return {
        content: [
          {
            type: 'text',
            text: measurement
              ? `📏 **Ultima Misurazione**

Data: ${measurement.date.toISOString().split('T')[0]}
Peso: ${measurement.weight ?? 'N/A'} kg
Grasso corporeo: ${measurement.bodyFat ?? 'N/A'}%`
              : 'Nessuna misurazione trovata',
          },
        ],
        measurement,
      };
    }

    const where: any = { userId: context.userId };
    if (args.startDate || args.endDate) {
      where.date = {};
      if (args.startDate) where.date.gte = new Date(args.startDate);
      if (args.endDate) where.date.lte = new Date(args.endDate);
    }

    const measurements = await prisma.body_measurements.findMany({
      where,
      orderBy: { date: 'desc' },
      take: args.limit,
    });

    return {
      content: [
        {
          type: 'text',
          text: `📏 **Misurazioni Corporee** (${measurements.length} trovate)

${measurements.length > 0 ? measurements.map((m: any) => `- ${m.date.toISOString().split('T')[0]}: ${m.weight ?? 'N/A'} kg`).join('\n') : 'Nessuna misurazione trovata'}`,
        },
      ],
      measurements,
    };
  },
};

const bodyMeasurementUpdateSchema = z.object({
  id: z.string().describe('Measurement ID to update'),
  date: z.string().optional(),
  weight: z.number().positive().optional(),
  bodyFat: z.number().min(0).max(100).optional(),
  muscleMass: z.number().positive().optional(),
  chest: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  hips: z.number().positive().optional(),
  thigh: z.number().positive().optional(),
  arm: z.number().positive().optional(),
  calf: z.number().positive().optional(),
  neck: z.number().positive().optional(),
  shoulders: z.number().positive().optional(),
  notes: z.string().max(2000).optional(),
  photos: z.array(z.string()).optional(),
});

type BodyMeasurementUpdateArgs = z.infer<typeof bodyMeasurementUpdateSchema>;

export const bodyMeasurementUpdateTool: McpTool<BodyMeasurementUpdateArgs> = {
  name: 'body_measurement_update',
  description: 'Updates an existing body measurement. Only provided fields will be updated.',
  parameters: bodyMeasurementUpdateSchema,
  execute: async (args: BodyMeasurementUpdateArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    // Verify ownership
    const existing = await prisma.body_measurements.findUnique({
      where: { id: args.id },
    });

    if (!existing || existing.userId !== context.userId) {
      throw new Error('Measurement not found or unauthorized');
    }

    const updateData: any = {};
    if (args.date !== undefined) updateData.date = new Date(args.date);
    if (args.weight !== undefined) updateData.weight = args.weight;
    if (args.bodyFat !== undefined) updateData.bodyFat = args.bodyFat;
    if (args.muscleMass !== undefined) updateData.muscleMass = args.muscleMass;
    if (args.chest !== undefined) updateData.chest = args.chest;
    if (args.waist !== undefined) updateData.waist = args.waist;
    if (args.hips !== undefined) updateData.hips = args.hips;
    if (args.thigh !== undefined) updateData.thigh = args.thigh;
    if (args.arm !== undefined) updateData.arm = args.arm;
    if (args.calf !== undefined) updateData.calf = args.calf;
    if (args.neck !== undefined) updateData.neck = args.neck;
    if (args.shoulders !== undefined) updateData.shoulders = args.shoulders;
    if (args.notes !== undefined) updateData.notes = args.notes;
    if (args.photos !== undefined) updateData.photos = args.photos;

    const updated = await prisma.body_measurements.update({
      where: { id: args.id },
      data: updateData,
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Misurazione aggiornata

ID: ${args.id}`,
        },
      ],
      measurement: updated,
    };
  },
};

const bodyMeasurementDeleteSchema = z.object({
  id: z.string().describe('Measurement ID to delete'),
});

type BodyMeasurementDeleteArgs = z.infer<typeof bodyMeasurementDeleteSchema>;

export const bodyMeasurementDeleteTool: McpTool<BodyMeasurementDeleteArgs> = {
  name: 'body_measurement_delete',
  description: 'Deletes a body measurement entry.',
  parameters: bodyMeasurementDeleteSchema,
  execute: async (args: BodyMeasurementDeleteArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    // Verify ownership
    const existing = await prisma.body_measurements.findUnique({
      where: { id: args.id },
    });

    if (!existing || existing.userId !== context.userId) {
      throw new Error('Measurement not found or unauthorized');
    }

    await prisma.body_measurements.delete({
      where: { id: args.id },
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Misurazione eliminata

ID: ${args.id}`,
        },
      ],
    };
  },
};

// ============================================================================
// GOAL TOOLS
// ============================================================================

const goalCreateSchema = z.object({
  type: z.string().describe('Goal type (e.g., "weight_loss", "muscle_gain", "endurance")'),
  target: z.record(z.string(), z.unknown()).describe('Target data as JSON object'),
  deadline: z.string().optional().describe('Deadline date (ISO date string)'),
  startDate: z.string().describe('Start date (ISO date string)'),
  notes: z.string().max(2000).optional(),
});

type GoalCreateArgs = z.infer<typeof goalCreateSchema>;

export const goalCreateTool: McpTool<GoalCreateArgs> = {
  name: 'goal_create',
  description: 'Creates a new user goal. Use this to set fitness, nutrition, or other objectives.',
  parameters: goalCreateSchema,
  execute: async (args: GoalCreateArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const goal = await prisma.user_goals.create({
      data: {
        id: createId(),
        userId: context.userId,
        type: args.type,
        target: args.target as any,
        deadline: args.deadline ? new Date(args.deadline) : null,
        startDate: new Date(args.startDate),
        status: 'ACTIVE',
        notes: args.notes ?? null,
        progressLogs: [],
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Obiettivo creato

Tipo: ${args.type}
Data inizio: ${args.startDate}
${args.deadline ? `Scadenza: ${args.deadline}` : ''}`,
        },
      ],
      goal,
    };
  },
};

const goalGetSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional().describe('Filter by status'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .describe('Maximum number of results'),
});

type GoalGetArgs = z.infer<typeof goalGetSchema>;

export const goalGetTool: McpTool<GoalGetArgs> = {
  name: 'goal_get',
  description: 'Retrieves user goals with optional status filter.',
  parameters: goalGetSchema,
  execute: async (args: GoalGetArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const where: any = { userId: context.userId };
    if (args.status) {
      where.status = args.status;
    }

    const goals = await prisma.user_goals.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: args.limit,
    });

    return {
      content: [
        {
          type: 'text',
          text: `🎯 **Obiettivi** (${goals.length} trovati)

${goals.length > 0 ? goals.map((g: any) => `- ${g.type} (${g.status}) - Inizio: ${g.startDate.toISOString().split('T')[0]}`).join('\n') : 'Nessun obiettivo trovato'}`,
        },
      ],
      goals,
    };
  },
};

const goalUpdateSchema = z.object({
  id: z.string().describe('Goal ID to update'),
  type: z.string().optional(),
  target: z.record(z.string(), z.unknown()).optional(),
  deadline: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().max(2000).optional(),
});

type GoalUpdateArgs = z.infer<typeof goalUpdateSchema>;

export const goalUpdateTool: McpTool<GoalUpdateArgs> = {
  name: 'goal_update',
  description: 'Updates an existing goal. Only provided fields will be updated.',
  parameters: goalUpdateSchema,
  execute: async (args: GoalUpdateArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    // Verify ownership
    const existing = await prisma.user_goals.findUnique({
      where: { id: args.id },
    });

    if (!existing || existing.userId !== context.userId) {
      throw new Error('Goal not found or unauthorized');
    }

    const updateData: any = {};
    if (args.type !== undefined) updateData.type = args.type;
    if (args.target !== undefined) updateData.target = args.target as any;
    if (args.deadline !== undefined)
      updateData.deadline = args.deadline ? new Date(args.deadline) : null;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.notes !== undefined) updateData.notes = args.notes;
    updateData.updatedAt = new Date();

    const updated = await prisma.user_goals.update({
      where: { id: args.id },
      data: updateData,
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Obiettivo aggiornato

ID: ${args.id}
${args.status ? `Nuovo stato: ${args.status}` : ''}`,
        },
      ],
      goal: updated,
    };
  },
};

const goalDeleteSchema = z.object({
  id: z.string().describe('Goal ID to delete'),
});

type GoalDeleteArgs = z.infer<typeof goalDeleteSchema>;

export const goalDeleteTool: McpTool<GoalDeleteArgs> = {
  name: 'goal_delete',
  description: 'Deletes a user goal.',
  parameters: goalDeleteSchema,
  execute: async (args: GoalDeleteArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    // Verify ownership
    const existing = await prisma.user_goals.findUnique({
      where: { id: args.id },
    });

    if (!existing || existing.userId !== context.userId) {
      throw new Error('Goal not found or unauthorized');
    }

    await prisma.user_goals.delete({
      where: { id: args.id },
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Obiettivo eliminato

ID: ${args.id}`,
        },
      ],
    };
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export const profileTools = [
  profileGetTool,
  profileUpdateTool,
  profileUpdateBatchTool,
  bodyMeasurementCreateTool,
  bodyMeasurementGetTool,
  bodyMeasurementUpdateTool,
  bodyMeasurementDeleteTool,
  goalCreateTool,
  goalGetTool,
  goalUpdateTool,
  goalDeleteTool,
] as const;

import { arrayToToolRecord } from '../../utils/helpers';

export const profileToolsRecord = arrayToToolRecord(profileTools as any);
