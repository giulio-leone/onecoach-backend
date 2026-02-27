// Services
export { FoodService, foodService, foodImportSchema, DEFAULT_LOCALE } from './food.service';
export { FoodAdminService } from './food-admin.service';
export {
  FoodMatchingService,
  BM25_SIMILARITY_THRESHOLD,
  FUZZY_SIMILARITY_THRESHOLD,
  levenshteinDistance,
  levenshteinSimilarity,
} from './food-matching.service';
export { FoodVisionService } from './food-vision.service';

// Utilities
export { normalizeFoodName, calculateMacrosFromQuantity, updateVisionModelConfig } from './utils';

// Types
export type {
  MacrosPer100g,
  MainMacro,
  MainMacroType,
  FoodItem,
  CreateFoodInput,
  UpdateFoodInput,
  FoodListOptions,
  FoodSearchOptions,
  FoodsResponse,
  FullTextSearchOptions,
  FullTextSearchRow,
  FoodImportPayload,
  FoodImportOptions,
  FoodImportResult,
  MatchType,
  MatchResult,
  FindOrCreateResult,
  ExtractedFoodData,
  ExtractedDishItem,
  FindOrCreateMultipleResult,
  LabelExtractionResult,
  DishSegmentationItem,
  DishSegmentationResult,
  NormalizedImportRecord,
} from './types';
