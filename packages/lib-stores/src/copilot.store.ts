import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ===== Types =====
export type CopilotMode = 'chat' | 'context-aware' | 'minimized';
export type CopilotDisplayMode = 'sidebar' | 'bottom-sheet';

/**
 * Domain context types for MCP tools
 * Used to pass context without relying on URL parameters
 */
export type CopilotDomain =
  | 'nutrition'
  | 'workout'
  | 'exercise'
  | 'athlete'
  | 'oneagenda'
  | 'marketplace'
  | 'analytics'
  | 'chat'
  | 'settings'
  | 'admin'
  | null;

/**
 * Nutrition-specific context
 */
export interface NutritionContext {
  planId: string | null;
  dayNumber: number | null;
  mealIndex: number | null;
  athleteId: string | null;
  totalDays: number | null;
}

/**
 * Workout-specific context
 */
export interface WorkoutContext {
  programId: string | null;
  sessionId: string | null; // Live session identifier
  weekNumber: number | null;
  dayNumber: number | null;
  exerciseIndex: number | null;
  setGroupIndex: number | null;
  athleteId: string | null;
  totalWeeks: number | null;
  isLiveSession: boolean; // Flag for live workout sessions
}

/**
 * OneAgenda-specific context
 */
export interface OneAgendaContext {
  projectId: string | null;
  taskId: string | null;
  milestoneId: string | null;
  habitId: string | null;
}

/**
 * Marketplace-specific context
 */
export interface MarketplaceContext {
  productId: string | null;
  categoryId: string | null;
  affiliateCode: string | null;
  orderId: string | null;
}

/**
 * Exercise-specific context
 */
export interface ExerciseContext {
  exerciseId: string | null;
  categoryFilter: string | null;
  muscleGroupFilter: string | null;
  searchQuery: string | null;
}

/**
 * Analytics-specific context
 */
export interface AnalyticsContext {
  athleteId: string | null;
  dateRange: { start: string; end: string } | null;
  metricType: 'nutrition' | 'workout' | 'progress' | 'all' | null;
}

/**
 * Complete MCP context - passed to all tools
 */
export interface McpToolContext {
  // Domain identification
  domain: CopilotDomain;

  // User/Role context
  userId: string | null;
  athleteId: string | null;
  coachId: string | null;
  isAdmin: boolean;

  // Domain-specific contexts
  nutrition: NutritionContext;
  workout: WorkoutContext;
  exercise: ExerciseContext;
  oneAgenda: OneAgendaContext;
  marketplace: MarketplaceContext;
  analytics: AnalyticsContext;

  // Route metadata
  route: string;
  locale: string;
}

export interface CopilotFeatures {
  modelSelector: boolean;
  speechRecognition: boolean;
  attachments: boolean;
  sources: boolean;
  conversationHistory: boolean;
  contextAware: boolean;
}

export interface CopilotModel {
  id: string;
  name: string;
  provider: string;
  description?: string;
  isDefault?: boolean;
}

// ===== Default Context Values =====
const DEFAULT_NUTRITION_CONTEXT: NutritionContext = {
  planId: null,
  dayNumber: null,
  mealIndex: null,
  athleteId: null,
  totalDays: null,
};

const DEFAULT_WORKOUT_CONTEXT: WorkoutContext = {
  programId: null,
  sessionId: null,
  weekNumber: null,
  dayNumber: null,
  exerciseIndex: null,
  setGroupIndex: null,
  athleteId: null,
  totalWeeks: null,
  isLiveSession: false,
};

const DEFAULT_ONEAGENDA_CONTEXT: OneAgendaContext = {
  projectId: null,
  taskId: null,
  milestoneId: null,
  habitId: null,
};

const DEFAULT_MARKETPLACE_CONTEXT: MarketplaceContext = {
  productId: null,
  categoryId: null,
  affiliateCode: null,
  orderId: null,
};

const DEFAULT_EXERCISE_CONTEXT: ExerciseContext = {
  exerciseId: null,
  categoryFilter: null,
  muscleGroupFilter: null,
  searchQuery: null,
};

const DEFAULT_ANALYTICS_CONTEXT: AnalyticsContext = {
  athleteId: null,
  dateRange: null,
  metricType: null,
};

const DEFAULT_MCP_CONTEXT: McpToolContext = {
  domain: null,
  userId: null,
  athleteId: null,
  coachId: null,
  isAdmin: false,
  nutrition: DEFAULT_NUTRITION_CONTEXT,
  workout: DEFAULT_WORKOUT_CONTEXT,
  exercise: DEFAULT_EXERCISE_CONTEXT,
  oneAgenda: DEFAULT_ONEAGENDA_CONTEXT,
  marketplace: DEFAULT_MARKETPLACE_CONTEXT,
  analytics: DEFAULT_ANALYTICS_CONTEXT,
  route: '',
  locale: 'it',
};

// ===== State Interface =====
interface CopilotState {
  // Visibility state
  isOpen: boolean;
  toggleOpen: () => void;
  close: () => void;
  open: () => void;

  // Mode and Context
  mode: CopilotMode;
  displayMode: CopilotDisplayMode;
  isExpanded: boolean;
  setMode: (mode: CopilotMode) => void;
  setDisplayMode: (mode: CopilotDisplayMode) => void;
  setExpanded: (expanded: boolean) => void;

  // Resize (Desktop/Tablet)
  width: number;
  minWidth: number;
  maxWidth: number;
  isResizing: boolean;
  setWidth: (width: number) => void;
  setResizing: (resizing: boolean) => void;

  // Features (fetched from API)
  features: CopilotFeatures;
  setFeatures: (features: CopilotFeatures) => void;

  // Models
  models: CopilotModel[];
  selectedModelId: string | null;
  setModels: (models: CopilotModel[]) => void;
  setSelectedModelId: (id: string) => void;

  // User role
  userRole: 'admin' | 'coach' | 'athlete' | null;
  setUserRole: (role: 'admin' | 'coach' | 'athlete' | null) => void;

  // Screen context (legacy - use mcpContext instead)
  currentRoute: string;
  screenContext: Record<string, unknown>;
  setCurrentRoute: (route: string) => void;
  setScreenContext: (context: Record<string, unknown>) => void;

  // MCP Tool Context - centralized context for all MCP tools
  mcpContext: McpToolContext;
  setMcpContext: (context: Partial<McpToolContext>) => void;
  setNutritionContext: (context: Partial<NutritionContext>) => void;
  setWorkoutContext: (context: Partial<WorkoutContext>) => void;
  setExerciseContext: (context: Partial<ExerciseContext>) => void;
  setOneAgendaContext: (context: Partial<OneAgendaContext>) => void;
  setMarketplaceContext: (context: Partial<MarketplaceContext>) => void;
  setAnalyticsContext: (context: Partial<AnalyticsContext>) => void;
  setDomain: (domain: CopilotDomain) => void;
  setAthleteId: (athleteId: string | null) => void;
  clearDomainContext: () => void;
  getMcpContext: () => McpToolContext;

  // Initialization
  initialize: (userId: string, route: string) => void;
  isInitialized: boolean;
}

// ===== Default Values =====
const DEFAULT_WIDTH = 420;
const MIN_WIDTH = 320;
const MAX_WIDTH = 600;

const DEFAULT_FEATURES: CopilotFeatures = {
  modelSelector: false,
  speechRecognition: false,
  attachments: false,
  sources: false,
  conversationHistory: false,
  contextAware: true,
};

// ===== Store =====
export const useCopilotStore = create<CopilotState>()(
  persist(
    (set, get) => ({
      // Visibility
      isOpen: false,
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      close: () => set({ isOpen: false }),
      open: () => set({ isOpen: true }),

      // Mode
      mode: 'chat',
      displayMode: 'sidebar',
      isExpanded: false,
      setMode: (mode) => set({ mode }),
      setDisplayMode: (displayMode) => set({ displayMode }),
      setExpanded: (isExpanded) => set({ isExpanded }),

      // Resize
      width: DEFAULT_WIDTH,
      minWidth: MIN_WIDTH,
      maxWidth: MAX_WIDTH,
      isResizing: false,
      setWidth: (width) => {
        const { minWidth, maxWidth } = get();
        const clampedWidth = Math.max(minWidth, Math.min(maxWidth, width));
        set({ width: clampedWidth });
      },
      setResizing: (isResizing) => set({ isResizing }),

      // Features
      features: DEFAULT_FEATURES,
      setFeatures: (features) => set({ features }),

      // Models
      models: [],
      selectedModelId: null,
      setModels: (models) => {
        const defaultModel = models.find((m: any) => m.isDefault);
        set({
          models,
          selectedModelId: defaultModel?.id || models[0]?.id || null,
        });
      },
      setSelectedModelId: (selectedModelId) => set({ selectedModelId }),

      // User role
      userRole: null,
      setUserRole: (userRole) => set({ userRole }),

      // Screen context (legacy)
      currentRoute: '',
      screenContext: {},
      setCurrentRoute: (currentRoute) => {
        set({ currentRoute });
        // Also update mcpContext route
        set((state) => ({
          mcpContext: { ...state.mcpContext, route: currentRoute },
        }));
      },
      setScreenContext: (screenContext) => set({ screenContext }),

      // MCP Tool Context
      mcpContext: DEFAULT_MCP_CONTEXT,

      setMcpContext: (context) =>
        set((state) => ({
          mcpContext: { ...state.mcpContext, ...context },
        })),

      setNutritionContext: (context) =>
        set((state) => ({
          mcpContext: {
            ...state.mcpContext,
            domain: 'nutrition',
            nutrition: { ...state.mcpContext.nutrition, ...context },
          },
        })),

      setWorkoutContext: (context) =>
        set((state) => ({
          mcpContext: {
            ...state.mcpContext,
            domain: 'workout',
            workout: { ...state.mcpContext.workout, ...context },
          },
        })),

      setExerciseContext: (context) =>
        set((state) => ({
          mcpContext: {
            ...state.mcpContext,
            domain: 'exercise',
            exercise: { ...state.mcpContext.exercise, ...context },
          },
        })),

      setOneAgendaContext: (context) =>
        set((state) => ({
          mcpContext: {
            ...state.mcpContext,
            domain: 'oneagenda',
            oneAgenda: { ...state.mcpContext.oneAgenda, ...context },
          },
        })),

      setMarketplaceContext: (context) =>
        set((state) => ({
          mcpContext: {
            ...state.mcpContext,
            domain: 'marketplace',
            marketplace: { ...state.mcpContext.marketplace, ...context },
          },
        })),

      setAnalyticsContext: (context) =>
        set((state) => ({
          mcpContext: {
            ...state.mcpContext,
            domain: 'analytics',
            analytics: { ...state.mcpContext.analytics, ...context },
          },
        })),

      setDomain: (domain) =>
        set((state) => ({
          mcpContext: { ...state.mcpContext, domain },
        })),

      setAthleteId: (athleteId) =>
        set((state) => ({
          mcpContext: { ...state.mcpContext, athleteId },
        })),

      clearDomainContext: () =>
        set((state) => ({
          mcpContext: {
            ...state.mcpContext,
            domain: null,
            nutrition: DEFAULT_NUTRITION_CONTEXT,
            workout: DEFAULT_WORKOUT_CONTEXT,
            exercise: DEFAULT_EXERCISE_CONTEXT,
            oneAgenda: DEFAULT_ONEAGENDA_CONTEXT,
            marketplace: DEFAULT_MARKETPLACE_CONTEXT,
            analytics: DEFAULT_ANALYTICS_CONTEXT,
          },
        })),

      getMcpContext: () => get().mcpContext,

      // Initialization
      isInitialized: false,
      initialize: (userId, route) => {
        set((state) => ({
          currentRoute: route,
          isInitialized: true,
          mcpContext: {
            ...state.mcpContext,
            userId,
            route,
          },
        }));
      },
    }),
    {
      name: 'copilot-storage',
      partialize: (state) => ({
        width: state.width,
        selectedModelId: state.selectedModelId,
        mode: state.mode,
        // Note: mcpContext is NOT persisted to avoid stale context
      }),
    }
  )
);

// ===== Selectors =====
export const selectCopilotIsOpen = (state: CopilotState) => state.isOpen;
export const selectCopilotWidth = (state: CopilotState) => state.width;
export const selectCopilotFeatures = (state: CopilotState) => state.features;
export const selectCopilotModels = (state: CopilotState) => state.models;
export const selectCopilotSelectedModel = (state: CopilotState) =>
  state.models.find((m: any) => m.id === state.selectedModelId) || null;
export const selectCopilotDisplayMode = (state: CopilotState) => state.displayMode;
export const selectCopilotIsResizing = (state: CopilotState) => state.isResizing;

// MCP Context Selectors
export const selectMcpContext = (state: CopilotState) => state.mcpContext;
export const selectCurrentDomain = (state: CopilotState) => state.mcpContext.domain;
export const selectNutritionContext = (state: CopilotState) => state.mcpContext.nutrition;
export const selectWorkoutContext = (state: CopilotState) => state.mcpContext.workout;
export const selectExerciseContext = (state: CopilotState) => state.mcpContext.exercise;
export const selectOneAgendaContext = (state: CopilotState) => state.mcpContext.oneAgenda;
export const selectMarketplaceContext = (state: CopilotState) => state.mcpContext.marketplace;
export const selectAnalyticsContext = (state: CopilotState) => state.mcpContext.analytics;
export const selectCurrentAthleteId = (state: CopilotState) => state.mcpContext.athleteId;

/**
 * Get the active context based on current domain
 */
export const selectActiveDomainContext = (state: CopilotState) => {
  const { domain } = state.mcpContext;
  switch (domain) {
    case 'nutrition':
      return state.mcpContext.nutrition;
    case 'workout':
      return state.mcpContext.workout;
    case 'exercise':
      return state.mcpContext.exercise;
    case 'oneagenda':
      return state.mcpContext.oneAgenda;
    case 'marketplace':
      return state.mcpContext.marketplace;
    case 'analytics':
      return state.mcpContext.analytics;
    default:
      return null;
  }
};
