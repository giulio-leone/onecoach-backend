/**
 * Vision Parser Core
 *
 * Unified AI vision parsing with:
 * - Credit management via creditService (lib-core)
 * - Retry with exponential backoff + model fallback
 * - Streaming with structured output (Zod)
 *
 * Used by all domain VisionServices (Workout, Food, BodyMeasurements, etc.)
 *
 * @module lib-import-core/vision
 */

import { streamText, Output } from 'ai';
import { AIFrameworkConfigService, FrameworkFeature, type ImportModelsConfig, AIProviderConfigService } from '@giulio-leone/lib-ai';
import { createOpenAI } from '@ai-sdk/openai';
import { logger, creditService } from '@giulio-leone/lib-core';
import type { VisionParseParams, ImportFileType } from './types';

// ==================== CONFIG ====================

const VISION_CONFIG = {
  TIMEOUT_MS: 600000, // 10 minutes
  MAX_OUTPUT_TOKENS: 65000,
  DEFAULT_MAX_RETRIES: 2,
  DEFAULT_RETRY_DELAY_MS: 1000,
};

type ImportModelKey = 'imageModel' | 'pdfModel' | 'documentModel' | 'spreadsheetModel';

// ==================== MODEL CONFIG LOADER ====================

interface VisionModelConfig {
  model: string;
  fallbackModel: string;
  apiKey: string;
  creditCost: number;
  maxRetries: number;
  retryDelayBaseMs: number;
}

async function getVisionModelConfig(fileType: ImportFileType): Promise<VisionModelConfig> {
  const apiKey = await AIProviderConfigService.getApiKey('openrouter');

  if (!apiKey) {
    throw new Error(
      'OpenRouter API key non configurata. Vai su Admin > AI Settings > Provider API Keys.'
    );
  }

  const { config } = await AIFrameworkConfigService.getConfig(FrameworkFeature.IMPORT_MODELS);

  if (!config) {
    throw new Error('Configurazione AI per import non trovata.');
  }

  const typedConfig = config as ImportModelsConfig;

  const modelKeyMap: Record<ImportFileType, ImportModelKey> = {
    image: 'imageModel',
    pdf: 'pdfModel',
    document: 'documentModel',
    spreadsheet: 'spreadsheetModel',
  };

  const modelKey = modelKeyMap[fileType];
  const model = typedConfig[modelKey];

  if (!model) throw new Error(`Modello AI per tipo "${fileType}" non configurato.`);

  const fallbackModel = typedConfig.fallbackModel;
  if (!fallbackModel) throw new Error('Modello fallback non configurato.');

  const creditCost = typedConfig.creditCosts?.[fileType];
  if (creditCost === undefined) throw new Error(`Costo crediti per "${fileType}" non configurato.`);

  return {
    model,
    fallbackModel,
    apiKey,
    creditCost: Number(creditCost),
    maxRetries: typedConfig.maxRetries ?? VISION_CONFIG.DEFAULT_MAX_RETRIES,
    retryDelayBaseMs: typedConfig.retryDelayBaseMs ?? VISION_CONFIG.DEFAULT_RETRY_DELAY_MS,
  };
}

// ==================== UTILITIES ====================

function base64ToDataUrl(base64: string, mimeType: string): string {
  const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');
  return `data:${mimeType};base64,${cleanBase64}`;
}

function decodeBase64ToText(base64: string): string {
  const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');
  return Buffer.from(cleanBase64, 'base64').toString('utf-8');
}

function isTextMimeType(mimeType: string): boolean {
  return mimeType === 'text/csv' || mimeType === 'text/plain';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==================== MAIN PARSER ====================

/**
 * Parse content with AI vision/text models
 *
 * Unified entry point for all domain services.
 * Handles credit management, retry logic, and structured output.
 */
export async function parseWithVisionAI<T>(params: VisionParseParams<T>): Promise<T> {
  const {
    contentBase64,
    mimeType,
    prompt,
    schema,
    userId,
    fileType,
    creditCost: overrideCreditCost,
    modelId: overrideModelId,
    apiKey: overrideApiKey,
    onProgress,
  } = params;

  // Load config
  const config = await getVisionModelConfig(fileType);
  const creditCost = overrideCreditCost ?? config.creditCost;
  const apiKey = overrideApiKey ?? config.apiKey;
  const initialModel = overrideModelId ?? config.model;

  logger.info('[VisionCore] Starting parse', { userId, fileType, model: initialModel, creditCost });

  // Check and consume credits upfront
  const hasCredits = await creditService.checkCredits(userId, creditCost);
  if (!hasCredits) throw new Error(`Crediti insufficienti. Richiesti: ${creditCost}`);

  await creditService.consumeCredits({
    userId,
    amount: creditCost,
    type: 'CONSUMPTION',
    description: `AI Vision: ${fileType}`,
    metadata: { operation: `vision_parse_${fileType}`, provider: 'openrouter', model: initialModel },
  });

  // Retry with fallback
  let currentModel = initialModel;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      onProgress?.(`Parsing con AI (${currentModel})...`, 0.3 + attempt * 0.1);

      const result = isTextMimeType(mimeType)
        ? await callTextAI({ contentBase64, mimeType, prompt, schema, modelId: currentModel, apiKey })
        : await callVisionAI({ contentBase64, mimeType, prompt, schema, modelId: currentModel, apiKey });

      logger.info('[VisionCore] Parse successful', { userId, fileType, attempts: attempt + 1 });
      onProgress?.('Parsing completato', 1);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn('[VisionCore] Attempt failed', { attempt: attempt + 1, error: lastError.message });

      // Switch to fallback on first failure
      if (attempt === 0 && currentModel !== config.fallbackModel) {
        currentModel = config.fallbackModel;
      }

      // Wait before retry
      if (attempt < config.maxRetries) {
        await sleep(config.retryDelayBaseMs * Math.pow(2, attempt));
      }
    }
  }

  // Refund credits on failure
  await creditService.addCredits({
    userId,
    amount: creditCost,
    type: 'ADMIN_ADJUSTMENT',
    description: 'Rimborso parsing fallito',
  });

  throw lastError ?? new Error('All retry attempts failed');
}

// ==================== AI CALLERS ====================

interface AICallParams<T> {
  contentBase64: string;
  mimeType: string;
  prompt: string;
  schema: import('zod').ZodSchema<T>;
  modelId: string;
  apiKey: string;
}

async function callVisionAI<T>(params: AICallParams<T>): Promise<T> {
  const { contentBase64, mimeType, prompt, schema, modelId, apiKey } = params;

  const openai = createOpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    headers: {
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://onecoach.ai',
      'X-Title': process.env.OPENROUTER_SITE_NAME || 'onecoach AI',
    },
  });

  const model = openai(modelId) as unknown as Parameters<typeof streamText>[0]['model'];
  const dataUrl = base64ToDataUrl(contentBase64, mimeType);

  const streamResult = streamText({
    model,
    output: Output.object({ schema }),
    messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image', image: dataUrl }] }],
    abortSignal: AbortSignal.timeout(VISION_CONFIG.TIMEOUT_MS),
  });

  for await (const _ of streamResult.partialOutputStream) {}

  const validated = await streamResult.output;
  if (!validated) throw new Error('AI returned empty response');

  return validated;
}

async function callTextAI<T>(params: AICallParams<T>): Promise<T> {
  const { contentBase64, prompt, schema, modelId, apiKey } = params;

  let textContent: string;
  try {
    textContent = decodeBase64ToText(contentBase64);
    if (textContent.startsWith('PK')) return callVisionAI(params); // Binary XLSX fallback
  } catch {
    return callVisionAI(params);
  }

  const openai = createOpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    headers: {
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://onecoach.ai',
      'X-Title': process.env.OPENROUTER_SITE_NAME || 'onecoach AI',
    },
  });

  const model = openai(modelId) as unknown as Parameters<typeof streamText>[0]['model'];
  const fullPrompt = `${prompt}\n\nDATA:\n\`\`\`\n${textContent.substring(0, 50000)}\n\`\`\``;

  const streamResult = streamText({
    model,
    output: Output.object({ schema }),
    prompt: fullPrompt,
    abortSignal: AbortSignal.timeout(VISION_CONFIG.TIMEOUT_MS),
  });

  for await (const _ of streamResult.partialOutputStream) {}

  const validated = await streamResult.output;
  if (!validated) throw new Error('AI returned empty response');

  return validated;
}
