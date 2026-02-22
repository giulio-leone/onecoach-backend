/**
 * Copilot Active Context Store
 *
 * Event-driven context store for AI Copilot interactions.
 * Components report their active/selected state to this store,
 * enabling context-aware AI operations.
 *
 * PRINCIPLES:
 * - Event-driven: Components report state, not URL extraction
 * - Granular: Tracks selection at all levels (program → week → day → exercise → set)
 * - Type-safe: Strong typing for all domain contexts
 * - Future-proof: Extensible for new domains
 *
 * @module lib-stores/copilot-active-context.store
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { WorkoutProgram } from '@giulio-leone/types/workout';
import type { NutritionPlan } from '@giulio-leone/types/nutrition';
import type { Project, Task, Milestone } from '@giulio-leone/types/domain';

// ============================================================================
// Domain-Specific Context Types
// ============================================================================

/**
 * Selection state for a workout exercise
 */
export interface SelectedExercise {
  index: number;
  id: string;
  name: string;
  catalogExerciseId?: string;
}

/**
 * Selection state for a set group within an exercise
 */
export interface SelectedSetGroup {
  exerciseIndex: number;
  groupIndex: number;
}

/**
 * Hover state for UI elements
 */
export interface HoveredElement {
  type: 'exercise' | 'setGroup' | 'set' | 'day' | 'week';
  indices: number[];
}

/**
 * Workout domain active context
 */
export interface WorkoutActiveContext {
  programId: string;
  program: WorkoutProgram | null;
  
  // Navigation state
  weekIndex: number | null;
  dayIndex: number | null;
  
  // Selection state
  selectedExercise: SelectedExercise | null;
  selectedSetGroup: SelectedSetGroup | null;
  
  // Hover state
  hoveredElement: HoveredElement | null;
  
  // Clipboard for cut/copy operations
  clipboard: {
    type: 'exercise' | 'setGroup' | 'day';
    data: unknown;
  } | null;
}

/**
 * Selection state for a meal
 */
export interface SelectedMeal {
  index: number;
  name: string;
}

/**
 * Selection state for a food item
 */
export interface SelectedFood {
  mealIndex: number;
  foodIndex: number;
  name: string;
  foodId?: string;
}

/**
 * Nutrition domain active context
 */
export interface NutritionActiveContext {
  planId: string;
  plan: NutritionPlan | null;
  
  // Navigation state
  dayIndex: number | null;
  
  // Selection state
  selectedMeal: SelectedMeal | null;
  selectedFood: SelectedFood | null;
  
  // Hover state
  hoveredElement: HoveredElement | null;
  
  // Clipboard
  clipboard: {
    type: 'meal' | 'food';
    data: unknown;
  } | null;
}

/**
 * Selection state for a task
 */
export interface SelectedTask {
  id: string;
  title: string;
  parentId?: string;
}

/**
 * Selection state for a milestone
 */
export interface SelectedMilestone {
  id: string;
  title: string;
}

/**
 * OneAgenda domain active context
 */
export interface OneAgendaActiveContext {
  projectId: string;
  
  // Full project data for realtime sync (mirrors Workout/Nutrition pattern)
  project: Project | null;
  tasks: Task[];
  milestones: Milestone[];
  
  // Selection state
  selectedTask: SelectedTask | null;
  selectedMilestone: SelectedMilestone | null;
  
  // Related tasks for context
  subtasks: string[];
  parallelTasks: string[];
  
  // Hover state
  hoveredElement: {
    type: 'task' | 'milestone' | 'habit';
    id: string;
  } | null;
}

/**
 * Live workout session context
 * For real-time coaching during active workout sessions
 */
export interface LiveSessionContext {
  sessionId: string;
  programId: string;
  status: 'active' | 'paused' | 'completed';
  
  // Progress tracking
  currentExerciseIndex: number;
  currentSetIndex: number;
  completedSets: number;
  totalSets: number;
  
  // Current exercise info (for coaching)
  currentExerciseName: string | null;
  
  // Last completed set (for AI coaching analysis)
  lastSet: {
    weight: number;
    reps: number;
    rpe: number | null;
    duration: number; // seconds
  } | null;
  
  // Rest timer state
  restTimerRunning: boolean;
  restTimeRemaining: number; // seconds
  suggestedRestTime: number; // seconds
  
  // Session duration
  sessionStartTime: number; // timestamp
  elapsedTime: number; // seconds
}

/**
 * Domain type
 */
export type ActiveDomain = 'workout' | 'nutrition' | 'oneagenda' | 'liveSession' | null;

// ============================================================================
// Store State & Actions
// ============================================================================

interface CopilotActiveContextState {
  // Current active domain
  domain: ActiveDomain;
  
  // Domain-specific contexts
  workout: WorkoutActiveContext | null;
  nutrition: NutritionActiveContext | null;
  oneAgenda: OneAgendaActiveContext | null;
  liveSession: LiveSessionContext | null;
  
  // Last update timestamp (for debugging/staleness checks)
  lastUpdated: number;
  
  // === Tool Modification Tracking (for UI refresh) ===
  /** Last tool modification event - UI components can subscribe to trigger refresh */
  lastToolModification: {
    domain: 'workout' | 'nutrition' | 'oneagenda';
    resourceId: string;
    toolName: string;
    timestamp: number;
  } | null;
}

interface CopilotActiveContextActions {
  // === Domain Management ===
  setDomain: (domain: ActiveDomain) => void;
  clearContext: () => void;
  
  // === Workout Actions ===
  initWorkoutContext: (programId: string, program: WorkoutProgram) => void;
  updateWorkoutProgram: (program: WorkoutProgram) => void;
  setWorkoutNavigation: (weekIndex: number | null, dayIndex: number | null) => void;
  selectExercise: (exercise: SelectedExercise | null) => void;
  selectSetGroup: (setGroup: SelectedSetGroup | null) => void;
  setWorkoutHover: (element: HoveredElement | null) => void;
  setWorkoutClipboard: (clipboard: WorkoutActiveContext['clipboard']) => void;
  
  // === Nutrition Actions ===
  initNutritionContext: (planId: string, plan: NutritionPlan) => void;
  updateNutritionPlan: (plan: NutritionPlan) => void;
  setNutritionNavigation: (dayIndex: number | null) => void;
  selectMeal: (meal: SelectedMeal | null) => void;
  selectFood: (food: SelectedFood | null) => void;
  setNutritionHover: (element: HoveredElement | null) => void;
  setNutritionClipboard: (clipboard: NutritionActiveContext['clipboard']) => void;
  
  // === OneAgenda Actions ===
  initOneAgendaContext: (projectId: string) => void;
  selectTask: (task: SelectedTask | null) => void;
  selectMilestone: (milestone: SelectedMilestone | null) => void;
  setRelatedTasks: (subtasks: string[], parallelTasks: string[]) => void;
  updateOneAgendaProject: (project: Project, tasks: Task[], milestones: Milestone[]) => void;
  
  // === Live Session Actions ===
  initLiveSessionContext: (sessionId: string, programId: string, totalSets: number) => void;
  updateLiveSessionProgress: (exerciseIndex: number, setIndex: number, completedSets: number) => void;
  setCurrentExercise: (exerciseName: string | null, exerciseIndex: number) => void;
  recordCompletedSet: (setData: LiveSessionContext['lastSet']) => void;
  updateRestTimer: (running: boolean, remaining: number) => void;
  setLiveSessionStatus: (status: LiveSessionContext['status']) => void;
  clearLiveSession: () => void;
  
  // === Selectors (for MCP tools) ===
  getActiveContext: () => WorkoutActiveContext | NutritionActiveContext | OneAgendaActiveContext | LiveSessionContext | null;
  getWorkoutForTools: () => WorkoutProgram | null;
  getNutritionForTools: () => NutritionPlan | null;
  getLiveSessionForTools: () => LiveSessionContext | null;
  
  // === Tool Modification Notification ===
  /** Notify that an MCP tool modified a resource - UI components can subscribe to refresh */
  notifyToolModification: (domain: 'workout' | 'nutrition' | 'oneagenda', resourceId: string, toolName: string) => void;
}

export type CopilotActiveContextStore = CopilotActiveContextState & CopilotActiveContextActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: CopilotActiveContextState = {
  domain: null,
  workout: null,
  nutrition: null,
  oneAgenda: null,
  liveSession: null,
  lastUpdated: 0,
  lastToolModification: null,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useCopilotActiveContextStore = create<CopilotActiveContextStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      // === Domain Management ===
      setDomain: (domain) =>
        set(
          { domain, lastUpdated: Date.now() },
          false,
          'setDomain'
        ),

      clearContext: () =>
        set(
          { ...initialState, lastUpdated: Date.now() },
          false,
          'clearContext'
        ),

      // === Workout Actions ===
      initWorkoutContext: (programId, program) =>
        set(
          {
            domain: 'workout',
            workout: {
              programId,
              program,
              weekIndex: null,
              dayIndex: null,
              selectedExercise: null,
              selectedSetGroup: null,
              hoveredElement: null,
              clipboard: null,
            },
            lastUpdated: Date.now(),
          },
          false,
          'initWorkoutContext'
        ),

      updateWorkoutProgram: (program) =>
        set(
          (state) => ({
            workout: state.workout
              ? { ...state.workout, program }
              : null,
            lastUpdated: Date.now(),
          }),
          false,
          'updateWorkoutProgram'
        ),

      setWorkoutNavigation: (weekIndex, dayIndex) =>
        set(
          (state) => ({
            workout: state.workout
              ? { ...state.workout, weekIndex, dayIndex }
              : null,
            lastUpdated: Date.now(),
          }),
          false,
          'setWorkoutNavigation'
        ),

      selectExercise: (exercise) =>
        set(
          (state) => ({
            workout: state.workout
              ? { ...state.workout, selectedExercise: exercise, selectedSetGroup: null }
              : null,
            lastUpdated: Date.now(),
          }),
          false,
          'selectExercise'
        ),

      selectSetGroup: (setGroup) =>
        set(
          (state) => ({
            workout: state.workout
              ? { ...state.workout, selectedSetGroup: setGroup }
              : null,
            lastUpdated: Date.now(),
          }),
          false,
          'selectSetGroup'
        ),

      setWorkoutHover: (element) =>
        set(
          (state) => ({
            workout: state.workout
              ? { ...state.workout, hoveredElement: element }
              : null,
          }),
          false,
          'setWorkoutHover'
        ),

      setWorkoutClipboard: (clipboard) =>
        set(
          (state) => ({
            workout: state.workout
              ? { ...state.workout, clipboard }
              : null,
            lastUpdated: Date.now(),
          }),
          false,
          'setWorkoutClipboard'
        ),

      // === Nutrition Actions ===
      initNutritionContext: (planId, plan) =>
        set(
          {
            domain: 'nutrition',
            nutrition: {
              planId,
              plan,
              dayIndex: null,
              selectedMeal: null,
              selectedFood: null,
              hoveredElement: null,
              clipboard: null,
            },
            lastUpdated: Date.now(),
          },
          false,
          'initNutritionContext'
        ),

      updateNutritionPlan: (plan) =>
        set(
          (state) => ({
            nutrition: state.nutrition
              ? { ...state.nutrition, plan }
              : null,
            lastUpdated: Date.now(),
          }),
          false,
          'updateNutritionPlan'
        ),

      setNutritionNavigation: (dayIndex) =>
        set(
          (state) => ({
            nutrition: state.nutrition
              ? { ...state.nutrition, dayIndex }
              : null,
            lastUpdated: Date.now(),
          }),
          false,
          'setNutritionNavigation'
        ),

      selectMeal: (meal) =>
        set(
          (state) => ({
            nutrition: state.nutrition
              ? { ...state.nutrition, selectedMeal: meal, selectedFood: null }
              : null,
            lastUpdated: Date.now(),
          }),
          false,
          'selectMeal'
        ),

      selectFood: (food) =>
        set(
          (state) => ({
            nutrition: state.nutrition
              ? { ...state.nutrition, selectedFood: food }
              : null,
            lastUpdated: Date.now(),
          }),
          false,
          'selectFood'
        ),

      setNutritionHover: (element) =>
        set(
          (state) => ({
            nutrition: state.nutrition
              ? { ...state.nutrition, hoveredElement: element }
              : null,
          }),
          false,
          'setNutritionHover'
        ),

      setNutritionClipboard: (clipboard) =>
        set(
          (state) => ({
            nutrition: state.nutrition
              ? { ...state.nutrition, clipboard }
              : null,
            lastUpdated: Date.now(),
          }),
          false,
          'setNutritionClipboard'
        ),

      // === OneAgenda Actions ===
      initOneAgendaContext: (projectId) =>
        set(
          {
            domain: 'oneagenda',
            oneAgenda: {
              projectId,
              project: null,
              tasks: [],
              milestones: [],
              selectedTask: null,
              selectedMilestone: null,
              subtasks: [],
              parallelTasks: [],
              hoveredElement: null,
            },
            lastUpdated: Date.now(),
          },
          false,
          'initOneAgendaContext'
        ),

      selectTask: (task) =>
        set(
          (state) => ({
            oneAgenda: state.oneAgenda
              ? { ...state.oneAgenda, selectedTask: task }
              : null,
            lastUpdated: Date.now(),
          }),
          false,
          'selectTask'
        ),

      selectMilestone: (milestone) =>
        set(
          (state) => ({
            oneAgenda: state.oneAgenda
              ? { ...state.oneAgenda, selectedMilestone: milestone }
              : null,
            lastUpdated: Date.now(),
          }),
          false,
          'selectMilestone'
        ),

      setRelatedTasks: (subtasks, parallelTasks) =>
        set(
          (state) => ({
            oneAgenda: state.oneAgenda
              ? { ...state.oneAgenda, subtasks, parallelTasks }
              : null,
            lastUpdated: Date.now(),
          }),
          false,
          'setRelatedTasks'
        ),

      updateOneAgendaProject: (project, tasks, milestones) =>
        set(
          (state) => ({
            oneAgenda: state.oneAgenda
              ? { ...state.oneAgenda, project, tasks, milestones }
              : null,
            lastUpdated: Date.now(),
          }),
          false,
          'updateOneAgendaProject'
        ),

      initLiveSessionContext: (sessionId, programId, totalSets) => {
        console.warn('[CopilotActiveContextStore] 🚀 initLiveSessionContext called', {
          sessionId,
          programId,
          totalSets,
        });
        set(
          {
            domain: 'liveSession',
            liveSession: {
              sessionId,
              programId,
              status: 'active',
              currentExerciseIndex: 0,
              currentSetIndex: 0,
              completedSets: 0,
              totalSets,
              currentExerciseName: null,
              lastSet: null,
              restTimerRunning: false,
              restTimeRemaining: 0,
              suggestedRestTime: 90,
              sessionStartTime: Date.now(),
              elapsedTime: 0,
            },
            lastUpdated: Date.now(),
          },
          false,
          'initLiveSessionContext'
        );
      },

      updateLiveSessionProgress: (exerciseIndex, setIndex, completedSets) =>
        set(
          (state) => ({
            liveSession: state.liveSession
              ? { ...state.liveSession, currentExerciseIndex: exerciseIndex, currentSetIndex: setIndex, completedSets }
              : null,
            lastUpdated: Date.now(),
          }),
          false,
          'updateLiveSessionProgress'
        ),

      setCurrentExercise: (exerciseName, exerciseIndex) =>
        set(
          (state) => ({
            liveSession: state.liveSession
              ? { ...state.liveSession, currentExerciseName: exerciseName, currentExerciseIndex: exerciseIndex, currentSetIndex: 0 }
              : null,
            lastUpdated: Date.now(),
          }),
          false,
          'setCurrentExercise'
        ),

      recordCompletedSet: (setData) =>
        set(
          (state) => ({
            liveSession: state.liveSession
              ? {
                  ...state.liveSession,
                  lastSet: setData,
                  completedSets: state.liveSession.completedSets + 1,
                  currentSetIndex: state.liveSession.currentSetIndex + 1,
                  restTimerRunning: true,
                  restTimeRemaining: state.liveSession.suggestedRestTime,
                }
              : null,
            lastUpdated: Date.now(),
          }),
          false,
          'recordCompletedSet'
        ),

      updateRestTimer: (running, remaining) =>
        set(
          (state) => ({
            liveSession: state.liveSession
              ? { ...state.liveSession, restTimerRunning: running, restTimeRemaining: remaining }
              : null,
          }),
          false,
          'updateRestTimer'
        ),

      setLiveSessionStatus: (status) =>
        set(
          (state) => ({
            liveSession: state.liveSession
              ? { ...state.liveSession, status }
              : null,
            lastUpdated: Date.now(),
          }),
          false,
          'setLiveSessionStatus'
        ),

      clearLiveSession: () =>
        set(
          { liveSession: null, domain: null, lastUpdated: Date.now() },
          false,
          'clearLiveSession'
        ),

      // === Selectors ===
      getActiveContext: () => {
        const state = get();
        switch (state.domain) {
          case 'workout':
            return state.workout;
          case 'nutrition':
            return state.nutrition;
          case 'oneagenda':
            return state.oneAgenda;
          case 'liveSession':
            return state.liveSession;
          default:
            return null;
        }
      },

      getWorkoutForTools: () => get().workout?.program ?? null,
      getNutritionForTools: () => get().nutrition?.plan ?? null,
      getLiveSessionForTools: () => get().liveSession ?? null,

      // Tool modification notification for UI refresh
      notifyToolModification: (domain, resourceId, toolName) =>
        set(
          {
            lastToolModification: {
              domain,
              resourceId,
              toolName,
              timestamp: Date.now(),
            },
          },
          false,
          'notifyToolModification'
        ),
    })),
    { name: 'copilot-active-context' }
  )
);

// ============================================================================
// Selectors (for performance optimization)
// ============================================================================

export const selectActiveDomain = (state: CopilotActiveContextStore) => state.domain;
export const selectWorkoutContext = (state: CopilotActiveContextStore) => state.workout;
export const selectNutritionContext = (state: CopilotActiveContextStore) => state.nutrition;
export const selectOneAgendaContext = (state: CopilotActiveContextStore) => state.oneAgenda;
export const selectLiveSessionContext = (state: CopilotActiveContextStore) => state.liveSession;
export const selectLastToolModification = (state: CopilotActiveContextStore) => state.lastToolModification;

export const selectSelectedExercise = (state: CopilotActiveContextStore) => 
  state.workout?.selectedExercise ?? null;
export const selectSelectedSetGroup = (state: CopilotActiveContextStore) => 
  state.workout?.selectedSetGroup ?? null;
export const selectSelectedMeal = (state: CopilotActiveContextStore) => 
  state.nutrition?.selectedMeal ?? null;
export const selectSelectedFood = (state: CopilotActiveContextStore) => 
  state.nutrition?.selectedFood ?? null;
export const selectSelectedTask = (state: CopilotActiveContextStore) => 
  state.oneAgenda?.selectedTask ?? null;

// Live Session specific selectors
export const selectLiveSessionStatus = (state: CopilotActiveContextStore) =>
  state.liveSession?.status ?? null;
export const selectLiveSessionProgress = (state: CopilotActiveContextStore) =>
  state.liveSession ? {
    completedSets: state.liveSession.completedSets,
    totalSets: state.liveSession.totalSets,
    currentExercise: state.liveSession.currentExerciseName,
  } : null;
export const selectLastCompletedSet = (state: CopilotActiveContextStore) =>
  state.liveSession?.lastSet ?? null;
export const selectRestTimerState = (state: CopilotActiveContextStore) =>
  state.liveSession ? {
    running: state.liveSession.restTimerRunning,
    remaining: state.liveSession.restTimeRemaining,
  } : null;

/**
 * Get full active context for MCP tools
 * Includes all relevant data the AI needs
 */
export const selectMcpActiveContext = (state: CopilotActiveContextStore) => {
  const { domain, workout, nutrition, oneAgenda, liveSession } = state;
  
  return {
    domain,
    workout: workout ? {
      programId: workout.programId,
      program: workout.program,
      weekIndex: workout.weekIndex,
      dayIndex: workout.dayIndex,
      selectedExercise: workout.selectedExercise,
      selectedSetGroup: workout.selectedSetGroup,
    } : null,
    nutrition: nutrition ? {
      planId: nutrition.planId,
      plan: nutrition.plan,
      dayIndex: nutrition.dayIndex,
      selectedMeal: nutrition.selectedMeal,
      selectedFood: nutrition.selectedFood,
    } : null,
    oneAgenda: oneAgenda ? {
      projectId: oneAgenda.projectId,
      selectedTask: oneAgenda.selectedTask,
      selectedMilestone: oneAgenda.selectedMilestone,
      subtasks: oneAgenda.subtasks,
      parallelTasks: oneAgenda.parallelTasks,
    } : null,
    liveSession: liveSession ? {
      sessionId: liveSession.sessionId,
      programId: liveSession.programId,
      status: liveSession.status,
      currentExerciseName: liveSession.currentExerciseName,
      currentExerciseIndex: liveSession.currentExerciseIndex,
      currentSetIndex: liveSession.currentSetIndex,
      completedSets: liveSession.completedSets,
      totalSets: liveSession.totalSets,
      lastSet: liveSession.lastSet,
      restTimerRunning: liveSession.restTimerRunning,
      restTimeRemaining: liveSession.restTimeRemaining,
    } : null,
  };
};
