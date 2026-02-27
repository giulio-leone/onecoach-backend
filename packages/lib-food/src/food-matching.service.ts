import { FoodService } from './food.service';
import { normalizeFoodName } from './utils';
import type {
  FoodItem,
  MacrosPer100g,
  MatchResult,
  FindOrCreateResult,
  FindOrCreateMultipleResult,
  ExtractedFoodData,
  ExtractedDishItem,
} from './types';

export const BM25_SIMILARITY_THRESHOLD = 0.3;
export const FUZZY_SIMILARITY_THRESHOLD = 0.85;

/**
 * Levenshtein similarity (0..1)
 */
export function levenshteinSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1;
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Levenshtein edit distance
 */
export function levenshteinDistance(str1: string, str2: string): number {
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
          topCell + 1, // deletion
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
  static async findOrCreateFood(extractedData: ExtractedFoodData): Promise<FindOrCreateResult> {
    // Tier 1: exact match
    const exactMatch = await this.matchExact(extractedData);
    if (exactMatch.matched && exactMatch.foodItem) {
      return { foodItem: exactMatch.foodItem, matchType: 'exact' };
    }

    // Tier 2: BM25 relevance
    const bm25Match = await this.matchBM25(extractedData);
    if (bm25Match.matched && bm25Match.foodItem) {
      return { foodItem: bm25Match.foodItem, matchType: 'bm25' };
    }

    // Tier 3: fuzzy Levenshtein
    const fuzzyMatch = await this.matchFuzzy(extractedData);
    if (fuzzyMatch.matched && fuzzyMatch.foodItem) {
      return { foodItem: fuzzyMatch.foodItem, matchType: 'fuzzy' };
    }

    // No match: create new food
    const macrosPer100g: MacrosPer100g = extractedData.macrosPer100g ?? {
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
      unit: 'g',
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
  static async matchExact(data: ExtractedFoodData): Promise<MatchResult> {
    const nameNormalized = normalizeFoodName(data.name);

    if (data.barcode) {
      const foods = await FoodService.searchFoods(data.barcode, { limit: 1 });
      const firstFood = foods[0];
      if (firstFood && firstFood.barcode === data.barcode) {
        return {
          matched: true,
          foodItem: firstFood,
          matchType: 'exact',
          confidence: 1,
        };
      }
    }

    const match = await FoodService.getFoodByNameNormalized(nameNormalized);
    if (match) {
      return {
        matched: true,
        foodItem: match,
        matchType: 'exact',
        confidence: 1,
      };
    }

    return { matched: false };
  }

  /**
   * Match BM25: relevance-based search
   */
  static async matchBM25(data: ExtractedFoodData): Promise<MatchResult> {
    const results = await FoodService.searchFoods(data.name, { limit: 5 });
    if (results.length === 0) {
      return { matched: false };
    }

    const topResult = results[0];
    if (!topResult) {
      return { matched: false };
    }

    const nameNormalized = normalizeFoodName(data.name);
    const resultNormalized = normalizeFoodName(topResult.name);
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
  static async matchFuzzy(data: ExtractedFoodData): Promise<MatchResult> {
    const searchTerm = normalizeFoodName(data.name).split(' ').slice(0, 2).join(' ');
    const results = await FoodService.searchFoods(searchTerm, { limit: 10 });
    if (results.length === 0) {
      return { matched: false };
    }

    const nameNormalized = normalizeFoodName(data.name);
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
   */
  static async findOrCreateMultipleFoods(
    extractedItems: ExtractedDishItem[],
  ): Promise<FindOrCreateMultipleResult[]> {
    const results = await Promise.all(
      extractedItems.map(async (item) => {
        const candidates = await FoodService.searchFoods(item.name, { limit: 1 });
        const seedMacros: MacrosPer100g = candidates[0]?.macrosPer100g || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
        };

        const match = await this.findOrCreateFood({
          name: item.name,
          macrosPer100g: seedMacros,
        });

        return {
          foodItem: match.foodItem,
          matchType: match.matchType,
          quantity: item.quantity,
        };
      }),
    );

    return results;
  }
}
