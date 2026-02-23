/**
 * @giulio-leone/api-coach
 *
 * API routes per il dominio coach
 * Esporta route handlers che possono essere usati in apps/next/app/api/*
 */

// Coach profile routes
export {
  GET as coachProfileGET,
  POST as coachProfilePOST,
  PUT as coachProfilePUT,
} from './routes/coach/profile/route';

// Coach public routes
export { GET as coachPublicGET } from './routes/coach/public/[userId]/route';

// Coach vetting routes
export { GET as coachVettingGET, POST as coachVettingPOST } from './routes/coach/vetting/route';

// Coach dashboard routes
export { GET as coachDashboardStatsGET } from './routes/coach/dashboard/stats/route';
export { GET as coachDashboardPlansGET } from './routes/coach/dashboard/plans/route';

// Coach analytics routes
export { GET as coachAnalyticsRatingGET } from './routes/coach/analytics/rating/route';
export { GET as coachAnalyticsSalesGET } from './routes/coach/analytics/sales/route';
export { GET as coachAnalyticsRevenueGET } from './routes/coach/analytics/revenue/route';
export { GET as coachAnalyticsTopPlansGET } from './routes/coach/analytics/top-plans/route';

// Coach clients routes
export { GET as coachClientsGET } from './routes/coach/clients/route';
