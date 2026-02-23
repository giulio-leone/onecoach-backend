/**
 * Body Measurements Import Service
 *
 * Orchestrates the import process for body measurements files.
 * Extends BaseImportService for shared validation and workflow logic.
 *
 * @module lib-body-measurements/services/body-measurements-import.service
 */

import { BaseImportService } from '@giulio-leone/lib-shared/import-core';
import type { ImportOptions, BaseImportResult } from '@giulio-leone/lib-shared/import-core';
import { prisma } from '@giulio-leone/lib-core';
import type { ImportedBodyMeasurements, ImportedMeasurement } from '../schemas/imported-body-measurements.schema';

export interface BodyMeasurementsImportResult extends BaseImportResult {
  measurementsImported: number;
}

export class BodyMeasurementsImportService extends BaseImportService<ImportedBodyMeasurements, ImportedMeasurement[], BodyMeasurementsImportResult> {
  protected getLoggerName(): string {
    return 'BodyMeasurementsImport';
  }

  protected buildPrompt(_options?: Partial<ImportOptions>): string {
    // Prompt logic is handled by VisionService individual prompts,
    // but BaseImport expects this. We can return a generic intent string
    // or if we refactored BaseImport to delegate prompt building, we'd do that.
    // In our VisionService, the prompt is hardcoded per file type.
    // We will just pass an empty string here as VisionService ignores generic prompt arg
    // in favor of its specific prompts, OR we pass context if needed.
    return 'Parse body measurements.';
  }

  protected async processParsed(
    parsed: ImportedBodyMeasurements,
    _userId: string,
    _options?: Partial<ImportOptions>
  ): Promise<ImportedMeasurement[]> {
    // Data normalization logic
    // e.g. sort by date, validate logical ranges (weight > 0)
    // Here we mainly filter out invalid entries

    const validMeasurements = parsed.measurements.filter((m) => {
      // Basic sanity checks
      if (!m.date) return false;
      const hasMetric = m.weight || m.bodyFat || m.chest || m.waist || m.hips; // Must have at least one metric
      return hasMetric;
    });

    return validMeasurements;
  }

  protected async persist(
    processed: ImportedMeasurement[],
    userId: string
  ): Promise<Partial<BodyMeasurementsImportResult>> {
    let count = 0;

    for (const measurement of processed) {
      if (!measurement.date) continue; // Should be filtered already

      const date = new Date(measurement.date);
      if (isNaN(date.getTime())) {
          this.logger.warn(`Invalid date found: ${measurement.date}`);
          continue;
      }

      // Upsert logic based on User + Date
      // Prisma requires unique constraint for upsert.
      // Assuming body_measurements has unique constraint on [userId, date] or we find first.
      
      // Since specific unique constraint might vary, safe approach is findFirst -> update OR create.
      const existing = await prisma.body_measurements.findFirst({
        where: {
          userId,
          date: date,
        },
      });

      const dataPayload = {
        weight: measurement.weight ? Number(measurement.weight) : undefined,
        height: measurement.height ? Number(measurement.height) : undefined,
        bodyFat: measurement.bodyFat ? Number(measurement.bodyFat) : undefined,
        muscleMass: measurement.muscleMass ? Number(measurement.muscleMass) : undefined,
        visceralFat: measurement.visceralFat ? Number(measurement.visceralFat) : undefined,
        waterPercentage: measurement.waterPercentage ? Number(measurement.waterPercentage) : undefined,
        boneMass: measurement.boneMass ? Number(measurement.boneMass) : undefined,
        metabolicAge: measurement.metabolicAge ? Number(measurement.metabolicAge) : undefined,
        bmr: measurement.bmr ? Number(measurement.bmr) : undefined,
        
        chest: measurement.chest ? Number(measurement.chest) : undefined,
        waist: measurement.waist ? Number(measurement.waist) : undefined,
        hips: measurement.hips ? Number(measurement.hips) : undefined,
        shoulders: measurement.shoulders ? Number(measurement.shoulders) : undefined,
        arm: measurement.arm ? Number(measurement.arm) : undefined,
        thigh: measurement.thigh ? Number(measurement.thigh) : undefined,
        calf: measurement.calf ? Number(measurement.calf) : undefined,
        neck: measurement.neck ? Number(measurement.neck) : undefined,
        
        notes: measurement.notes || undefined,
      };

      if (existing) {
        await prisma.body_measurements.update({
          where: { id: existing.id },
          data: dataPayload,
        });
      } else {
        await prisma.body_measurements.create({
          data: {
            ...dataPayload,
            userId,
            date: date,
          },
        });
      }
      count++;
    }

    return {
      measurementsImported: count,
    };
  }

  protected createErrorResult(errors: string[]): Partial<BodyMeasurementsImportResult> {
    return {
      success: false,
      errors,
      measurementsImported: 0,
    };
  }
}
