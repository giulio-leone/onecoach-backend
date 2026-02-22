/**
 * API Route: PUT /api/admin/metadata/translations
 *
 * Updates translations for metadata entities
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';

export const dynamic = 'force-dynamic';
import {
  upsertExerciseTypeTranslation,
  upsertMuscleTranslation,
  upsertBodyPartTranslation,
  upsertEquipmentTranslation,
} from '@giulio-leone/lib-metadata';

interface TranslationUpdate {
  entityType: 'exerciseType' | 'muscle' | 'bodyPart' | 'equipment';
  entityId: string;
  locale: string;
  name: string;
  description?: string;
}

export async function PUT(_request: NextRequest) {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const body = (await _request.json()) as TranslationUpdate;
    const { entityType, entityId, locale, name, description } = body;

    // Validate required fields
    if (!entityType || !entityId || !locale || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate locale (prevent setting English as it's the default)
    // English names are managed through the main entity tables, not translations
    // This ensures the entity name always matches the English translation
    if (locale === 'en') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cannot modify English translations through this endpoint. English names are managed in the main entity tables.',
        },
        { status: 400 }
      );
    }

    // Update translation based on entity type
    let result;
    switch (entityType) {
      case 'exerciseType':
        result = await upsertExerciseTypeTranslation(entityId, locale, name, description);
        break;
      case 'muscle':
        result = await upsertMuscleTranslation(entityId, locale, name, description);
        break;
      case 'bodyPart':
        result = await upsertBodyPartTranslation(entityId, locale, name, description);
        break;
      case 'equipment':
        result = await upsertEquipmentTranslation(entityId, locale, name, description);
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid entity type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (_error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update translation',
      },
      { status: 500 }
    );
  }
}
