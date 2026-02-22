/**
 * Body Measurements Vision Service
 *
 * AI-powered parsing of body measurements from images, PDFs, documents, and spreadsheets.
 * Uses shared lib-import-core for AI parsing, credit handling, and retry logic.
 *
 * @module lib-body-measurements/services/body-measurements-vision
 */

import { parseWithVisionAI } from '@giulio-leone/lib-import-core';
import {
  ImportedBodyMeasurementsSchema,
  type ImportedBodyMeasurements,
} from '../schemas/imported-body-measurements.schema';

// ==================== PROMPTS ====================

const IMAGE_EXTRACTION_PROMPT = `Analyze this image containing body measurements (scales app screenshots, medical reports, handwritten notes) and extract all data.

OUTPUT FORMAT (JSON):
{
  "sourceName": "Image Upload",
  "measurements": [
    {
      "date": "YYYY-MM-DD",
      "weight": 75.5,
      "bodyFat": 15.2,
      "muscleMass": 60.1,
      "visceralFat": 3,
      "waterPercentage": 60.5,
      "chest": 100,
      "waist": 80,
      "hips": 95,
      ...
    }
  ]
}

RULES:
1. Extract date from the image if present, otherwise omit (will default to today).
2. Look for keywords like "Peso", "Weight", "Grasso", "Fat", "Muscolo", "Muscle", "Vita", "Waist".
3. Convert all units to Metric (kg, cm, %). If lb/in found, convert: 1lb = 0.453592kg, 1in = 2.54cm.
4. Extract circumferences if present.
5. If multiple dates are visible (history view), extract ALL entries in the array.
6. Return only valid JSON.`;

const PDF_EXTRACTION_PROMPT = `Analyze this PDF document (Inbody report, DEXA scan, medical checkup, or nutritionist report) and extract body composition and measurement data.

OUTPUT FORMAT (JSON):
{
  "sourceName": "PDF Report",
  "measurements": [
    {
      "date": "YYYY-MM-DD",
      "weight": 80.0,
      "bodyFat": 18.5,
      ...
    }
  ]
}

RULES:
1. Identify the date of measurement.
2. Extract all available metrics: Weight, Body Fat, Muscle Mass, BMR, Metabolic Age, Visceral Fat.
3. Extract all available circumferences.
4. If the document contains history/trends, extract all historical data points as separate entries.
5. Notes: summarize any physician/nutritionist comments found.`;

const SPREADSHEET_EXTRACTION_PROMPT = `You are a data analyst. Parse this spreadsheet data containing body measurements tracking.

Possible columns: Date, Weight, BMI, Body Fat %, Muscle Mass, Waist, Hips, Chest, Arms, etc.

OUTPUT FORMAT (JSON):
{
  "sourceName": "Spreadsheet Import",
  "measurements": [
    {
      "date": "YYYY-MM-DD",
      "weight": 70.5,
      "waist": 78,
      ...
    }
  ]
}

RULES:
1. Map columns intelligently (e.g., "Peso kg" -> weight, "BF%" -> bodyFat).
2. Convert dates to ISO (YYYY-MM-DD).
3. If multiple rows exist, map each to a measurement entry.
4. Ignore empty rows or calculations/averages rows.
5. Ensure numbers are floats, not strings.`;

const DOCUMENT_EXTRACTION_PROMPT = `Analyze this text document containing body measurements.

OUTPUT FORMAT (JSON):
{
  "sourceName": "Document Import",
  "measurements": [
    { "date": "...", "weight": ... }
  ]
}

Extract all declared metrics and dates.`;

// ==================== SERVICE CLASS ====================

export class BodyMeasurementsVisionService {
  /**
   * Parse body measurements from image
   */
  static async parseImage(
    imageBase64: string,
    mimeType: string,
    userId: string
  ): Promise<ImportedBodyMeasurements> {
    return parseWithVisionAI({
      contentBase64: imageBase64,
      mimeType,
      prompt: IMAGE_EXTRACTION_PROMPT,
      schema: ImportedBodyMeasurementsSchema,
      userId,
      fileType: 'image',
    });
  }

  /**
   * Parse body measurements from PDF
   */
  static async parsePDF(
    pdfBase64: string,
    userId: string
  ): Promise<ImportedBodyMeasurements> {
    return parseWithVisionAI({
      contentBase64: pdfBase64,
      mimeType: 'application/pdf',
      prompt: PDF_EXTRACTION_PROMPT,
      schema: ImportedBodyMeasurementsSchema,
      userId,
      fileType: 'pdf',
    });
  }

  /**
   * Parse body measurements from document (DOCX, DOC, ODT)
   */
  static async parseDocument(
    documentBase64: string,
    mimeType: string,
    userId: string
  ): Promise<ImportedBodyMeasurements> {
    return parseWithVisionAI({
      contentBase64: documentBase64,
      mimeType,
      prompt: DOCUMENT_EXTRACTION_PROMPT,
      schema: ImportedBodyMeasurementsSchema,
      userId,
      fileType: 'document',
    });
  }

  /**
   * Parse body measurements from spreadsheet (CSV, XLSX)
   */
  static async parseSpreadsheet(
    contentBase64: string,
    mimeType: string,
    userId: string
  ): Promise<ImportedBodyMeasurements> {
    return parseWithVisionAI({
      contentBase64,
      mimeType,
      prompt: SPREADSHEET_EXTRACTION_PROMPT,
      schema: ImportedBodyMeasurementsSchema,
      userId,
      fileType: 'spreadsheet',
    });
  }
}
