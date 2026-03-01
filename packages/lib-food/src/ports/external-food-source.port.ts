import type { MacrosPer100g } from '../types';

export interface ExternalFoodItem {
  externalId: string;
  name: string;
  barcode: string | null;
  macrosPer100g: MacrosPer100g;
  servingSize: number;
  unit: string;
  imageUrl: string | null;
  brand: string | null;
  source: string;
  locale: string;
  rawData?: Record<string, unknown>;
}

export interface ExternalFoodSearchResult {
  items: ExternalFoodItem[];
  total: number;
  source: string;
}

export interface IExternalFoodSource {
  search(
    query: string,
    options: { locale?: string; limit?: number },
  ): Promise<ExternalFoodSearchResult>;
  getByBarcode(barcode: string): Promise<ExternalFoodItem | null>;
}
