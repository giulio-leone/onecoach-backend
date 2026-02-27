/**
 * @giulio-leone/oneagenda-core
 *
 * Core services for OneAgenda: CRUD, calendar sync, AI assistant.
 */

// DB (CRUD goals/tasks/preferences)
export { oneagendaDB } from './db';

// Calendar
export { CalendarSyncService } from './calendar-sync.service';

// AI Assistant
export { IntelligentAssistantService } from './intelligent-assistant.service';

// Types
export {
  TaskStatus,
  TaskPriority,
  type GoalData,
  type TaskData,
  type TaskUpdateData,
  type TaskFilters,
  type QueryOptions,
  type CalendarProvider,
  type CalendarProviderConfig,
  type UserPreferences,
  type PlanDayInput,
  type SuggestInput,
  type TrackProgressInput,
} from './types';
