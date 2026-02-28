import type { WorkoutProgram, WorkoutStatus } from '@giulio-leone/types';

type WorkoutProgramLike = Omit<
  Partial<WorkoutProgram>,
  | 'difficulty'
  | 'name'
  | 'description'
  | 'durationWeeks'
  | 'weeks'
  | 'goals'
  | 'createdAt'
  | 'updatedAt'
> & {
  name: string;
  description: string;
  difficulty: string;
  durationWeeks: number;
  weeks: unknown[];
  goals: string[];
  // Allow both Date and string for timestamps (Zod schema outputs Date, but type expects string)
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

/**
 * Normalizza un programma workout di input aggiungendo i metadati obbligatori
 * richiesti dai servizi @giulio-leone/lib-workout (status/id/timestamps).
 */
export function normalizeWorkoutProgram(program: WorkoutProgramLike): WorkoutProgram {
  const nowIso = new Date().toISOString();
  const casted = program as Partial<WorkoutProgram>;
  const difficulty =
    program.difficulty && typeof program.difficulty === 'string'
      ? ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(program.difficulty)
        ? (program.difficulty as WorkoutProgram['difficulty'])
        : ('ADVANCED' as WorkoutProgram['difficulty'])
      : ('ADVANCED' as WorkoutProgram['difficulty']);

  // Helper to convert Date | string | undefined to ISO string
  const toIsoString = (value: Date | string | undefined, fallback: string): string => {
    if (!value) return fallback;
    if (value instanceof Date) return value.toISOString();
    return value;
  };

  return {
    id: casted.id ?? 'temp-program',
    createdAt: toIsoString(program.createdAt, nowIso),
    updatedAt: toIsoString(program.updatedAt, nowIso),
    status: casted.status ?? ('ACTIVE' as WorkoutStatus),
    userId: casted.userId,
    version: casted.version,
    metadata: casted.metadata ?? null,
    name: program.name,
    description: program.description,
    difficulty,
    durationWeeks: program.durationWeeks,
    weeks: program.weeks as WorkoutProgram['weeks'],
    goals: program.goals,
  };
}
