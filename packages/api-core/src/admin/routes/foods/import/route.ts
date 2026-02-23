import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { FoodMatchingService } from '@giulio-leone/lib-food';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

type ImportItem = {
  name: string;
  macrosPer100g: { calories: number; protein: number; carbs: number; fats: number; fiber?: number };
  servingSize?: number;
  unit?: string;
  barcode?: string;
  metadata?: Record<string, unknown>;
  imageUrl?: string;
};

function parseCsv(text: string): ImportItem[] {
  const lines = text.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const firstLine = lines[0];
  if (!firstLine) return [];
  const headers = firstLine.split(',').map((h: string) => h.trim());
  const get = (row: string[], key: string) => row[headers.indexOf(key)]?.trim() ?? '';
  const items: ImportItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const row = line.split(',');
    const name = get(row, 'name') || '';
    if (!name) continue;
    const calories = Number(get(row, 'calories') || 0);
    const protein = Number(get(row, 'protein') || 0);
    const carbs = Number(get(row, 'carbs') || 0);
    const fats = Number(get(row, 'fats') || 0);
    const fiber = get(row, 'fiber');
    const servingSize = get(row, 'servingSize');
    const unit = get(row, 'unit') || 'g';
    const barcode = get(row, 'barcode');
    const brand = get(row, 'brand');
    const category = get(row, 'category');
    items.push({
      name,
      macrosPer100g: { calories, protein, carbs, fats, ...(fiber ? { fiber: Number(fiber) } : {}) },
      servingSize: servingSize ? Number(servingSize) : undefined,
      unit,
      barcode: barcode || undefined,
      metadata: { ...(brand ? { brand } : {}), ...(category ? { category } : {}) },
    });
  }
  return items;
}

export async function POST(_req: NextRequest) {
  const userOrError = await requireAdmin();
  if (userOrError instanceof NextResponse) return userOrError;

  try {
    const contentType = _req.headers.get('content-type') || '';
    let items: ImportItem[] = [];

    if (contentType.includes('application/json')) {
      const body = await _req.json();
      items = Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : [];
    } else if (contentType.includes('text/csv')) {
      const text = await _req.text();
      items = parseCsv(text);
    } else {
      return NextResponse.json(
        { error: 'Formato non supportato (usa JSON o CSV)' },
        { status: 400 }
      );
    }

    const results: unknown[] = [];
    for (const item of items) {
      // Use findOrCreateFood method
      const matchResult = await FoodMatchingService.findOrCreateFood({
        name: item.name,
        macrosPer100g: item.macrosPer100g,
        servingSize: item.servingSize,
        barcode: item.barcode,
        metadata: item.metadata,
      });
      results.push({
        foodItem: matchResult.foodItem,
        matchType: matchResult.matchType,
      });
    }

    return NextResponse.json({ imported: results.length, results });
  } catch (error: unknown) {
    logError('Errore import alimenti', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
