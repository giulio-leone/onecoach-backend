/**
 * MCP Tools: Live Workout Coaching
 *
 * Real-time coaching tools for active workout sessions.
 * These tools read from the LiveSessionContext in the copilot store
 * and provide contextual coaching advice.
 *
 * SOLID Principles:
 * - Single Responsibility: Each tool handles one coaching aspect
 * - Interface Segregation: Minimal, focused tool interfaces
 *
 * @module lib-mcp-server/tools/workout/live-coaching
 */

import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { getDbClient } from '@giulio-leone/core';
const prisma = getDbClient() as import('@prisma/client').PrismaClient;
import { logger } from '@giulio-leone/lib-shared';

// =====================================================
// Helper: Get Live Session from Context
// =====================================================

interface LiveSessionFromContext {
  sessionId: string | null;
  programId: string | null;
  status: string | null;
  currentExerciseName: string | null;
  currentExerciseIndex: number | null;
  currentSetIndex: number | null;
  completedSets: number | null;
  totalSets: number | null;
  lastSet: {
    weight: number;
    reps: number;
    rpe: number | null;
  } | null;
  restTimerRunning: boolean;
  restTimeRemaining: number;
}

function getLiveSessionFromContext(context: McpContext): LiveSessionFromContext | null {
  const liveSession = (context as Record<string, unknown>)?.liveSession as LiveSessionFromContext | null | undefined;

  logger.debug('[LiveCoaching] 📥 Context received:', {
    hasLiveSession: !!liveSession,
    sessionId: liveSession?.sessionId ?? 'none',
    currentExercise: liveSession?.currentExerciseName ?? 'none',
    completedSets: liveSession?.completedSets ?? 0,
    totalSets: liveSession?.totalSets ?? 0,
    lastSetWeight: liveSession?.lastSet?.weight ?? null,
  });

  if (!liveSession?.sessionId) return null;
  return liveSession as LiveSessionFromContext;
}

// =====================================================
// Tool: Read Session State
// =====================================================

const sessionReadParams = z.object({
  sessionIdOverride: z.string().optional().describe('Override sessionId from context'),
});

type SessionReadParams = z.infer<typeof sessionReadParams>;

export const workoutSessionReadTool: McpTool<SessionReadParams> = {
  name: 'workout_session_read',
  description: `Reads the current state of an active workout session.

Returns:
- Session status (active/paused/completed)
- Current exercise and set position
- Progress (completed/total sets)
- Last completed set data (weight, reps, RPE)
- Rest timer state

Use this to understand where the user is in their workout.`,
  parameters: sessionReadParams,
  execute: async (_args, context) => {
    logger.info('[LiveCoaching:workout_session_read] 🔧 Executing');
    const liveSession = getLiveSessionFromContext(context);

    if (!liveSession) {
      logger.warn('[LiveCoaching:workout_session_read] ❌ No active session found in context');
      return {
        success: false,
        error: 'No active workout session found. The user must start a session first.',
      };
    }

    logger.info('[LiveCoaching:workout_session_read] ✅ Session found', {
      sessionId: liveSession.sessionId,
      currentExercise: liveSession.currentExerciseName,
      progress: `${liveSession.completedSets}/${liveSession.totalSets}`,
    });

    return {
      success: true,
      session: {
        id: liveSession.sessionId,
        status: liveSession.status,
        currentExercise: liveSession.currentExerciseName,
        currentSetNumber: (liveSession.currentSetIndex ?? 0) + 1,
        progress: {
          completedSets: liveSession.completedSets,
          totalSets: liveSession.totalSets,
          percentComplete: liveSession.totalSets
            ? Math.round(((liveSession.completedSets ?? 0) / liveSession.totalSets) * 100)
            : 0,
        },
        lastSet: liveSession.lastSet,
        restTimer: {
          active: liveSession.restTimerRunning,
          secondsRemaining: liveSession.restTimeRemaining,
        },
      },
    };
  },
};

// =====================================================
// Tool: Analyze Session Performance
// =====================================================

const sessionAnalyzeParams = z.object({
  aspectToAnalyze: z
    .enum(['volume', 'intensity', 'fatigue', 'overall'])
    .optional()
    .describe('Specific aspect to analyze. Defaults to overall.'),
});

type SessionAnalyzeParams = z.infer<typeof sessionAnalyzeParams>;

export const workoutSessionAnalyzeTool: McpTool<SessionAnalyzeParams> = {
  name: 'workout_session_analyze',
  description: `Analyzes the current workout session performance.

Provides insights on:
- Volume trend (are they hitting target reps?)
- Intensity progression (weight changes)
- Fatigue indicators (RPE progression, form degradation)
- Comparison to previous sessions on same exercises

Use this when the user asks how they're doing or wants feedback.`,
  parameters: sessionAnalyzeParams,
  execute: async (_args, context) => {
    logger.info('[LiveCoaching:workout_session_analyze] 🔧 Executing');
    const liveSession = getLiveSessionFromContext(context);

    if (!liveSession) {
      logger.warn('[LiveCoaching:workout_session_analyze] ❌ No active session');
      return {
        success: false,
        error: 'No active workout session found.',
      };
    }

    const { completedSets, totalSets, lastSet, currentExerciseName } = liveSession;

    // Basic analysis based on available data
    const analysis: Record<string, unknown> = {
      progress: {
        completed: completedSets ?? 0,
        remaining: (totalSets ?? 0) - (completedSets ?? 0),
        status:
          completedSets === 0
            ? 'just_started'
            : (completedSets ?? 0) >= (totalSets ?? 0) * 0.8
              ? 'almost_done'
              : 'in_progress',
      },
    };

    if (lastSet) {
      analysis.lastSetPerformance = {
        weight: lastSet.weight,
        reps: lastSet.reps,
        rpe: lastSet.rpe,
        fatigueLevel: lastSet.rpe
          ? lastSet.rpe >= 9
            ? 'high'
            : lastSet.rpe >= 7
              ? 'moderate'
              : 'low'
          : 'unknown',
      };
    }

    // Coaching suggestions based on analysis
    const suggestions: string[] = [];

    if (lastSet?.rpe && lastSet.rpe >= 9) {
      suggestions.push('RPE alto - considera ridurre il peso o le reps per il prossimo set');
    }

    if ((completedSets ?? 0) > 0 && (completedSets ?? 0) < (totalSets ?? 0) * 0.5) {
      suggestions.push("Sei ancora all'inizio - mantieni il ritmo!");
    }

    if ((completedSets ?? 0) >= (totalSets ?? 0) * 0.8) {
      suggestions.push('Quasi finito! Ultima spinta per completare al meglio');
    }

    return {
      success: true,
      currentExercise: currentExerciseName,
      analysis,
      suggestions,
    };
  },
};

// =====================================================
// Tool: Get Coaching Suggestion
// =====================================================

const coachSuggestParams = z.object({
  requestType: z
    .enum(['next_weight', 'rest_time', 'technique', 'motivation', 'general'])
    .describe('Type of coaching suggestion requested'),
});

type CoachSuggestParams = z.infer<typeof coachSuggestParams>;

export const workoutCoachSuggestTool: McpTool<CoachSuggestParams> = {
  name: 'workout_coach_suggest',
  description: `Provides coaching suggestions for the current workout.

Suggestion types:
- next_weight: Recommends weight for the next set based on RPE/performance
- rest_time: Suggests optimal rest time based on fatigue and exercise type
- technique: Provides form cues for the current exercise
- motivation: Gives motivational feedback
- general: Overall coaching advice

Use this when the user asks for advice or recommendations.`,
  parameters: coachSuggestParams,
  execute: async (args, context) => {
    const { requestType } = args;
    logger.info('[LiveCoaching:workout_coach_suggest] 🔧 Executing', { requestType });
    const liveSession = getLiveSessionFromContext(context);

    if (!liveSession) {
      logger.warn('[LiveCoaching:workout_coach_suggest] ❌ No active session');
      return {
        success: false,
        error: 'No active workout session found.',
      };
    }

    const { lastSet, currentExerciseName, restTimeRemaining, completedSets, totalSets } =
      liveSession;

    let suggestion = '';
    let details: Record<string, unknown> = {};

    switch (requestType) {
      case 'next_weight':
        if (lastSet) {
          if (lastSet.rpe && lastSet.rpe < 7) {
            const increase = Math.round(lastSet.weight * 0.05 * 2) / 2; // Round to 0.5kg
            suggestion = `Puoi aumentare il peso. Suggerisco ${lastSet.weight + increase}kg per il prossimo set.`;
            details = { currentWeight: lastSet.weight, suggestedWeight: lastSet.weight + increase };
          } else if (lastSet.rpe && lastSet.rpe >= 9) {
            const decrease = Math.round(lastSet.weight * 0.1 * 2) / 2;
            suggestion = `RPE alto, considera ridurre a ${lastSet.weight - decrease}kg per mantenere la qualità.`;
            details = { currentWeight: lastSet.weight, suggestedWeight: lastSet.weight - decrease };
          } else {
            suggestion = `Mantieni ${lastSet.weight}kg - la progressione sembra ottimale.`;
            details = { currentWeight: lastSet.weight, suggestedWeight: lastSet.weight };
          }
        } else {
          suggestion = 'Completa il primo set per ricevere suggerimenti sul peso.';
        }
        break;

      case 'rest_time':
        const baseRest = 90; // Default rest time
        let suggestedRest = baseRest;

        if (lastSet?.rpe) {
          if (lastSet.rpe >= 9) suggestedRest = 180;
          else if (lastSet.rpe >= 7) suggestedRest = 120;
          else suggestedRest = 90;
        }

        suggestion = `Riposo suggerito: ${suggestedRest} secondi`;
        if (restTimeRemaining > 0) {
          suggestion += ` (${restTimeRemaining}s rimanenti)`;
        }
        details = { suggestedRestSeconds: suggestedRest, currentRemaining: restTimeRemaining };
        break;

      case 'technique':
        suggestion = `Per ${currentExerciseName || "l'esercizio corrente"}, concentrati su: `;
        suggestion += 'controllo eccentrico, posizione stabile, respirazione coordinata.';
        break;

      case 'motivation':
        const progress = completedSets && totalSets ? completedSets / totalSets : 0;
        if (progress < 0.3) {
          suggestion = "Ottimo inizio! Mantieni alta l'intensità 💪";
        } else if (progress < 0.7) {
          suggestion = 'Sei a metà strada! Continua così, ogni set conta!';
        } else {
          suggestion = 'Quasi finito! Dai il massimo per questi ultimi set! 🔥';
        }
        break;

      case 'general':
      default:
        suggestion = 'Concentrati sulla qualità di ogni ripetizione. ';
        if (lastSet?.rpe && lastSet.rpe >= 8) {
          suggestion += 'Stai lavorando bene, la fatica è al punto giusto.';
        } else {
          suggestion += "Puoi spingere un po' di più se ti senti bene.";
        }
        break;
    }

    return {
      success: true,
      type: requestType,
      suggestion,
      details,
      currentExercise: currentExerciseName,
    };
  },
};

// =====================================================
// Tool: Exercise Tips
// =====================================================

const exerciseTipsParams = z.object({
  exerciseName: z
    .string()
    .optional()
    .describe('Exercise name. Uses current exercise if not provided.'),
  tipType: z
    .enum(['form', 'breathing', 'common_mistakes', 'all'])
    .optional()
    .describe('Type of tips to provide. Defaults to all.'),
});

type ExerciseTipsParams = z.infer<typeof exerciseTipsParams>;

export const workoutExerciseTipsTool: McpTool<ExerciseTipsParams> = {
  name: 'workout_exercise_tips',
  description: `Provides coaching tips for a specific exercise during live workout.

Returns:
- Form cues (key technique points)
- Breathing patterns
- Common mistakes to avoid

Use this when the user asks how to do an exercise or wants form tips.`,
  parameters: exerciseTipsParams,
  execute: async (args, context) => {
    logger.info('[LiveCoaching:workout_exercise_tips] 🔧 Executing', {
      requestedExercise: args.exerciseName ?? 'from session',
      tipType: args.tipType ?? 'all',
    });
    const liveSession = getLiveSessionFromContext(context);
    const exerciseName = args.exerciseName || liveSession?.currentExerciseName;

    if (!exerciseName) {
      logger.warn('[LiveCoaching:workout_exercise_tips] ❌ No exercise specified');
      return {
        success: false,
        error: 'No exercise specified and no current exercise found in session.',
      };
    }

    logger.info('[LiveCoaching:workout_exercise_tips] 💪 Fetching tips for:', exerciseName);

    // Try to fetch exercise from catalog for detailed tips
    const catalogExercise = await prisma.exercises.findFirst({
      where: {
        slug: { contains: exerciseName.toLowerCase().replace(/\s+/g, '-'), mode: 'insensitive' },
      },
      select: {
        slug: true,
        exerciseTips: true,
        instructions: true,
      },
    });

    const exerciseDisplayName = catalogExercise?.slug?.replace(/-/g, ' ') || exerciseName;

    const tips: Record<string, unknown> = {
      exercise: exerciseDisplayName,
    };

    // Form cues from catalog (exerciseTips) or generic
    if (
      catalogExercise?.exerciseTips &&
      Array.isArray(catalogExercise.exerciseTips) &&
      catalogExercise.exerciseTips.length > 0
    ) {
      tips.formCues = catalogExercise.exerciseTips;
    } else if (
      catalogExercise?.instructions &&
      Array.isArray(catalogExercise.instructions) &&
      catalogExercise.instructions.length > 0
    ) {
      tips.formCues = catalogExercise.instructions.slice(0, 3);
    } else {
      tips.formCues = [
        'Mantieni la schiena in posizione neutra',
        'Controlla il movimento in fase eccentrica',
        "Attiva il core durante tutta l'esecuzione",
      ];
    }

    // Breathing pattern (generic, could be enhanced per exercise)
    tips.breathing = "Espira durante la fase concentrica (sforzo), inspira durante l'eccentrica";

    // Common mistakes (generic)
    tips.commonMistakes = [
      'Usare troppo slancio invece di movimento controllato',
      'Non completare il range of motion',
      'Trattenere il respiro',
    ];

    return {
      success: true,
      tips,
    };
  },
};

// =====================================================
// Export All Live Coaching Tools
// =====================================================

export const liveCoachingTools = [
  workoutSessionReadTool,
  workoutSessionAnalyzeTool,
  workoutCoachSuggestTool,
  workoutExerciseTipsTool,
];
