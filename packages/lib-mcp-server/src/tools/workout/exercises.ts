import type { Prisma } from '@prisma/client';
/**
 * MCP Workout Exercise Tools
 *
 * Tools for managing exercises within workout programs.
 * Uses actual Prisma schema with normalized exercise structure.
 *
 * Schema facts:
 * - exercises: uses normalized structure with relations
 * - exercise_translations: contains name, description (with locale)
 * - exercise_muscles: many-to-many with muscles table
 * - workout_programs.weeks: JSON containing days with exercises
 *
 * @module lib-mcp-server/tools/workout/exercises
 */

import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { prisma } from '@giulio-leone/lib-core';
import { toPrismaJsonValue } from '@giulio-leone/lib-shared';

// Types for JSON structure
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
// EXERCISE SEARCH & LIBRARY
// ============================================================================

const workoutSearchExercisesParams = z.object({
  query: z.string().optional(),
  muscleSlug: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
  locale: z.string().default('it'),
});

type WorkoutSearchExercisesParams = z.infer<typeof workoutSearchExercisesParams>;

export const workoutSearchExercisesTool: McpTool<WorkoutSearchExercisesParams> = {
  name: 'workout_search_exercises',
  description: 'Searches the exercise library by name, muscle group, or keywords',
  parameters: workoutSearchExercisesParams,
  execute: async (args, _context: McpContext) => {
    // Search in exercise_translations for name
    const whereTranslations: Prisma.exercise_translationsWhereInput = {
      locale: args.locale,
    };

    if (args.query) {
      whereTranslations.OR = [
        { name: { contains: args.query, mode: 'insensitive' } },
        { description: { contains: args.query, mode: 'insensitive' } },
        { searchTerms: { hasSome: [args.query.toLowerCase()] } },
      ];
    }

    const translations = await prisma.exercise_translations.findMany({
      where: whereTranslations,
      take: args.limit,
      orderBy: { name: 'asc' },
      include: {
        exercises: {
          include: {
            exercise_muscles: {
              include: {
                muscles: true,
              },
            },
            exercise_equipments: {
              include: {
                equipments: true,
              },
            },
          },
        },
      },
    });

    // Filter by muscle if specified
    let filteredTranslations = translations;
    if (args.muscleSlug) {
      filteredTranslations = translations.filter((t: any) =>
        t.exercises.exercise_muscles.some((em: any) => em.muscles.slug === args.muscleSlug)
      );
    }

    const exercises = filteredTranslations.map((t: any) => ({
      id: t.exercises.id,
      name: t.name,
      description: t.description,
      muscles: t.exercises.exercise_muscles.map((em: any) => em.muscles.name),
      equipment: t.exercises.exercise_equipments.map((eq: any) => eq.equipments.name),
    }));

    return {
      content: [
        {
          type: 'text',
          text:
            exercises.length > 0
              ? `🏋️ **${exercises.length} Esercizi trovati:**\n\n${exercises
                  .map((e: any) =>
                      `• **${e.name}**\n  Muscoli: ${e.muscles.join(', ') || 'N/A'} | Attrezzi: ${e.equipment.join(', ') || 'Corpo libero'}`
                  )
                  .join('\n\n')}`
              : 'Nessun esercizio trovato',
        },
      ],
      exercises,
    };
  },
};

const workoutGetExerciseDetailsParams = z.object({
  exerciseId: z.string(),
  locale: z.string().default('it'),
});

type WorkoutGetExerciseDetailsParams = z.infer<typeof workoutGetExerciseDetailsParams>;

export const workoutGetExerciseDetailsTool: McpTool<WorkoutGetExerciseDetailsParams> = {
  name: 'workout_get_exercise_details',
  description: 'Gets detailed information about a specific exercise',
  parameters: workoutGetExerciseDetailsParams,
  execute: async (args, _context: McpContext) => {
    const exercise = await prisma.exercises.findUnique({
      where: { id: args.exerciseId },
      include: {
        exercise_translations: {
          where: { locale: args.locale },
        },
        exercise_muscles: {
          include: { muscles: true },
        },
        exercise_equipments: {
          include: { equipments: true },
        },
        exercise_types: {
          include: {
            exercise_type_translations: {
              where: { locale: args.locale },
            },
          },
        },
      },
    });

    if (!exercise) {
      throw new Error('Esercizio non trovato');
    }

    const translation = exercise.exercise_translations[0];
    const muscles = exercise.exercise_muscles.map((em: any) => em.muscles.name);
    const equipment = exercise.exercise_equipments.map((eq: any) => eq.equipments.name);
    const typeName = exercise.exercise_types?.exercise_type_translations[0]?.name;

    return {
      content: [
        {
          type: 'text',
          text: `🏋️ **${translation?.name ?? exercise.slug}**

📝 ${translation?.description ?? exercise.overview ?? 'Nessuna descrizione'}

💪 **Muscoli coinvolti:** ${muscles.join(', ') || 'Non specificati'}

🔧 **Dettagli:**
- Attrezzi: ${equipment.join(', ') || 'Corpo libero'}
- Tipo: ${typeName ?? 'Non specificato'}

📋 **Istruzioni:**
${exercise.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n') || 'Nessuna istruzione'}

💡 **Suggerimenti:**
${exercise.exerciseTips.map((tip: any) => `• ${tip}`).join('\n') || 'Nessun suggerimento'}

📹 Video: ${exercise.videoUrl ?? 'Non disponibile'}`,
        },
      ],
      exercise: {
        id: exercise.id,
        slug: exercise.slug,
        name: translation?.name,
        description: translation?.description,
        overview: exercise.overview,
        muscles,
        equipment,
        instructions: exercise.instructions,
        tips: exercise.exerciseTips,
        videoUrl: exercise.videoUrl,
        imageUrl: exercise.imageUrl,
      },
    };
  },
};

// ============================================================================
// EXERCISE MANAGEMENT IN PROGRAMS
// ============================================================================

const workoutAddExerciseParams = z.object({
  programId: z.string(),
  weekNumber: z.number().int().min(1),
  dayNumber: z.number().int().min(1),
  exerciseId: z.string(),
  sets: z.number().int().min(1).default(3),
  reps: z.string().default('8-12'),
  rest: z.number().int().min(30).default(90),
  rpe: z.number().int().min(5).max(10).optional(),
  notes: z.string().optional(),
});

type WorkoutAddExerciseParams = z.infer<typeof workoutAddExerciseParams>;

export const workoutAddExerciseTool: McpTool<WorkoutAddExerciseParams> = {
  name: 'workout_add_exercise',
  description: 'Adds an exercise to a specific day in a workout program',
  parameters: workoutAddExerciseParams,
  execute: async (args, _context: McpContext) => {
    // Verify exercise exists and get name
    const exercise = await prisma.exercises.findUnique({
      where: { id: args.exerciseId },
      include: {
        exercise_translations: {
          where: { locale: 'it' },
          take: 1,
        },
      },
    });

    if (!exercise) {
      throw new Error('Esercizio non trovato nella libreria');
    }

    const exerciseName = exercise.exercise_translations[0]?.name ?? exercise.slug;

    // Get program
    const program = await prisma.workout_programs.findUnique({
      where: { id: args.programId },
    });

    if (!program) {
      throw new Error('Programma non trovato');
    }

    const weeks = program.weeks as unknown as WorkoutWeek[];
    const weekIndex = weeks.findIndex((w) => w.weekNumber === args.weekNumber);
    if (weekIndex === -1) {
      throw new Error(`Settimana ${args.weekNumber} non trovata`);
    }

    const week = weeks[weekIndex];
    if (!week) {
      throw new Error(`Settimana ${args.weekNumber} non trovata`);
    }

    const dayIndex = week.days.findIndex((d) => d.dayNumber === args.dayNumber);
    if (dayIndex === -1) {
      throw new Error(`Giorno ${args.dayNumber} non trovato nella settimana ${args.weekNumber}`);
    }

    const day = week.days[dayIndex];
    if (!day) {
      throw new Error(`Giorno ${args.dayNumber} non trovato`);
    }

    // Add exercise
    const newExercise: WorkoutExercise = {
      exerciseId: args.exerciseId,
      order: day.exercises.length + 1,
      setGroups: [
        {
          sets: args.sets,
          reps: args.reps,
          rest: args.rest,
          rpe: args.rpe,
        },
      ],
      notes: args.notes,
    };

    day.exercises.push(newExercise);
    week.days[dayIndex] = day;
    weeks[weekIndex] = week;

    // Update program
    await prisma.workout_programs.update({
      where: { id: args.programId },
      data: {
        weeks: toPrismaJsonValue(weeks as unknown[]),
        updatedAt: new Date(),
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ **${exerciseName}** aggiunto alla Settimana ${args.weekNumber}, Giorno ${args.dayNumber}

📊 ${args.sets} x ${args.reps} | Rest: ${args.rest}s${args.rpe ? ` | RPE: ${args.rpe}` : ''}`,
        },
      ],
    };
  },
};

const workoutRemoveExerciseParams = z.object({
  programId: z.string(),
  weekNumber: z.number().int().min(1),
  dayNumber: z.number().int().min(1),
  exerciseOrder: z.number().int().min(1),
});

type WorkoutRemoveExerciseParams = z.infer<typeof workoutRemoveExerciseParams>;

export const workoutRemoveExerciseTool: McpTool<WorkoutRemoveExerciseParams> = {
  name: 'workout_remove_exercise',
  description: 'Removes an exercise from a day in a workout program',
  parameters: workoutRemoveExerciseParams,
  execute: async (args, _context: McpContext) => {
    const program = await prisma.workout_programs.findUnique({
      where: { id: args.programId },
    });

    if (!program) {
      throw new Error('Programma non trovato');
    }

    const weeks = program.weeks as unknown as WorkoutWeek[];
    const weekIndex = weeks.findIndex((w) => w.weekNumber === args.weekNumber);
    if (weekIndex === -1) {
      throw new Error(`Settimana ${args.weekNumber} non trovata`);
    }

    const week = weeks[weekIndex];
    if (!week) {
      throw new Error(`Settimana ${args.weekNumber} non trovata`);
    }

    const dayIndex = week.days.findIndex((d) => d.dayNumber === args.dayNumber);
    if (dayIndex === -1) {
      throw new Error(`Giorno ${args.dayNumber} non trovato`);
    }

    const day = week.days[dayIndex];
    if (!day) {
      throw new Error(`Giorno ${args.dayNumber} non trovato`);
    }

    const exerciseIndex = day.exercises.findIndex((e) => e.order === args.exerciseOrder);
    if (exerciseIndex === -1) {
      throw new Error(`Esercizio con ordine ${args.exerciseOrder} non trovato`);
    }

    // Remove and reorder
    day.exercises.splice(exerciseIndex, 1);
    day.exercises.forEach((e, i) => {
      e.order = i + 1;
    });

    week.days[dayIndex] = day;
    weeks[weekIndex] = week;

    await prisma.workout_programs.update({
      where: { id: args.programId },
      data: {
        weeks: toPrismaJsonValue(weeks as unknown[]),
        updatedAt: new Date(),
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Esercizio rimosso dalla Settimana ${args.weekNumber}, Giorno ${args.dayNumber}`,
        },
      ],
    };
  },
};

const workoutReorderExercisesParams = z.object({
  programId: z.string(),
  weekNumber: z.number().int().min(1),
  dayNumber: z.number().int().min(1),
  newOrder: z.array(z.number().int()),
});

type WorkoutReorderExercisesParams = z.infer<typeof workoutReorderExercisesParams>;

export const workoutReorderExercisesTool: McpTool<WorkoutReorderExercisesParams> = {
  name: 'workout_reorder_exercises',
  description: 'Reorders exercises within a day',
  parameters: workoutReorderExercisesParams,
  execute: async (args, _context: McpContext) => {
    const program = await prisma.workout_programs.findUnique({
      where: { id: args.programId },
    });

    if (!program) {
      throw new Error('Programma non trovato');
    }

    const weeks = program.weeks as unknown as WorkoutWeek[];
    const weekIndex = weeks.findIndex((w) => w.weekNumber === args.weekNumber);
    if (weekIndex === -1) {
      throw new Error(`Settimana ${args.weekNumber} non trovata`);
    }

    const week = weeks[weekIndex];
    if (!week) {
      throw new Error(`Settimana ${args.weekNumber} non trovata`);
    }

    const dayIndex = week.days.findIndex((d) => d.dayNumber === args.dayNumber);
    if (dayIndex === -1) {
      throw new Error(`Giorno ${args.dayNumber} non trovato`);
    }

    const day = week.days[dayIndex];
    if (!day) {
      throw new Error(`Giorno ${args.dayNumber} non trovato`);
    }

    // Reorder exercises based on newOrder array
    const reorderedExercises: WorkoutExercise[] = [];
    args.newOrder.forEach((oldOrder: number, newIndex: number) => {
      const exercise = day.exercises.find((e: any) => e.order === oldOrder);
      if (exercise) {
        reorderedExercises.push({ ...exercise, order: newIndex + 1 });
      }
    });

    day.exercises = reorderedExercises;
    week.days[dayIndex] = day;
    weeks[weekIndex] = week;

    await prisma.workout_programs.update({
      where: { id: args.programId },
      data: {
        weeks: toPrismaJsonValue(weeks as unknown[]),
        updatedAt: new Date(),
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Esercizi riordinati nella Settimana ${args.weekNumber}, Giorno ${args.dayNumber}`,
        },
      ],
    };
  },
};

// ============================================================================
// DAY OVERVIEW
// ============================================================================

const workoutGetDayDetailsParams = z.object({
  programId: z.string(),
  weekNumber: z.number().int().min(1),
  dayNumber: z.number().int().min(1),
  locale: z.string().default('it'),
});

type WorkoutGetDayDetailsParams = z.infer<typeof workoutGetDayDetailsParams>;

export const workoutGetDayDetailsTool: McpTool<WorkoutGetDayDetailsParams> = {
  name: 'workout_get_day_details',
  description: 'Gets detailed view of a specific workout day',
  parameters: workoutGetDayDetailsParams,
  execute: async (args, _context: McpContext) => {
    const program = await prisma.workout_programs.findUnique({
      where: { id: args.programId },
    });

    if (!program) {
      throw new Error('Programma non trovato');
    }

    const weeks = program.weeks as unknown as WorkoutWeek[];
    const week = weeks.find((w: any) => w.weekNumber === args.weekNumber);
    if (!week) {
      throw new Error(`Settimana ${args.weekNumber} non trovata`);
    }

    const day = week.days.find((d: any) => d.dayNumber === args.dayNumber);
    if (!day) {
      throw new Error(`Giorno ${args.dayNumber} non trovato`);
    }

    // Get exercise details
    const exerciseIds = day.exercises.map((e: any) => e.exerciseId);
    const exerciseTranslations = await prisma.exercise_translations.findMany({
      where: {
        exerciseId: { in: exerciseIds },
        locale: args.locale,
      },
      include: {
        exercises: {
          include: {
            exercise_muscles: {
              include: { muscles: true },
            },
          },
        },
      },
    });

    const exerciseMap = new Map(
      exerciseTranslations.map((t: any) => [
        t.exerciseId,
        {
          name: t.name,
          muscles: t.exercises.exercise_muscles.map((em: any) => em.muscles.name),
        },
      ])
    );

    // Calculate totals
    const totalSets = day.exercises.reduce(
      (sum: number, ex) => sum + ex.setGroups.reduce((sgSum: number, sg) => sgSum + sg.sets, 0),
      0
    );

    const exercisesList = day.exercises
      .map((ex, i: number) => {
        const details = exerciseMap.get(ex.exerciseId);
        const setInfo = ex.setGroups.map((sg: any) => `${sg.sets}x${sg.reps}`).join(', ');
        return `${i + 1}. **${details?.name ?? 'Sconosciuto'}**\n   ${setInfo} | Rest: ${ex.setGroups[0]?.rest ?? 90}s`;
      })
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `🏋️ **${day.name}** (Settimana ${args.weekNumber}, Giorno ${args.dayNumber})

💪 **Target:** ${day.targetMuscles.join(', ')}
📊 **Totale:** ${day.exercises.length} esercizi, ${totalSets} set

**Esercizi:**
${exercisesList || 'Nessun esercizio'}

${day.notes ? `📝 Note: ${day.notes}` : ''}`,
        },
      ],
      day,
      exerciseDetails: Array.from(exerciseMap.entries()).map(([id, details]) => ({
        id,
        ...details,
      })),
    };
  },
};

const workoutCopyDayParams = z.object({
  programId: z.string(),
  sourceWeek: z.number().int().min(1),
  sourceDay: z.number().int().min(1),
  targetWeek: z.number().int().min(1),
  targetDay: z.number().int().min(1),
  replace: z.boolean().default(false),
});

type WorkoutCopyDayParams = z.infer<typeof workoutCopyDayParams>;

export const workoutCopyDayTool: McpTool<WorkoutCopyDayParams> = {
  name: 'workout_copy_day',
  description: 'Copies exercises from one day to another',
  parameters: workoutCopyDayParams,
  execute: async (args, _context: McpContext) => {
    const program = await prisma.workout_programs.findUnique({
      where: { id: args.programId },
    });

    if (!program) {
      throw new Error('Programma non trovato');
    }

    const weeks = program.weeks as unknown as WorkoutWeek[];

    const sourceWeekIndex = weeks.findIndex((w) => w.weekNumber === args.sourceWeek);
    if (sourceWeekIndex === -1) {
      throw new Error(`Settimana sorgente ${args.sourceWeek} non trovata`);
    }

    const targetWeekIndex = weeks.findIndex((w) => w.weekNumber === args.targetWeek);
    if (targetWeekIndex === -1) {
      throw new Error(`Settimana target ${args.targetWeek} non trovata`);
    }

    const sourceWeek = weeks[sourceWeekIndex];
    const targetWeek = weeks[targetWeekIndex];
    if (!sourceWeek || !targetWeek) {
      throw new Error('Settimana non trovata');
    }

    const sourceDayIndex = sourceWeek.days.findIndex((d) => d.dayNumber === args.sourceDay);
    if (sourceDayIndex === -1) {
      throw new Error(`Giorno sorgente ${args.sourceDay} non trovato`);
    }

    const targetDayIndex = targetWeek.days.findIndex((d) => d.dayNumber === args.targetDay);
    if (targetDayIndex === -1) {
      throw new Error(`Giorno target ${args.targetDay} non trovato`);
    }

    const sourceDay = sourceWeek.days[sourceDayIndex];
    const targetDay = targetWeek.days[targetDayIndex];
    if (!sourceDay || !targetDay) {
      throw new Error('Giorno non trovato');
    }

    // Copy exercises
    if (args.replace) {
      targetDay.exercises = JSON.parse(JSON.stringify(sourceDay.exercises));
    } else {
      const startOrder = targetDay.exercises.length + 1;
      const newExercises = sourceDay.exercises.map((ex, i: number) => ({
        ...ex,
        order: startOrder + i,
      }));
      targetDay.exercises.push(...newExercises);
    }

    targetWeek.days[targetDayIndex] = targetDay;
    weeks[targetWeekIndex] = targetWeek;

    await prisma.workout_programs.update({
      where: { id: args.programId },
      data: {
        weeks: toPrismaJsonValue(weeks as unknown[]),
        updatedAt: new Date(),
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ ${sourceDay.exercises.length} esercizi copiati da Sett.${args.sourceWeek}/G${args.sourceDay} a Sett.${args.targetWeek}/G${args.targetDay}`,
        },
      ],
    };
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export const workoutExerciseTools = [
  workoutSearchExercisesTool,
  workoutGetExerciseDetailsTool,
  workoutAddExerciseTool,
  workoutRemoveExerciseTool,
  workoutReorderExercisesTool,
  workoutGetDayDetailsTool,
  workoutCopyDayTool,
];

import { arrayToToolRecord } from '../../utils/helpers';

export const workoutExerciseToolsRecord = arrayToToolRecord(workoutExerciseTools);
