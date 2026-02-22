import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AIProvider } from '@prisma/client';

import { requireAuth } from '@giulio-leone/lib-core';
import { isAdminRole } from '@giulio-leone/lib-core/auth/roles';
import { ConversationService } from '@giulio-leone/lib-chat-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

const conversationUpdateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  metadata: z.unknown().optional(),
  providerOverride: z.nativeEnum(AIProvider).optional(),
  modelOverride: z.string().trim().min(1).max(128).optional(),
});

type RouteParams = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function GET(req: NextRequest, { params }: RouteParams): Promise<Response> {
  const { conversationId } = await params;
  const userOrError: any = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const conversation = await ConversationService.getById(userOrError.id, conversationId);

    if (!conversation) {
      return NextResponse.json({ error: 'Conversazione non trovata' }, { status: 404 });
    }

    const url = new URL(req.url);
    const includeMessages = url.searchParams.get('includeMessages') === 'true';
    const parsedLimit = Number(url.searchParams.get('messagesLimit') ?? '100');
    const messagesLimit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 500)
      : 100;

    if (!includeMessages) {
      return NextResponse.json({ success: true, conversation });
    }

    const messages = await ConversationService.getMessages({
      conversationId: conversation.id,
      userId: userOrError.id,
      limit: messagesLimit,
      order: 'asc',
    });

    return NextResponse.json({ success: true, conversation: { ...conversation, messages } });
  } catch (error: unknown) {
    logError('Failed to load conversation', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams): Promise<Response> {
  const { conversationId } = await params;
  const userOrError: any = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const json = await req.json();
    const parsed = conversationUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload non valido', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const canOverrideProvider = isAdminRole(userOrError.role);

    const updated = await ConversationService.update(userOrError.id, conversationId, {
      title: parsed.data.title,
      metadata: parsed.data.metadata ?? null,
      providerOverride: canOverrideProvider ? (parsed.data.providerOverride ?? null) : undefined,
      modelOverride: canOverrideProvider ? (parsed.data.modelOverride ?? null) : undefined,
    });

    return NextResponse.json({ success: true, conversation: updated });
  } catch (error: unknown) {
    logError('Failed to update conversation', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams): Promise<Response> {
  const { conversationId } = await params;
  const userOrError: any = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const deleted = await ConversationService.delete(userOrError.id, conversationId);

    if (!deleted) {
      return NextResponse.json({ error: 'Conversazione non trovata' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logError('Failed to delete conversation', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
