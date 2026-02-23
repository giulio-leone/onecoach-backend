/**
 * Imported Body Measurements Schema
 *
 * Schema Zod per parsing AI di misurazioni corporee
 * da file (CSV, XLSX, PDF, immagini).
 *
 * @module lib-body-measurements/schemas/imported-body-measurements
 */

import { z } from 'zod';

/**
 * Schema per una singola misurazione corporea importata
 */
export const ImportedMeasurementSchema = z.object({
  /** Data della misurazione (ISO string o formato parsabile) */
  date: z.string().describe('Data della misurazione in formato ISO o YYYY-MM-DD'),

  // Base metrics
  weight: z.number().nullable().optional().describe('Peso in kg'),
  height: z.number().nullable().optional().describe('Altezza in cm'),

  // Body composition
  bodyFat: z.number().nullable().optional().describe('Percentuale massa grassa (%)'),
  muscleMass: z.number().nullable().optional().describe('Massa muscolare in kg'),
  visceralFat: z.number().nullable().optional().describe('Grasso viscerale (rating 1-59)'),
  waterPercentage: z.number().nullable().optional().describe('Percentuale acqua corporea (%)'),
  boneMass: z.number().nullable().optional().describe('Massa ossea in kg'),
  metabolicAge: z.number().int().nullable().optional().describe('Età metabolica in anni'),
  bmr: z.number().int().nullable().optional().describe('BMR in kcal'),

  // Circumferences (cm)
  chest: z.number().nullable().optional().describe('Circonferenza petto in cm'),
  waist: z.number().nullable().optional().describe('Circonferenza vita in cm'),
  hips: z.number().nullable().optional().describe('Circonferenza fianchi in cm'),
  shoulders: z.number().nullable().optional().describe('Circonferenza spalle in cm'),
  arm: z.number().nullable().optional().describe('Circonferenza braccio in cm'),
  forearm: z.number().nullable().optional().describe('Circonferenza avambraccio in cm'),
  thigh: z.number().nullable().optional().describe('Circonferenza coscia in cm'),
  calf: z.number().nullable().optional().describe('Circonferenza polpaccio in cm'),
  neck: z.number().nullable().optional().describe('Circonferenza collo in cm'),

  // Notes
  notes: z.string().nullable().optional().describe('Note aggiuntive'),
});

export type ImportedMeasurement = z.infer<typeof ImportedMeasurementSchema>;

/**
 * Schema per un batch di misurazioni importate
 */
export const ImportedBodyMeasurementsSchema = z.object({
  /** Nome della fonte/documento */
  sourceName: z
    .string()
    .default('Imported Measurements')
    .describe('Nome del documento o fonte dei dati'),

  /** Descrizione opzionale */
  description: z.string().nullable().optional().describe('Descrizione del dataset'),

  /** Array di misurazioni estratte */
  measurements: z
    .array(ImportedMeasurementSchema)
    .min(1)
    .describe('Array di misurazioni estratte dal documento'),

  /** Metadati aggiuntivi rilevati (es. nome atleta, unità di misura) */
  metadata: z
    .object({
      athleteName: z.string().nullable().optional(),
      measurementUnit: z.enum(['metric', 'imperial']).default('metric'),
      sourceType: z.string().nullable().optional(),
    })
    .optional(),
});

export type ImportedBodyMeasurements = z.infer<typeof ImportedBodyMeasurementsSchema>;
