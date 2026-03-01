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
export { FoodSearchFacade } from './food-search-facade.service';
export type { FoodSearchResult, FoodSearchResultItem } from './food-search-facade.service';

// Adapters
export { OpenFoodFactsAdapter } from './adapters/openfoodfacts.adapter';

// Ports
export type {
  IExternalFoodSource,
  ExternalFoodItem,
  ExternalFoodSearchResult,
} from './ports/external-food-source.port';

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
