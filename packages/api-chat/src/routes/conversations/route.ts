import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AIProvider, ConversationRole } from '@prisma/client';

import { requireAuth } from '@giulio-leone/lib-core';
import { isAdminRole } from '@giulio-leone/lib-core/auth/roles';
import { ConversationService } from '@giulio-leone/lib-chat-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

const isoDateStringSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Invalid datetime format' });

const roleSchema = z.enum(['user', 'assistant', 'system', 'tool']);

const conversationCreateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  metadata: z.unknown().optional(),
  providerOverride: z.nativeEnum(AIProvider).optional(),
  modelOverride: z.string().trim().min(1).max(128).optional(),
  initialMessages: z
    .array(
      z.object({
        role: roleSchema,
        content: z.string().min(1).max(8000),
        metadata: z.unknown().optional(),
        sequence: z.number().int().min(0).max(1_000_000).optional(),
        occurredAt: isoDateStringSchema.optional(),
      })
    )
    .max(200)
    .optional(),
});

export async function GET(req: NextRequest) {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const url = new URL(req.url);
    const includeMessages = url.searchParams.get('includeMessages') === 'true';
    const parsedLimit = Number(url.searchParams.get('messagesLimit') ?? '50');
    const messagesLimit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 500)
      : 50;

    const conversations = await ConversationService.list(userOrError.id);

    if (!includeMessages) {
      return NextResponse.json({ success: true, conversations });
    }

    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conversation) => {
        const messages = await ConversationService.getMessages({
          conversationId: conversation.id,
          userId: userOrError.id,
          limit: messagesLimit,
          order: 'asc',
        });

        return {
          ...conversation,
          messages,
        };
      })
    );

    return NextResponse.json({ success: true, conversations: conversationsWithMessages });
  } catch (error: unknown) {
    logError('Failed to list conversations', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function POST(req: NextRequest) {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const json = await req.json();
    const parsed = conversationCreateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Payload non valido',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const canOverrideProvider = isAdminRole(userOrError.role);

    const sanitizedInitialMessages = parsed.data.initialMessages?.map((message) => ({
      role: toConversationRole(message.role),
      content: message.content.trim(),
      metadata: message.metadata ?? null,
      sequence: message.sequence,
      occurredAt: message.occurredAt ? new Date(message.occurredAt) : undefined,
    }));

    const { conversation, messages } = await ConversationService.create({
      userId: userOrError.id,
      title: parsed.data.title,
      metadata: parsed.data.metadata ?? null,
      providerOverride: canOverrideProvider ? (parsed.data.providerOverride ?? null) : null,
      modelOverride: canOverrideProvider ? (parsed.data.modelOverride ?? null) : null,
      initialMessages: sanitizedInitialMessages,
    });

    return NextResponse.json({ success: true, conversation, messages }, { status: 201 });
  } catch (error: unknown) {
    logError('Failed to create conversation', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

function toConversationRole(role: z.infer<typeof roleSchema>): ConversationRole {
  switch (role) {
    case 'assistant':
      return ConversationRole.ASSISTANT;
    case 'system':
      return ConversationRole.SYSTEM;
    case 'tool':
      return ConversationRole.TOOL;
    default:
      return ConversationRole.USER;
  }
}
