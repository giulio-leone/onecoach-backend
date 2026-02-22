'use client';

/**
 * useLiveSessionSync Hook
 *
 * Syncs live workout session state with the CopilotActiveContext store.
 * Use this hook in any live workout execution component to enable
 * AI coaching features.
 *
 * USAGE:
 * ```tsx
 * function LiveWorkoutScreen({ sessionId, programId }) {
 *   const { isReady, setCurrentExercise, recordSet, updateTimer } = useLiveSessionSync({
 *     sessionId,
 *     programId,
 *     totalSets: calculateTotalSets(program),
 *   });
 *
 *   // When user advances to next exercise
 *   setCurrentExercise('Squat', 0);
 *
 *   // When user completes a set
 *   recordSet({ weight: 100, reps: 8, rpe: 7 });
 *
 *   // Timer updates
 *   updateTimer(true, 90);
 * }
 * ```
 */

import { useEffect, useCallback, useRef } from 'react';
import { useCopilotActiveContextStore } from '../copilot-active-context.store';
import { logger } from '@giulio-leone/lib-shared';

export interface UseLiveSessionSyncOptions {
  sessionId: string;
  programId: string;
  totalSets: number;
  autoInitialize?: boolean;
}

export interface LiveSessionSetData {
  weight: number;
  reps: number;
  rpe?: number | null;
  duration?: number;
}

export function useLiveSessionSync(options: UseLiveSessionSyncOptions) {
  const { sessionId, programId, totalSets, autoInitialize = true } = options;
  const initializedRef = useRef(false);

  const {
    liveSession,
    initLiveSessionContext,
    updateLiveSessionProgress,
    setCurrentExercise: storeSetCurrentExercise,
    recordCompletedSet: storeRecordSet,
    updateRestTimer,
    setLiveSessionStatus,
    clearLiveSession,
  } = useCopilotActiveContextStore();

  // Initialize session context on mount
  useEffect(() => {
    // Debug logging to trace initialization
    console.warn('[useLiveSessionSync] 🔍 Effect running with:', {
      autoInitialize,
      sessionId,
      programId,
      totalSets,
      alreadyInitialized: initializedRef.current,
    });

    if (autoInitialize && sessionId && programId && !initializedRef.current) {
      console.warn('[useLiveSessionSync] 🚀 Initializing live session context', {
        sessionId,
        programId,
        totalSets,
      });
      initLiveSessionContext(sessionId, programId, totalSets);
      initializedRef.current = true;
    }

    // Cleanup on unmount
    return () => {
      if (initializedRef.current) {
        console.warn('[useLiveSessionSync] 🧹 Clearing live session context');
        clearLiveSession();
        initializedRef.current = false;
      }
    };
  }, [sessionId, programId, totalSets, autoInitialize, initLiveSessionContext, clearLiveSession]);

  // Log when live session is present
  useEffect(() => {
    if (liveSession) {
      logger.debug('[useLiveSessionSync] 📊 Current live session state:', {
        sessionId: liveSession.sessionId,
        status: liveSession.status,
        currentExerciseName: liveSession.currentExerciseName,
        completedSets: liveSession.completedSets,
        totalSets: liveSession.totalSets,
      });
    }
  }, [liveSession]);

  // Progress tracking
  const setProgress = useCallback(
    (exerciseIndex: number, setIndex: number, completedSets: number) => {
      updateLiveSessionProgress(exerciseIndex, setIndex, completedSets);
    },
    [updateLiveSessionProgress]
  );

  // Set current exercise
  const setCurrentExercise = useCallback(
    (exerciseName: string | null, exerciseIndex: number) => {
      storeSetCurrentExercise(exerciseName, exerciseIndex);
    },
    [storeSetCurrentExercise]
  );

  // Record completed set (auto-increments progress and starts rest timer)
  const recordSet = useCallback(
    (setData: LiveSessionSetData) => {
      storeRecordSet({
        weight: setData.weight,
        reps: setData.reps,
        rpe: setData.rpe ?? null,
        duration: setData.duration ?? 0,
      });
    },
    [storeRecordSet]
  );

  // Update rest timer
  const updateTimer = useCallback(
    (running: boolean, secondsRemaining: number) => {
      updateRestTimer(running, secondsRemaining);
    },
    [updateRestTimer]
  );

  // Session status control
  const pauseSession = useCallback(() => {
    setLiveSessionStatus('paused');
  }, [setLiveSessionStatus]);

  const resumeSession = useCallback(() => {
    setLiveSessionStatus('active');
  }, [setLiveSessionStatus]);

  const completeSession = useCallback(() => {
    setLiveSessionStatus('completed');
  }, [setLiveSessionStatus]);

  const endSession = useCallback(() => {
    clearLiveSession();
    initializedRef.current = false;
  }, [clearLiveSession]);

  // Computed values
  const isReady = Boolean(liveSession?.sessionId);
  const progress = liveSession
    ? {
        completed: liveSession.completedSets,
        total: liveSession.totalSets,
        percentage: liveSession.totalSets
          ? Math.round((liveSession.completedSets / liveSession.totalSets) * 100)
          : 0,
      }
    : null;

  return {
    // State
    isReady,
    session: liveSession,
    progress,
    currentExercise: liveSession?.currentExerciseName ?? null,
    lastSet: liveSession?.lastSet ?? null,
    restTimer: liveSession
      ? { running: liveSession.restTimerRunning, remaining: liveSession.restTimeRemaining }
      : null,
    status: liveSession?.status ?? null,

    // Actions
    setProgress,
    setCurrentExercise,
    recordSet,
    updateTimer,
    pauseSession,
    resumeSession,
    completeSession,
    endSession,
  };
}

export default useLiveSessionSync;
