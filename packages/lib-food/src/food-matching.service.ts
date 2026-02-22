/**
 * Food Matching Service
 *
 * Sistema di deduplicazione alimenti con 3 livelli:
 * 1. Match esatto (nome normalizzato, barcode)
 * 2. BM25 search (relevance-based)
 * 3. Fuzzy match (Levenshtein distance)
 */

import { FoodService, normalizeFoodName } from './food.service';
import type { FoodItem, FoodMatchResult, LabelExtractionResult } from '@giulio-leone/types';

const BM25_SIMILARITY_THRESHOLD = 0.3;
const FUZZY_SIMILARITY_THRESHOLD = 0.85;

/**
 * Calcola similarity tra due stringhe usando Levenshtein distance
 */
function levenshteinSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calcola Levenshtein distance tra due stringhe
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  const firstRow = matrix[0];
  if (!firstRow) {
    throw new Error('Matrix initialization error');
  }
  for (let j = 0; j <= str1.length; j++) {
    firstRow[j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      const prevRow = matrix[i - 1];
      const currRow = matrix[i];
      if (!prevRow || !currRow) {
        throw new Error('Matrix initialization error');
      }
      const prevCell = prevRow[j - 1];
      const leftCell = currRow[j - 1];
      const topCell = prevRow[j];

      if (prevCell === undefined || leftCell === undefined || topCell === undefined) {
        throw new Error('Matrix access error');
      }

      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        currRow[j] = prevCell;
      } else {
        currRow[j] = Math.min(
          prevCell + 1, // substitution
          leftCell + 1, // insertion
          topCell + 1 // deletion
        );
      }
    }
  }

  const finalRow = matrix[str2.length];
  if (!finalRow) {
    throw new Error('Matrix access error');
  }
  const result = finalRow[str1.length];
  if (result === undefined) {
    throw new Error('Matrix access error');
  }
  return result;
}

export class FoodMatchingService {
  /**
   * Trova o crea alimento usando sistema a 3 livelli
   */
  static async findOrCreateFood(
    extractedData: LabelExtractionResult
  ): Promise<{ foodItem: FoodItem; matchType: 'exact' | 'bm25' | 'fuzzy' | 'created' }> {
    // 1. Match esatto
    const exactMatch = await this.matchExact(extractedData);
    if (exactMatch.matched && exactMatch.foodItem) {
      return { foodItem: exactMatch.foodItem, matchType: 'exact' };
    }

    // 2. BM25 search
    const bm25Match = await this.matchBM25(extractedData);
    if (bm25Match.matched && bm25Match.foodItem) {
      return { foodItem: bm25Match.foodItem, matchType: 'bm25' };
    }

    // 3. Fuzzy match
    const fuzzyMatch = await this.matchFuzzy(extractedData);
    if (fuzzyMatch.matched && fuzzyMatch.foodItem) {
      return { foodItem: fuzzyMatch.foodItem, matchType: 'fuzzy' };
    }

    // 4. Crea nuovo alimento
    const macrosPer100g = extractedData.macrosPer100g ?? {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    };
    const newFood = await FoodService.createFood({
      name: extractedData.name,
      description: extractedData.name,
      macrosPer100g,
      servingSize: extractedData.servingSize ?? 0,
      barcode: extractedData.barcode,
      metadata: {
        brand: extractedData.brand,
        ...extractedData.metadata,
      },
    });

    return { foodItem: newFood, matchType: 'created' };
  }

  /**
   * Match esatto: nome normalizzato o barcode
   */
  private static async matchExact(data: LabelExtractionResult): Promise<FoodMatchResult> {
    const nameNormalized = normalizeFoodName(data.name);

    // Match per barcode se disponibile
    if (data.barcode) {
      const foods = await FoodService.searchFoods(data.barcode, { limit: 1 });
      const firstFood = foods[0];
      if (firstFood && firstFood.barcode === data.barcode) {
        return {
          matched: true,
          foodItem: firstFood,
          matchType: 'exact',
          confidence: 1.0,
        };
      }
    }

    // Match per nome normalizzato esatto
    const match = await FoodService.getFoodByNameNormalized(nameNormalized);

    if (match) {
      return {
        matched: true,
        foodItem: match,
        matchType: 'exact',
        confidence: 1.0,
      };
    }

    return { matched: false };
  }

  /**
   * Match BM25: relevance-based search
   */
  private static async matchBM25(data: LabelExtractionResult): Promise<FoodMatchResult> {
    const results = await FoodService.searchFoods(data.name, { limit: 5 });

    if (results.length === 0) {
      return { matched: false };
    }

    // Prendi il primo risultato (già ordinato per relevance)
    const topResult = results[0];
    if (!topResult) {
      return { matched: false };
    }
    const nameNormalized = normalizeFoodName(data.name);
    const resultNormalized = normalizeFoodName(topResult.name);

    // Verifica similarity per evitare falsi positivi
    const similarity = levenshteinSimilarity(nameNormalized, resultNormalized);

    if (similarity >= BM25_SIMILARITY_THRESHOLD) {
      return {
        matched: true,
        foodItem: topResult,
        matchType: 'bm25',
        confidence: similarity,
      };
    }

    return { matched: false };
  }

  /**
   * Match fuzzy: Levenshtein distance
   */
  private static async matchFuzzy(data: LabelExtractionResult): Promise<FoodMatchResult> {
    // Cerca con termine più generico
    const searchTerm = normalizeFoodName(data.name).split(' ').slice(0, 2).join(' ');
    const results = await FoodService.searchFoods(searchTerm, { limit: 10 });

    if (results.length === 0) {
      return { matched: false };
    }

    const nameNormalized = normalizeFoodName(data.name);

    // Trova match con similarity più alta
    let bestMatch: FoodItem | null = null;
    let bestSimilarity = 0;

    for (const food of results) {
      const foodNormalized = normalizeFoodName(food.name);
      const similarity = levenshteinSimilarity(nameNormalized, foodNormalized);

      if (similarity > bestSimilarity && similarity >= FUZZY_SIMILARITY_THRESHOLD) {
        bestSimilarity = similarity;
        bestMatch = food;
      }
    }

    if (bestMatch && bestSimilarity >= FUZZY_SIMILARITY_THRESHOLD) {
      return {
        matched: true,
        foodItem: bestMatch,
        matchType: 'fuzzy',
        confidence: bestSimilarity,
      };
    }

    return { matched: false };
  }

  /**
   * Match multipli alimenti (per segmentazione piatto)
   * Usa solo nome per matching, i macros verranno presi dal foodItem trovato
   */
  static async findOrCreateMultipleFoods(
    extractedItems: Array<{ name: string; quantity: number }>
  ): Promise<
    Array<{
      foodItem: FoodItem;
      matchType: 'exact' | 'bm25' | 'fuzzy' | 'created';
      quantity: number;
    }>
  > {
    const results = await Promise.all(
      extractedItems.map(async (item) => {
        // Prova a recuperare un alimento simile per ottenere macros reali
        const candidates = await FoodService.searchFoods(item.name, { limit: 1 });
        const seedMacros = candidates[0]?.macrosPer100g;

        const match = await this.findOrCreateFood({
          name: item.name,
          macrosPer100g: seedMacros || {
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
          },
        });

        return {
          foodItem: match.foodItem,
          matchType: match.matchType,
          quantity: item.quantity,
        };
      })
    );

    return results;
  }
}
