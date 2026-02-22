/**
 * Zustand Stores
 *
 * Centralized state management using Zustand
 * Following SOLID principles and strong typing
 */

export { useAuthStore } from './auth.store';
export {
  useUIStore,
  useSidebar,
  useWizard,
  useSystemThemeSyncNative,
} from './ui.store';
export * from './ui.store';
// export * from './types/safe-types';
export * from './utils/dialog-global';
export * from './sidebar.store';
export * from './workout-builder.store';

// Theme exports from @giulio-leone/lib-theme (single source of truth)
export {
  useTheme,
  useSystemThemeSync,
  useThemeStore,
  lightColors,
  darkColors,
  ThemeProvider,
  cn,
  darkModeClasses,
  THEME_STORAGE_KEY,
} from '@giulio-leone/lib-theme';

export type {
  ThemePreference,
  ResolvedTheme,
  ThemeColors,
  ThemeProviderProps,
} from '@giulio-leone/lib-theme';

export {
  useHealthStore,
  useHealthPermissions,
  useHealthSync,
  useHealthSummary,
} from './health.store';
export type {
  HealthPlatform,
  HealthPermissions,
  HealthSummary,
  SyncStatus,
  HealthState,
  HealthActions,
  HealthStore,
} from './health.store';

export { useIAPStore, useIAPProducts, useIAPSubscription, useIAPPurchase } from './iap.store';
export type {
  ProductId,
  IAPProduct,
  SubscriptionStatus,
  PurchaseState,
  IAPError,
  IAPState,
  IAPActions,
  IAPStore,
} from './iap.store';

export { useDialogStore, useDialog, useDialogState } from './dialog.store';
export type {
  DialogType,
  DialogOptions,
  DialogState,
  DialogActions,
  DialogStore,
} from './dialog.store';

export { useOnboardingStore } from './onboarding.store';
export type {
  OnboardingState,
  OnboardingActions,
  OnboardingStore,
  OnboardingProgress,
  OnboardingStepCompletion,
} from './onboarding.store';

export type { AuthState, AuthActions, AuthStore, User } from './auth.store';

export { useAdminStore } from './admin.store';
export type { ExerciseFilters, FoodFilters, AdminState } from './admin.store';

// AI Settings Store (types are generic - canonical types in @giulio-leone/ui-admin)
export {
  useAISettingsStore,
  selectActiveSection,
  selectVisitedTabs,
  selectIsInitialized,
} from './ai-settings.store';
export type { SectionId } from './ai-settings.store';

export { useHeaderActions } from './header-actions.store';

export { useNavigationStateStore } from './navigation-state.store';
export {
  useCopilotStore,
  selectCopilotIsOpen,
  selectCopilotWidth,
  selectCopilotFeatures,
  selectCopilotModels,
  selectCopilotSelectedModel,
  selectCopilotDisplayMode,
  selectCopilotIsResizing,
  // MCP Context Selectors
  selectMcpContext,
  selectCurrentDomain,
  selectNutritionContext,
  selectWorkoutContext,
  selectExerciseContext,
  selectOneAgendaContext,
  selectMarketplaceContext,
  selectAnalyticsContext,
  selectCurrentAthleteId,
  selectActiveDomainContext,
} from './copilot.store';
export type {
  CopilotMode,
  CopilotDisplayMode,
  CopilotFeatures,
  CopilotModel,
  // MCP Context Types
  CopilotDomain,
  NutritionContext,
  WorkoutContext,
  ExerciseContext,
  OneAgendaContext,
  MarketplaceContext,
  AnalyticsContext,
  McpToolContext,
} from './copilot.store';

// Maxes Store
export {
  useMaxesStore,
  useMax,
  useMaxHistory,
  useMaxesLoading,
  useMaxesError,
  selectMaxesList,
  selectMaxByExerciseId,
  selectHistoryByExerciseId,
  selectSelectedMax,
  selectHasMaxes,
  selectMaxesCount,
  selectMaxesSortedByName,
  selectMaxesSortedByWeight,
  selectMaxesSortedByDate,
} from './maxes.store';
export type {
  Max,
  MaxVersion,
  CreateMaxInput,
  UpdateMaxInput,
  MaxesState,
  MaxesActions,
  MaxesStore,
} from './maxes.store';

// Realtime Store & Hooks
export {
  useRealtimeStore,
  selectRealtimeStatus,
  selectIsRealtimeReady,
  selectRealtimeError,
} from './realtime.store';
export type {
  RealtimeEventType,
  RealtimePayload,
  RealtimeListener,
  ConnectionStatus,
  RealtimeState,
  RealtimeActions,
  RealtimeStore,
} from './realtime.store';

export {
  useRealtimeSubscription,
  useSyncField,
  useRealtimeStatus,
  useRealtimeDebug,
  useRealtimeSync,
  useRealtimeListSync,
  useRealtimeSyncSingle,
  useMagicAnimation,
  useRealtimeWithMagic,
} from './realtime.hooks';
export { useOneAgendaStore } from './oneagenda.store';
export {
  useDirectConversationsRealtime,
  useDirectMessagesRealtime,
  useDirectMessagingRealtime,
  useDirectConversationsSync,
  useDirectMessagesSync,
} from './direct-messaging.hooks';
export type {
  UseDirectConversationsRealtimeOptions,
  UseDirectMessagesRealtimeOptions,
  UseDirectMessagingRealtimeOptions,
  UseDirectConversationsSyncOptions,
  UseDirectMessagesSyncOptions,
} from './direct-messaging.hooks';
export type {
  UseRealtimeSubscriptionOptions,
  UseSyncFieldOptions,
  UseRealtimeSyncOptions,
  UseRealtimeSyncSingleOptions,
  MagicAnimationType,
  UseMagicAnimationOptions,
  UseMagicAnimationResult,
  UseRealtimeWithMagicOptions,
} from './realtime.hooks';

// Chat Store (SSOT per chat state)
export {
  useChatStore,
  selectConversations,
  selectCurrentConversationId,
  selectMessages,
  selectInput,
  selectIsLoading,
  selectIsDeleting,
  selectLastError,
  selectCurrentConversation,
  selectHasConversations,
  selectConversationsCount,
  selectMessageCount,
} from './chat.store';
export type {
  ChatConversation,
  ChatMessage,
  ChatState,
  ChatActions,
  ChatStore,
} from './chat.store';

// AI Models Store (SSOT per AI model selection)
export {
  useAIModelsStore,
  selectModels,
  selectSelectedModelId,
  selectSelectedModel,
  selectSelectedModelName,
  selectSelectedProvider,
  selectIsLoading as selectModelsLoading,
  selectError as selectModelsError,
  useSelectedModelName,
  useSelectedModel,
  useAvailableModels,
} from './ai-models.store';
export type { AIModel } from './ai-models.store';

// Body Measurements Store (for Realtime sync)
export {
  useBodyMeasurementsStore,
  selectLatestMeasurement,
  selectAllMeasurements,
  selectMeasurementsLoading,
} from './body-measurements.store';

// Body Measurements Realtime Hooks
export {
  useBodyMeasurementsRealtime,
  useAllBodyMeasurementsRealtime,
  bodyMeasurementsKeys,
} from './body-measurements.hooks';

export {
  useCopilotActiveContextStore,
  selectActiveDomain,
  selectWorkoutContext as selectActiveWorkoutContext,
  selectNutritionContext as selectActiveNutritionContext,
  selectOneAgendaContext as selectActiveOneAgendaContext,
  selectLiveSessionContext,
  selectLiveSessionStatus,
  selectLiveSessionProgress,
  selectLastCompletedSet,
  selectRestTimerState,
  selectSelectedExercise,
  selectSelectedSetGroup,
  selectSelectedMeal,
  selectSelectedFood,
  selectSelectedTask,
  selectMcpActiveContext,
  selectLastToolModification,
} from './copilot-active-context.store';
export type {
  SelectedExercise,
  SelectedSetGroup,
  SelectedMeal,
  SelectedFood,
  SelectedTask,
  SelectedMilestone,
  HoveredElement,
  WorkoutActiveContext,
  NutritionActiveContext,
  OneAgendaActiveContext,
  LiveSessionContext,
  ActiveDomain,
  CopilotActiveContextStore,
} from './copilot-active-context.store';

// Live Session Sync Hook
export { useLiveSessionSync } from './hooks/useLiveSessionSync';
export type { UseLiveSessionSyncOptions, LiveSessionSetData } from './hooks/useLiveSessionSync';

// Session Persistence Hook (localStorage with TTL)
export { useSessionPersistence } from './hooks/use-session-persistence';
export type { SessionPersistenceOptions } from './hooks/use-session-persistence';

// Versioning Store (for undo/redo and version history)
export {
  createVersioningStore,
  useVersioningSelectors,
  computeDiff,
} from './versioning.store';
export type {
  VersionSnapshot,
  StateChange,
  StateDiff,
  VersioningStoreConfig,
  VersioningState,
  VersioningStore,
} from './versioning.store';

// ============================================================================
// Copilot Context Framework (New - Domain-Agnostic)
// ============================================================================
// Generic framework for copilot context management.
// ~150 LOC instead of 800+, 7 actions instead of 30+.
// Domains register themselves - no hardcoding required.

export {
  // Store
  useCopilotContextStore,
  registerDomain,
  getDomainConfig,
  getRegisteredDomains,
  selectActiveDomain as selectActiveDomainV2,
  selectContext,
  selectData,
  // Hooks
  useCopilotContext,
  useCopilotToolNotification,
  useRegisteredDomains,
  // Domains
  workoutDomain,
  nutritionDomain,
  oneAgendaDomain,
  liveSessionDomain,
  registerAllDomains,
} from './copilot-context';

export type {
  DomainConfig,
  CopilotContextState,
  CopilotContextActions,
  CopilotContextStore as CopilotContextStoreV2, // Avoid conflict with legacy
  // Domain Context Types (V2 = new framework)
  WorkoutContext as WorkoutContextV2,
  NutritionContext as NutritionContextV2,
  OneAgendaContext as OneAgendaContextV2,
  LiveSessionContext as LiveSessionContextV2,
} from './copilot-context';

// Catalog Store (cached exercises/foods for Copilot)
export {
  useCatalogStore,
  selectExercises,
  selectFoods,
  selectIsLoadingCatalog,
  getCatalogForAI,
} from './catalog.store';
export type {
  CatalogExercise,
  CatalogFood,
} from './catalog.store';
