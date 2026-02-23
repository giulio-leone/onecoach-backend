/**
 * @giulio-leone/api-exercise
 *
 * API routes per il dominio esercizi
 * Esporta route handlers che possono essere usati in apps/next/app/api/exercises/*
 */

// Main routes
export { GET as exercisesGET, POST as exercisesPOST } from './routes/exercises/route';
export {
  GET as exerciseByIdGET,
  PUT as exerciseByIdPUT,
  DELETE as exerciseByIdDELETE,
} from './routes/exercises/[id]/route';
export { GET as exerciseVersionsGET } from './routes/exercises/[id]/versions/route';
export { GET as exercisesAutocompleteGET } from './routes/exercises/autocomplete/route';
export { GET as exercisesBodyPartsGET } from './routes/exercises/body-parts/route';
export { GET as exercisesMusclesGET } from './routes/exercises/muscles/route';
export { GET as exercisesEquipmentsGET } from './routes/exercises/equipments/route';
export { GET as exercisesTypesGET } from './routes/exercises/types/route';

// Admin routes
export { POST as adminExercisesBatchPOST } from './routes/admin/exercises/batch/route';
export { POST as adminExercisesAiPOST } from './routes/admin/exercises/ai/route';
export { POST as adminExercisesAiStreamPOST } from './routes/admin/exercises/ai/stream/route';
export { GET as adminExercisesExportGET } from './routes/admin/exercises/export/route';
export { POST as adminExercisesImportPOST } from './routes/admin/exercises/import/route';
