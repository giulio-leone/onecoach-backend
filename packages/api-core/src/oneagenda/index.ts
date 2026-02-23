/**
 * @giulio-leone/api-oneagenda
 *
 * API routes per oneagenda (goals, tasks, schedule, insights, calendar)
 * Esporta route handlers che possono essere usati in apps/next/app/api/*
 */

// Goals routes
export {
  GET as oneagendaGoalsGET,
  POST as oneagendaGoalsPOST,
} from './routes/oneagenda/goals/route';
export {
  GET as oneagendaGoalByIdGET,
  DELETE as oneagendaGoalByIdDELETE,
} from './routes/oneagenda/goals/[id]/route';

// Tasks routes
export {
  GET as oneagendaTasksGET,
  POST as oneagendaTasksPOST,
} from './routes/oneagenda/tasks/route';
export {
  GET as oneagendaTaskByIdGET,
  PATCH as oneagendaTaskByIdPATCH,
  DELETE as oneagendaTaskByIdDELETE,
} from './routes/oneagenda/tasks/[id]/route';

// Schedule routes
export {
  GET as oneagendaScheduleGET,
  POST as oneagendaSchedulePOST,
} from './routes/oneagenda/schedule/route';

// Insights routes
export { GET as oneagendaInsightsGET } from './routes/oneagenda/insights/route';
export { POST as oneagendaInsightsActivitySuggestionPOST } from './routes/oneagenda/insights/activity-suggestion/route';

// Calendar routes
export { GET as oneagendaCalendarGoogleAuthGET } from './routes/oneagenda/calendar/google/auth/route';
export { GET as oneagendaCalendarGoogleCallbackGET } from './routes/oneagenda/calendar/google/callback/route';
export { GET as oneagendaCalendarMicrosoftAuthGET } from './routes/oneagenda/calendar/microsoft/auth/route';
export { GET as oneagendaCalendarMicrosoftCallbackGET } from './routes/oneagenda/calendar/microsoft/callback/route';
export {
  GET as oneagendaCalendarProvidersGET,
  POST as oneagendaCalendarProvidersPOST,
  DELETE as oneagendaCalendarProvidersDELETE,
} from './routes/oneagenda/calendar/providers/route';
export {
  GET as oneagendaCalendarSyncGET,
  POST as oneagendaCalendarSyncPOST,
} from './routes/oneagenda/calendar/sync/route';
