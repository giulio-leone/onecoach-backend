/**
 * Admin AI Food Update API
 *
 * Updates food items using AI with customizable prompts.
 * Uses the same CatalogProviderService logic to avoid duplicates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { FoodService } from '@giulio-leone/lib-food';
import { createAIProvider } from '@giulio-leone/lib-ai';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';
import { createFoodSchema } from '@giulio-leone/schemas/food.schema';
import type { Macros } from '@giulio-leone/types';
import { AIProviderConfigService } from '@giulio-leone/lib-ai';
import { TOKEN_LIMITS } from '@giulio-leone/constants';

import { logger } from '@giulio-leone/lib-core';
export const dynamic = 'force-dynamic';

// Helper for structural compatibility - macros are already per 100g
function ensureMacrosArePer100g(macros: Macros, _servingSize: number, _unit: string): Macros {
  return macros;
}

type RouteParams = Promise<{ id: string }>;

const DEFAULT_UPDATE_PROMPT = `You are a nutrition expert. Update a food item based on the user's description and current food data.

CURRENT FOOD DATA:
{currentFoodData}

REQUIRED OUTPUT FORMAT (JSON only):
{
  "name": "Updated food name (include preparation state: raw, cooked, etc.)",
  "description": "Updated detailed description (min 10, max 2000 characters) - REQUIRED",
  "macrosPer100g": {
    "calories": <number>, // REQUIRED - kcal per 100g RAW weight
    "protein": <number>,  // REQUIRED - grams per 100g RAW weight
    "carbs": <number>,    // REQUIRED - grams per 100g RAW weight
    "fats": <number>      // REQUIRED - grams per 100g RAW weight
  },
  "servingSize": <number>, // REQUIRED - Standard serving in grams
  "unit": "g",             // REQUIRED - Default "g" for grams
  "brandName": "<brand name or 'Generic'>", // Optional - used to find/create brand
  "imageUrl": "<image URL or null>", // Optional - leave null if no image available
  "barcode": "<optional barcode>" // Optional - EAN/UPC code for packaged foods
}

REQUIRED FIELDS (MUST BE PRESENT - NO EXCEPTIONS):
1. name: String (2-255 characters) - Food name with preparation state
2. description: String (min 10, max 2000 characters) - Detailed food description - REQUIRED, cannot be null or empty
3. macrosPer100g: Object with calories, protein, carbs, fats (all numbers)
4. servingSize: Number (1-10000) - Standard serving size in grams
5. unit: String (default "g") - Unit of measurement

OPTIONAL FIELDS (only barcode is truly optional):
- brandName: String - Brand name (will default to "Generic" if not provided)
- imageUrl: String or null - Product image URL (leave null if no image available, do NOT use placeholder URLs)
- barcode: String or null - EAN/UPC barcode for packaged foods (ONLY truly optional field - can be omitted or null)

CRITICAL RULES:
- ALL macros MUST be per 100g RAW/UNCOOKED weight (NOT cooked weight)
- Use realistic nutritional values from reliable sources
- Include preparation state in name (e.g., "Chicken breast, raw", "Pasta, cooked")
- servingSize guidelines:
  * 100g for most solid foods
  * 30g for cheese, nuts, seeds
  * 200-250g for liquids (milk, juice, etc.)
- description is MANDATORY and must be detailed (min 10 chars, max 2000 chars) and include:
  * Preparation state (raw, cooked, etc.)
  * Key nutritional characteristics
  * Common uses or context
  * NEVER return null or empty string for description - it is REQUIRED
- Return ONLY valid JSON, no markdown code blocks, no explanations
- The system will automatically calculate:
  * mainMacro (predominant macronutrient)
  * proteinPct, carbPct, fatPct (percentage of calories from each macro)`;

export async function PUT(request: NextRequest, context: { params: RouteParams }) {
  const userOrError = await requireAdmin();
  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { description, customPrompt } = body;

    // Get current food item
    const currentFood = await FoodService.getFoodById(id);
    if (!currentFood) {
      return NextResponse.json({ error: 'Food item not found' }, { status: 404 });
    }

    if (!description || typeof description !== 'string' || description.trim().length < 3) {
      return NextResponse.json(
        { error: 'Description is required and must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Prepare current food data for AI context
    const currentFoodData = {
      name: currentFood.name,
      description: currentFood.metadata?.description || 'No description',
      macrosPer100g: currentFood.macrosPer100g,
      servingSize: currentFood.servingSize,
      unit: currentFood.unit,
      brand: currentFood.metadata?.brand || 'Generic',
      imageUrl: currentFood.imageUrl || '',
    };

    // Use custom prompt if provided, otherwise use default
    const prompt = customPrompt?.trim() || DEFAULT_UPDATE_PROMPT;
    const fullPrompt = prompt
      .replace('{currentFoodData}', JSON.stringify(currentFoodData, null, 2))
      .concat(
        `\n\nUser request: ${description}\n\nReturn ONLY the JSON object, no markdown, no code blocks, no explanations.`
      );

    // Get model configuration: solo default admin OpenRouter
    let modelId: string | null = await AIProviderConfigService.getDefaultModel('openrouter');

    if (!modelId) {
      return NextResponse.json(
        {
          error:
            'Nessun modello configurato in admin. Configura un modello predefinito in /admin/ai-settings.',
        },
        { status: 500 }
      );
    }

    // Normalize model for provider - supports ANY OpenRouter model
    if (modelId.startsWith('openrouter-')) {
      const modelName = modelId.replace('openrouter-', '');
      modelId = `openrouter/${modelName}`;
    }

    // Create AI provider
    const aiProvider = createAIProvider();

    // Call AI to generate updated food data
    const response = await aiProvider.generateText({
      model: modelId,
      prompt: fullPrompt,
      temperature: 0.3, // Lower temperature for consistent results
      maxTokens: TOKEN_LIMITS.DEFAULT_MAX_TOKENS,
    });

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = response.text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    // Parse JSON
    let aiFoodData: {
      name: string;
      description: string;
      macrosPer100g: Macros;
      servingSize?: number;
      unit?: string;
      brandName?: string;
      imageUrl?: string;
      barcode?: string;
    };

    try {
      aiFoodData = JSON.parse(jsonText);
    } catch (parseError: unknown) {
      logger.error('[AI Food Update] JSON parse error', { error: parseError, response: jsonText });
      return NextResponse.json(
        { error: 'Invalid JSON response from AI', details: jsonText.substring(0, 200) },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!aiFoodData.name || !aiFoodData.macrosPer100g) {
      return NextResponse.json(
        { error: 'AI response missing required fields: name and macrosPer100g' },
        { status: 500 }
      );
    }

    // Ensure macros are per 100g
    const macrosPer100g = ensureMacrosArePer100g(aiFoodData.macrosPer100g, 100, 'g');

    // Validate with Zod schema
    const validation = createFoodSchema.safeParse({
      name: aiFoodData.name.trim(),
      macrosPer100g,
      servingSize: aiFoodData.servingSize || currentFood.servingSize || 100,
      unit: aiFoodData.unit || currentFood.unit || 'g',
      barcode: aiFoodData.barcode || currentFood.barcode,
      imageUrl: aiFoodData.imageUrl || currentFood.imageUrl,
      brandName: aiFoodData.brandName || currentFood.metadata?.brand || 'Generic',
      description:
        aiFoodData.description && aiFoodData.description !== null
          ? String(aiFoodData.description).trim()
          : `${aiFoodData.name} - nutritious food item`,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    // Check for duplicates before updating (if name changed)
    if (aiFoodData.name.trim() !== currentFood.name) {
      const searchResults = await FoodService.searchFoods(aiFoodData.name.trim(), { limit: 5 });
      if (searchResults.length > 0) {
        // Check if any result is similar enough (excluding current food)
        const similarFood = searchResults.find(
          (f: { id: string; name: string }) =>
            f.id !== id && f.name.toLowerCase() === aiFoodData.name.trim().toLowerCase()
        );
        if (similarFood) {
          return NextResponse.json(
            {
              error: 'A food with this name already exists',
              existingFood: {
                id: similarFood.id,
                name: similarFood.name || '',
              },
            },
            { status: 409 }
          );
        }
      }
    }

    // Update food item
    const updatedFood = await FoodService.updateFood(id, {
      name: aiFoodData.name.trim(),
      description:
        aiFoodData.description && aiFoodData.description !== null
          ? String(aiFoodData.description).trim()
          : `${aiFoodData.name} - nutritious food item`,
      macrosPer100g,
      servingSize: aiFoodData.servingSize || currentFood.servingSize || 100,
      unit: aiFoodData.unit || currentFood.unit || 'g',
      barcode: aiFoodData.barcode || currentFood.barcode || undefined,
      imageUrl: aiFoodData.imageUrl || currentFood.imageUrl || undefined,
      brandName: (aiFoodData.brandName || currentFood.metadata?.brand || 'Generic') as string,
    });

    return NextResponse.json({
      success: true,
      foodItem: updatedFood,
      message: `Food updated: ${updatedFood.name}`,
    });
  } catch (error: unknown) {
    logError('Error updating food with AI', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
