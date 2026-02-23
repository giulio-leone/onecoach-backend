/**
 * @giulio-leone/api-analytics
 *
 * API routes per il dominio analytics
 * Esporta route handlers che possono essere usati in apps/next/app/api/analytics/*
 */

export { GET as analyticsOverviewGET } from './routes/analytics/overview/route';
export { GET as analyticsChartsGET } from './routes/analytics/charts/[type]/route';
export {
  GET as analyticsBodyMeasurementsGET,
  POST as analyticsBodyMeasurementsPOST,
} from './routes/analytics/body-measurements/route';
export {
  GET as analyticsBodyMeasurementByIdGET,
  PUT as analyticsBodyMeasurementByIdPUT,
  DELETE as analyticsBodyMeasurementByIdDELETE,
} from './routes/analytics/body-measurements/[id]/route';
export {
  GET as analyticsSnapshotsGET,
  POST as analyticsSnapshotsPOST,
} from './routes/analytics/snapshots/route';
