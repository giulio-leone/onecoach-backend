/**
 * Exercise AI Generation Streaming API Route
 *
 * Handles streaming exercise generation using ExerciseGenerationAgent.
 * Provides real-time progress updates via Server-Sent Events (SSE).
 */

import { AgentRole } from '@giulio-leone/one-agent';
import { generateExercises } from '@giulio-leone/one-workout';
import { createStreamingHandler } from '@giulio-leone/lib-api';

interface ExerciseStreamInput {
  prompt: string;
  autoApprove?: boolean;
  mergeExisting?: boolean;
}

/**
 * POST /api/admin/exercises/ai/stream
 *
 * Generate exercises with streaming SSE response
 */
export const POST = createStreamingHandler<
  ExerciseStreamInput,
  Awaited<ReturnType<typeof generateExercises>>
>({
  agentRole: AgentRole.EXERCISE_GENERATION,
  initialDescription: 'Starting exercise generation...',
  validateRequest: (body) => {
    const { prompt, autoApprove = true, mergeExisting = false } = body as ExerciseStreamInput;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return { valid: false, error: 'Prompt is required' };
    }

    return { valid: true, data: { prompt, autoApprove, mergeExisting } };
  },
  executeGeneration: async ({ input, sendEvent }) => {
    // Parse prompt to extract generation parameters
    const lowerPrompt = input.prompt.toLowerCase();
    const muscleGroups: string[] = [];
    let count = 5; // Default count
    let forEachMuscleGroup = false;

    // Check if prompt asks for exercises "per ogni gruppo muscolare" or "for each muscle group"
    if (
      lowerPrompt.includes('per ogni gruppo muscolare') ||
      lowerPrompt.includes('for each muscle group') ||
      lowerPrompt.includes('per ogni muscolo') ||
      lowerPrompt.includes('for each muscle')
    ) {
      forEachMuscleGroup = true;
    }

    // Extract count from prompt (e.g., "5 nuovi esercizi")
    const countMatch = input.prompt.match(/(\d+)\s*(nuovi\s*)?esercizi/i);
    if (countMatch && countMatch[1]) {
      count = parseInt(countMatch[1], 10);
    }

    // Extract muscle groups from prompt (only if not "for each")
    if (!forEachMuscleGroup) {
      const muscleKeywords: Record<string, string[]> = {
        biceps: ['bicipiti', 'biceps'],
        triceps: ['tricipiti', 'triceps'],
        chest: ['petto', 'pettorali', 'chest'],
        back: ['schiena', 'dorsali', 'back'],
        shoulders: ['spalle', 'deltoidi', 'shoulders'],
        legs: ['gambe', 'quadricipiti', 'legs'],
        abs: ['addominali', 'core', 'abs'],
      };

      for (const [muscle, keywords] of Object.entries(muscleKeywords)) {
        if (keywords.some((kw) => lowerPrompt.includes(kw))) {
          muscleGroups.push(muscle);
        }
      }
    }

    // Fetch metadata first to get all muscle groups if needed
    const { getAllMetadataForLocale } = await import(
      '@giulio-leone/lib-metadata/metadata-translation.service'
    );
    const metadata = await getAllMetadataForLocale('en');

    if (!metadata.muscles || metadata.muscles.length === 0) {
      throw new Error(
        'No muscles found in database. Please run database seed: pnpm db:seed or pnpm db:reset'
      );
    }

    // If "for each muscle group", use all available muscles
    if (forEachMuscleGroup) {
      type NamedEntity = { name: string };

      const allMuscleNames = metadata.muscles
        .map((m: unknown) => {
          const name = (m as NamedEntity | null)?.name;
          return typeof name === 'string' ? name.toLowerCase() : null;
        })
        .filter((name): name is string => typeof name === 'string' && name.length > 0);
      const muscleNameMap: Record<string, string> = {
        abs: 'abs',
        biceps: 'biceps',
        triceps: 'triceps',
        chest: 'chest',
        pectorals: 'chest',
        back: 'back',
        lats: 'back',
        shoulders: 'shoulders',
        deltoids: 'shoulders',
        legs: 'legs',
        quadriceps: 'legs',
        hamstrings: 'legs',
      };

      const foundGroups = new Set<string>();
      for (const muscleName of allMuscleNames) {
        for (const [key, group] of Object.entries(muscleNameMap)) {
          if (muscleName.includes(key)) {
            foundGroups.add(group);
          }
        }
      }

      if (foundGroups.size === 0) {
        muscleGroups.push('chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'abs');
      } else {
        muscleGroups.push(...Array.from(foundGroups));
      }
    }

    // Calculate total count
    const totalCount = muscleGroups.length > 0 ? count * muscleGroups.length : count;

    sendEvent({
      type: 'agent_progress',
      data: {
        progress: 10,
        message: `Preparando generazione di ${totalCount} esercizi...`,
      },
    });

    sendEvent({
      type: 'agent_progress',
      data: {
        progress: 20,
        message: 'Recuperando metadati (muscoli, parti del corpo, attrezzature)...',
      },
    });

    sendEvent({
      type: 'agent_progress',
      data: {
        progress: 30,
        message: `Metadati recuperati: ${metadata.muscles.length} muscoli, ${metadata.bodyParts.length} parti del corpo${forEachMuscleGroup ? ` - Generando ${count} esercizi per ${muscleGroups.length} gruppi muscolari` : ''}`,
      },
    });

    sendEvent({
      type: 'agent_progress',
      data: {
        progress: 40,
        message: `Generando ${totalCount} esercizi con AI...`,
      },
    });

    const result = await generateExercises({
      count: totalCount,
      description: input.prompt,
      muscleGroups: muscleGroups.length > 0 ? muscleGroups : undefined,
    });

    // Progress updates are now handled by the service via onProgress callback
    return result;
  },
  buildOutput: (result) => {
    const exercises = result.output?.exercises || [];
    return {
      summary: `Generati ${exercises.length} esercizi`,
      createResult: {
        created: exercises.length,
        updated: 0,
        skipped: 0,
        createdItems: exercises.map((e) => ({ name: e.name, typeId: e.typeId })),
        updatedItems: [],
        skippedSlugs: [],
        errors: [],
      },
    };
  },
});
