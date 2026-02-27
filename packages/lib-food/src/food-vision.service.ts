import { z } from 'zod';
import { parseWithVisionAI } from '@giulio-leone/lib-shared/import-core';

import type { LabelExtractionResult, DishSegmentationResult } from './types';

// ── Zod schemas for vision AI parsing ───────────────────────────────
const labelExtractionSchema = z.object({
  name: z.string(),
  macrosPer100g: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fats: z.number(),
    fiber: z.number().optional(),
    sugar: z.number().optional(),
    sodium: z.number().optional(),
  }),
  servingSize: z.number().optional(),
  barcode: z.string().optional(),
  brand: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const dishSegmentationSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      confidence: z.number().min(0).max(1),
    }),
  ),
  totalMacros: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fats: z.number(),
  }),
});

// ── Prompts ─────────────────────────────────────────────────────────
const LABEL_EXTRACTION_PROMPT = `Analizza questa etichetta alimentare ed estrai tutti i dati nutrizionali visibili.

OUTPUT FORMAT (JSON):
{
  "name": "Nome prodotto",
  "macrosPer100g": {
    "calories": numero,
    "protein": numero,
    "carbs": numero,
    "fats": numero,
    "fiber": numero (opzionale),
    "sugar": numero (opzionale),
    "sodium": numero (opzionale)
  },
  "servingSize": numero grammi (opzionale),
  "barcode": "codice a barre se visibile" (opzionale),
  "brand": "marca" (opzionale)
}

REGOLE:
1. Estrai tutti i valori nutrizionali per 100g
2. Se i valori sono per porzione, calcola per 100g
3. Cerca parole chiave: Calorie, Proteine, Carboidrati, Grassi, Fibre, Zuccheri, Sodio
4. Converti unità se necessario (kcal = calorie)

Restituisci SOLO JSON valido.`;

const DISH_SEGMENTATION_PROMPT = `Analizza questa foto di piatto e identifica tutti gli alimenti visibili con le relative quantità stimate in grammi.

OUTPUT FORMAT (JSON):
{
  "items": [
    {
      "name": "nome alimento",
      "quantity": grammi stimati,
      "confidence": 0.0-1.0 (certezza dell'identificazione)
    }
  ],
  "totalMacros": {
    "calories": totale stimato,
    "protein": grammi,
    "carbs": grammi,
    "fats": grammi
  }
}

REGOLE:
1. Identifica ogni componente visibile del piatto
2. Stima le quantità in grammi basandoti sulle proporzioni
3. Calcola i macronutrienti totali stimati
4. Indica la confidenza per ogni identificazione

Restituisci SOLO JSON valido.`;

export class FoodVisionService {
  /**
   * Extract nutritional data from food label image
   */
  static async extractLabelData(
    imageBase64: string,
    userId: string,
  ): Promise<LabelExtractionResult> {
    const result = await parseWithVisionAI({
      contentBase64: imageBase64,
      mimeType: 'image/jpeg',
      prompt: LABEL_EXTRACTION_PROMPT,
      schema: labelExtractionSchema,
      userId,
      fileType: 'image',
      creditCost: 5,
    });
    return result;
  }

  /**
   * Segment dish and identify food items with quantities
   */
  static async segmentDish(
    imageBase64: string,
    userId: string,
  ): Promise<DishSegmentationResult> {
    const result = await parseWithVisionAI({
      contentBase64: imageBase64,
      mimeType: 'image/jpeg',
      prompt: DISH_SEGMENTATION_PROMPT,
      schema: dishSegmentationSchema,
      userId,
      fileType: 'image',
      creditCost: 8,
    });

    const filteredItems = result.items.filter(
      (item: { confidence: number }) => item.confidence >= 0.5,
    );

    return {
      items: filteredItems,
      totalMacros: result.totalMacros,
    };
  }
}
