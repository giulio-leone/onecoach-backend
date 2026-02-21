/**
 * MCP Workout Program Tools
 *
 * Tools for workout program generation and CRUD operations.
 * Uses actual Prisma schema table names with JSON structure for weeks/days.
 *
 * Schema facts:
 * - workout_programs: uses snake_case, weeks stored as JSON
 * - No separate workout_weeks, workout_days tables
 * - Uses DifficultyLevel and WorkoutStatus enums
 *
 * @module lib-mcp-server/tools/workout/program
 */

import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { prisma, Prisma } from '@onecoach/lib-core';
import { toPrismaJsonValue } from '@onecoach/lib-shared';
import {
  createMcpTextResponse,
  safeHandleMemoryEvent,
  arrayToToolRecord,
} from '../../utils/helpers';

// Types for JSON weeks structure
interface SetGroup {
  sets: number;
  reps: string;
  rest: number;
  tempo?: string;
  rpe?: number;
}

interface WorkoutExercise {
  exerciseId: string;
  order: number;
  setGroups: SetGroup[];
  notes?: string;
}

interface WorkoutDay {
  dayNumber: number;
  name: string;
  targetMuscles: string[];
  exercises: WorkoutExercise[];
  notes?: string;
}

interface WorkoutWeek {
  weekNumber: number;
  name: string;
  isDeload: boolean;
  days: WorkoutDay[];
}

// ============================================================================
// WORKOUT PROGRAM GENERATION
// ============================================================================

const workoutGenerateProgramSchema = z.object({
  athleteId: z.string(),
  goal: z.enum(['strength', 'hypertrophy', 'endurance', 'power', 'weight_loss', 'general_fitness']),
  durationWeeks: z.number().int().min(4).max(16).default(8),
  daysPerWeek: z.number().int().min(2).max(6).default(4),
  splitType: z
    .enum(['push_pull_legs', 'upper_lower', 'full_body', 'bro_split', 'custom'])
    .optional()
    .describe(
      'Optional split type. If not provided, AI will determine optimal split based on goal and constraints'
    ),
  includeDeload: z
    .boolean()
    .optional()
    .describe('Whether to include deload weeks. AI will determine optimal timing if not specified'),
  focusMuscles: z
    .array(z.string())
    .optional()
    .describe('Muscle groups to prioritize. AI will balance based on goal if not specified'),
  customStructure: z
    .object({
      weeks: z
        .array(
          z.object({
            weekNumber: z.number(),
            name: z.string().optional(),
            isDeload: z.boolean().optional(),
            days: z
              .array(
                z.object({
                  dayNumber: z.number(),
                  name: z.string(),
                  targetMuscles: z.array(z.string()),
                  notes: z.string().optional(),
                })
              )
              .optional(),
          })
        )
        .optional(),
    })
    .optional()
    .describe(
      'Optional custom structure. If provided, AI will use this as base and populate exercises. Otherwise AI will design structure autonomously'
    ),
});

type WorkoutGenerateProgramArgs = z.infer<typeof workoutGenerateProgramSchema>;

export const workoutGenerateProgramTool: McpTool<WorkoutGenerateProgramArgs> = {
  name: 'workout_generate_program',
  description:
    'Generates a complete workout program structure. The AI will decide on split type, volume, intensity, and progression strategies based on athlete profile and goals. Provides flexible framework without prescriptive methodologies.',
  parameters: workoutGenerateProgramSchema,
  execute: async (args: WorkoutGenerateProgramArgs, _context: McpContext) => {
    const profile = await prisma.user_profiles.findFirst({
      where: { userId: args.athleteId },
    });

    if (!profile) {
      throw new Error('Profilo atleta non trovato');
    }

    // If custom structure provided, use it; otherwise create minimal framework for AI to populate
    let weeks: WorkoutWeek[] = [];

    if (args.customStructure?.weeks && args.customStructure.weeks.length > 0) {
      // Use provided structure
      weeks = args.customStructure.weeks.map((w: any) => ({
        weekNumber: w.weekNumber,
        name: w.name ?? `Settimana ${w.weekNumber}`,
        isDeload: w.isDeload ?? false,
        days:
          w.days?.map((d: any) => ({
            dayNumber: d.dayNumber,
            name: d.name,
            targetMuscles: d.targetMuscles,
            exercises: [],
            notes: d.notes,
          })) ?? [],
      }));
    } else {
      // Create minimal framework - AI will decide on split, volume, progression
      const totalWeeks = args.durationWeeks;
      const daysPerWeek = args.daysPerWeek;

      for (let w = 1; w <= totalWeeks; w++) {
        const isDeload = args.includeDeload && w % 4 === 0;

        const days: WorkoutDay[] = [];
        for (let d = 1; d <= daysPerWeek; d++) {
          days.push({
            dayNumber: d,
            name: `Giorno ${d}`,
            targetMuscles: args.focusMuscles ?? [],
            exercises: [], // AI will populate based on goal and split strategy
            notes: isDeload
              ? 'Settimana di scarico - AI determinerà riduzione volume/intensità appropriata'
              : undefined,
          });
        }

        weeks.push({
          weekNumber: w,
          name: isDeload ? `Settimana ${w} (Deload)` : `Settimana ${w}`,
          isDeload: isDeload ?? false,
          days,
        });
      }
    }

    const programId = `prog_${Date.now()}`;

    const program = await prisma.workout_programs.create({
      data: {
        id: programId,
        name: `Programma ${args.goal}`,
        description: `Programma ${args.durationWeeks} settimane per ${args.goal}. ${args.daysPerWeek} giorni/settimana. L'AI determinerà split, volume, intensità e progressione ottimali.`,
        difficulty: 'INTERMEDIATE',
        durationWeeks: args.durationWeeks,
        goals: [args.goal],
        status: 'ACTIVE',
        weeks: toPrismaJsonValue(weeks as unknown[]),
        userId: args.athleteId,
        updatedAt: new Date(),
      },
    });

    // Update user memory
    await safeHandleMemoryEvent({
      type: 'PROGRAM_CREATED',
      userId: args.athleteId,
      data: {
        programId: program.id,
        programName: program.name,
        goal: args.goal,
        durationWeeks: args.durationWeeks,
        daysPerWeek: args.daysPerWeek,
        splitType: args.splitType,
      },
    });

    return createMcpTextResponse(
      `✅ **Struttura programma creata!**

📋 **${program.name}**
⏱️ Durata: ${args.durationWeeks} settimane
📅 Giorni/settimana: ${args.daysPerWeek}
🎯 Obiettivo: ${args.goal}
${args.splitType ? `📊 Split suggerito: ${args.splitType}` : "📊 Split: da determinare dall'AI"}
${args.includeDeload ? '🔄 Include settimane di deload' : ''}

💡 **Nota:** La struttura base è stata creata. L'AI determinerà autonomamente:
- Split type ottimale (se non specificato)
- Volume e intensità per ogni fase
- Strategia di progressione
- Timing deload (se incluso)
- Selezione esercizi e distribuzione`,
      { program }
    );
  },
};

// ============================================================================
// WORKOUT PROGRAM CRUD
// ============================================================================

const workoutGetProgramSchema = z.object({
  programId: z.string().optional().describe('Program ID to retrieve. Falls back to context.workout.programId if not provided.'),
});

type WorkoutGetProgramArgs = z.infer<typeof workoutGetProgramSchema>;

export const workoutGetProgramTool: McpTool<WorkoutGetProgramArgs> = {
  name: 'workout_get_program',
  description: 'Gets a workout program by ID with all details. The programId can be passed explicitly or will be taken from context.',
  parameters: workoutGetProgramSchema,
  execute: async (args: WorkoutGetProgramArgs, context: McpContext) => {
    // Use args.programId if provided, otherwise fall back to context
    const programId = args.programId || context.workout?.programId;
    
    if (!programId) {
      throw new Error('programId is required - either pass it as argument or set it in context.workout.programId');
    }
    
    console.log('[workout_get_program] 📥 Fetching program:', programId);
    
    const program = await prisma.workout_programs.findUnique({
      where: { id: programId },
    });

    if (!program) {
      throw new Error('Programma non trovato');
    }

    const weeks = program.weeks as WorkoutWeek[];
    
    console.log('[workout_get_program] ✅ Program found:', {
      id: program.id,
      name: program.name,
      weeksCount: weeks.length,
      firstWeekDays: weeks[0]?.days?.length || 0,
    });

    // Enhanced response with clear instructions for AI
    const textContent = `📋 **${program.name}** (ID: ${program.id})

📝 ${program.description}
⏱️ Durata: ${program.durationWeeks} settimane
🎯 Obiettivi: ${program.goals.join(', ')}
📊 Difficoltà: ${program.difficulty}
📌 Stato: ${program.status}

**Struttura:**
${weeks.map((w: any) => `• Settimana ${w.weekNumber}: ${w.days.length} giorni - ${w.days.map((d: any) => `Day ${d.dayNumber} (${d.dayTitle || d.dayName || 'Training'}): ${d.exercises?.length || 0} esercizi`).join(', ')}`).join('\n')}

**NOTA:** L'oggetto 'program' completo è incluso nella response. Usalo con i tool granulari:
- workout_granular_setgroup_update: per modificare serie/ripetizioni di un esercizio
- workout_persist_program: per SALVARE le modifiche al database (OBBLIGATORIO!)`;

    return createMcpTextResponse(textContent, { program });
  },
};

const workoutListProgramsSchema = z.object({
  athleteId: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'COMPLETED']).optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

type WorkoutListProgramsArgs = z.infer<typeof workoutListProgramsSchema>;

export const workoutListProgramsTool: McpTool<WorkoutListProgramsArgs> = {
  name: 'workout_list_programs',
  description: 'Lists workout programs for an athlete',
  parameters: workoutListProgramsSchema,
  execute: async (args: WorkoutListProgramsArgs, context: McpContext) => {
    const userId = args.athleteId ?? context.userId;

    const where: Prisma.workout_programsWhereInput = {};
    if (userId) where.userId = userId;
    if (args.status) where.status = args.status;

    const programs = await prisma.workout_programs.findMany({
      where,
      take: args.limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        durationWeeks: true,
        status: true,
        goals: true,
        createdAt: true,
      },
    });

    return createMcpTextResponse(
      programs.length > 0
        ? `📋 **${programs.length} Programmi**\n\n${programs
            .map(
              (p: any) =>
                `• **${p.name}** (${p.durationWeeks} sett.)\n  ${p.goals.join(', ')} | ${p.status}`
            )
            .join('\n\n')}`
        : 'Nessun programma trovato',
      { programs }
    );
  },
};

const workoutUpdateProgramSchema = z.object({
  programId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'COMPLETED']).optional(),
});

type WorkoutUpdateProgramArgs = z.infer<typeof workoutUpdateProgramSchema>;

export const workoutUpdateProgramTool: McpTool<WorkoutUpdateProgramArgs> = {
  name: 'workout_update_program',
  description: 'Updates a workout program',
  parameters: workoutUpdateProgramSchema,
  execute: async (args: WorkoutUpdateProgramArgs, _context: McpContext) => {
    const updateData: Prisma.workout_programsUpdateInput = {
      updatedAt: new Date(),
    };
    if (args.name) updateData.name = args.name;
    if (args.description) updateData.description = args.description;
    if (args.status) updateData.status = args.status;

    const program = await prisma.workout_programs.update({
      where: { id: args.programId },
      data: updateData,
    });

    return createMcpTextResponse(`✅ Programma **${program.name}** aggiornato`, { program });
  },
};

const workoutDeleteProgramSchema = z.object({
  programId: z.string(),
  permanent: z.boolean().default(false),
});

type WorkoutDeleteProgramArgs = z.infer<typeof workoutDeleteProgramSchema>;

export const workoutDeleteProgramTool: McpTool<WorkoutDeleteProgramArgs> = {
  name: 'workout_delete_program',
  description: 'Deletes a workout program (archives it)',
  parameters: workoutDeleteProgramSchema,
  execute: async (args: WorkoutDeleteProgramArgs, _context: McpContext) => {
    if (!args.permanent) {
      await prisma.workout_programs.update({
        where: { id: args.programId },
        data: { status: 'ARCHIVED', updatedAt: new Date() },
      });
      return createMcpTextResponse('📦 Programma archiviato');
    } else {
      await prisma.workout_programs.delete({
        where: { id: args.programId },
      });
      return createMcpTextResponse('🗑️ Programma eliminato definitivamente');
    }
  },
};

const workoutDuplicateProgramSchema = z.object({
  programId: z.string(),
  newName: z.string().optional(),
  targetAthleteId: z.string().optional(),
});

type WorkoutDuplicateProgramArgs = z.infer<typeof workoutDuplicateProgramSchema>;

export const workoutDuplicateProgramTool: McpTool<WorkoutDuplicateProgramArgs> = {
  name: 'workout_duplicate_program',
  description: 'Duplicates a workout program with optional modifications',
  parameters: workoutDuplicateProgramSchema,
  execute: async (args: WorkoutDuplicateProgramArgs, context: McpContext) => {
    const original = await prisma.workout_programs.findUnique({
      where: { id: args.programId },
    });

    if (!original) {
      throw new Error('Programma originale non trovato');
    }

    const newId = `prog_${Date.now()}`;
    const newProgram = await prisma.workout_programs.create({
      data: {
        id: newId,
        name: args.newName ?? `${original.name} (Copia)`,
        description: original.description,
        difficulty: original.difficulty,
        durationWeeks: original.durationWeeks,
        goals: original.goals,
        status: 'ACTIVE',
        weeks: original.weeks as Prisma.InputJsonValue,
        userId: args.targetAthleteId ?? context.userId,
        updatedAt: new Date(),
      },
    });

    return createMcpTextResponse(`✅ Programma duplicato: **${newProgram.name}**`, {
      program: newProgram,
    });
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export const workoutProgramTools = [
  workoutGenerateProgramTool,
  workoutGetProgramTool,
  workoutListProgramsTool,
  workoutUpdateProgramTool,
  workoutDeleteProgramTool,
  workoutDuplicateProgramTool,
];

export const workoutProgramToolsRecord = arrayToToolRecord(workoutProgramTools as McpTool[]);
