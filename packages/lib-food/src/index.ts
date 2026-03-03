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
export { FoodSeedService, ITALIAN_FOOD_CATEGORIES } from './food-seed.service';
export { FoodSeedService, ITALIAN_FOOD_CATEGORIES } from './food-seed.service';
export type {
  SeedCategoryConfig,
  SeedOptions,
  SeedProgress,
  SeedResult,
  CategorySeedResult,
} from './food-seed.service';
export type { FoodSearchResult, FoodSearchResultItem, FoodSourceType } from './food-search-facade.service';

// Adapters
export { OpenFoodFactsAdapter } from './adapters/openfoodfacts.adapter';
export { USDAFoodAdapter } from './adapters/usda.adapter';

// Cache
export { InMemoryFoodCache, CachedFoodSource } from './cache/food-cache.service';
export type { IFoodCacheRepository } from './cache/food-cache.service';

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
