import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { AIModelService } from '@giulio-leone/lib-ai';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const models = await AIModelService.getAvailableModels();
    return NextResponse.json({
      success: true,
      models,
    });
  } catch (error: unknown) {
    logError('Error fetching AI models', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
