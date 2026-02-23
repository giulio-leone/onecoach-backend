/**
 * Chat API Route
 *
 * API route per chat con AI usando streaming con AI SDK 6
 * Integra intent detection e tools per generazione piani
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AI_REASONING_CONFIG } from '@giulio-leone/constants';
import { logger, logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';
import { requireAuth, userProfileService } from '@giulio-leone/lib-core';
import { getChatAgent, type ChatCallOptions } from '@giulio-leone/one-agent';

export const dynamic = 'force-dynamic';

const chatStreamRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().min(1),
    })
  ),
  tier: z.enum(['fast', 'balanced', 'quality']).optional().default('balanced'),
  provider: z.enum(['google', 'anthropic', 'openai', 'xai', 'openrouter']).optional(),
  model: z.string().trim().min(1).max(128).optional(),
  temperature: z.number().min(0).max(2).optional(),
  enableIntentDetection: z.boolean().optional().default(true),
  enableTools: z.boolean().optional().default(true),
  reasoning: z.boolean().optional().default(true),
  reasoningEffort: z
    .enum(['low', 'medium', 'high'])
    .optional()
    .default(AI_REASONING_CONFIG.DEFAULT_REASONING_EFFORT),
});

export async function POST(_req: Request): Promise<Response> {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const body = await _req.json();
    const input = chatStreamRequestSchema.parse(body);

    const isAdmin = userOrError.role === 'ADMIN';

    if (!isAdmin && (input.provider || input.model)) {
      return NextResponse.json(
        { error: 'Solo gli amministratori possono selezionare provider e modelli personalizzati.' },
        { status: 403 }
      );
    }

    if (isAdmin && input.provider && !input.model) {
      return NextResponse.json(
        { error: 'Specifica un modello valido per il provider selezionato.' },
        { status: 400 }
      );
    }

    // Validate messages
    if (!input.messages || input.messages.length === 0) {
      return NextResponse.json({ error: 'Almeno un messaggio è richiesto' }, { status: 400 });
    }

    // Ensure last message is from user
    const lastMessage = input.messages[input.messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: "L'ultimo messaggio deve essere dall'utente" },
        { status: 400 }
      );
    }

    const modelOverride: ChatCallOptions['modelOverride'] =
      isAdmin && input.provider && input.model
        ? {
            provider: input.provider,
            model: input.model.trim(),
          }
        : undefined;

    // Recupera profilo utente per auto-fill parametri
    let userProfile;
    try {
      const profile = await userProfileService.getSerialized(userOrError.id);
      userProfile = {
        weight: profile.weightKg,
        height: profile.heightCm,
        age: profile.age,
        gender: profile.sex ? profile.sex.toLowerCase() : null,
        activityLevel: profile.activityLevel ? profile.activityLevel.toLowerCase() : null,
      };
    } catch (error: unknown) {
      logger.warn('Error loading user profile for chat:', error);
      // Continua senza profilo se non disponibile
      userProfile = undefined;
    }

    // Build a simple transcript prompt. The ChatAgent works prompt-first.
    const transcript = input.messages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');

    const agent = getChatAgent();
    const streamResult = await agent.stream({
      prompt: transcript,
      options: {
        userId: userOrError.id,
        isAdmin,
        tier: input.tier,
        domain: 'general',
        userProfile,
        modelOverride,
        reasoning: input.reasoning,
        reasoningEffort: input.reasoningEffort,
      },
    });

    return streamResult.toTextStreamResponse();
  } catch (error: unknown) {
    logError('Errore nello streaming della chat', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
