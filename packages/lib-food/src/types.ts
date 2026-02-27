import type { z } from 'zod';
import type { createFoodSchema } from '@giulio-leone/schemas';

// ── Macros ──────────────────────────────────────────────────────────
export interface MacrosPer100g {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export type MainMacroType = 'PROTEIN' | 'CARBS' | 'FATS' | 'BALANCED';

export interface MainMacro {
  type: MainMacroType;
  percentage: number;
}

// ── Food Item (domain model returned by services) ───────────────────
export interface FoodItem {
  id: string;
  name: string;
  nameNormalized: string;
  barcode?: string;
  macrosPer100g: MacrosPer100g;
  servingSize: number;
  unit: string;
  imageUrl?: string;
  brandId?: string;
  mainMacro: MainMacro;
  proteinPct: number;
  carbPct: number;
  fatPct: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ── Create / Update payloads ────────────────────────────────────────
export type CreateFoodInput = z.infer<typeof createFoodSchema>;

export interface UpdateFoodInput {
  name?: string;
  description?: string;
  macrosPer100g?: MacrosPer100g;
  servingSize?: number;
  unit?: string;
  barcode?: string;
  metadata?: Record<string, unknown>;
  imageUrl?: string;
  brandId?: string;
  brandName?: string;
  categoryIds?: string[];
}

// ── List / search options ───────────────────────────────────────────
export interface FoodListOptions {
  limit?: number;
  page?: number;
  pageSize?: number;
  locale?: string;
}

export interface FoodSearchOptions {
  locale?: string;
  limit?: number;
}

export interface FoodsResponse {
  data: FoodItem[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Full-text search internals ──────────────────────────────────────
export interface FullTextSearchOptions {
  locale: string;
  limit: number;
}

export interface FullTextSearchRow {
  id: string;
  has_locale: boolean;
  rank: number;
}

// ── Import ──────────────────────────────────────────────────────────
export interface FoodImportPayload {
  name: string;
  description: string;
  macrosPer100g: MacrosPer100g;
  servingSize: number;
  unit?: string;
  brandName?: string;
  categoryIds?: string[];
  imageUrl?: string;
  barcode?: string;
}

export interface FoodImportOptions {
  userId?: string;
  mergeExisting?: boolean;
  onProgress?: (current: number, total: number) => void;
}

export interface FoodImportResult {
  created: number;
  updated: number;
  skipped: number;
  createdItems: { id: string; name: string }[];
  updatedItems: { id: string; name: string }[];
  skippedNames: string[];
  errors: { name: string; reason: string }[];
}

// ── Matching ────────────────────────────────────────────────────────
export type MatchType = 'exact' | 'bm25' | 'fuzzy' | 'created';

export interface MatchResult {
  matched: boolean;
  foodItem?: FoodItem;
  matchType?: MatchType;
  confidence?: number;
}

export interface FindOrCreateResult {
  foodItem: FoodItem;
  matchType: MatchType;
}

export interface ExtractedFoodData {
  name: string;
  macrosPer100g?: MacrosPer100g;
  servingSize?: number;
  barcode?: string;
  brand?: string;
  metadata?: Record<string, unknown>;
}

export interface ExtractedDishItem {
  name: string;
  quantity: number;
}

export interface FindOrCreateMultipleResult {
  foodItem: FoodItem;
  matchType: MatchType;
  quantity: number;
}

// ── Vision ──────────────────────────────────────────────────────────
export interface LabelExtractionResult {
  name: string;
  macrosPer100g: MacrosPer100g;
  servingSize?: number;
  barcode?: string;
  brand?: string;
  metadata?: Record<string, unknown>;
}

export interface DishSegmentationItem {
  name: string;
  quantity: number;
  confidence: number;
}

export interface DishSegmentationResult {
  items: DishSegmentationItem[];
  totalMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

// ── Internal helpers ────────────────────────────────────────────────
export interface NormalizedImportRecord {
  name: string;
  nameNormalized: string;
  createInput: CreateFoodInput;
  updateInput: UpdateFoodInput;
  categoryIds: string[];
}
