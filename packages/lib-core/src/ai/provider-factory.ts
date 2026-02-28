import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAI, type OpenAIProvider } from '@ai-sdk/openai';
import { createAnthropic, type AnthropicProvider } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI, type GoogleGenerativeAIProvider } from '@ai-sdk/google';
import { createXai, type XaiProvider } from '@ai-sdk/xai';
import { createMinimax, type MinimaxProvider } from 'vercel-minimax-ai-provider';
import { getOpenRouterConfig, getAIProviderKey } from '../config/env';

/** Gemini CLI thinkingLevel for Gemini 3 models */
export type GeminiThinkingLevel = 'minimal' | 'low' | 'medium' | 'high';

/**
 * AI Provider Types
 */
export type AIProviderType =
  | 'openrouter'
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'xai'
  | 'minimax';

/**
 * Provider Configuration
 */
export interface ProviderConfig {
  type: AIProviderType;
  apiKey?: string;
  baseUrl?: string;
  siteUrl?: string;
  appName?: string;
}

/**
 * AIProviderFactory
 *
 * Centralized factory for creating AI SDK 6 providers.
 * Merges the most up-to-date logic from one-agent and lib-ai-agents.
 */
export class AIProviderFactory {
  /**
   * Create an OpenRouter provider with standard attribution headers
   */
  public static createOpenRouter(
    config?: Partial<ProviderConfig> & { preferredProvider?: string | null }
  ) {
    const envConfig = getOpenRouterConfig();
    const apiKey = config?.apiKey || envConfig.apiKey;

    if (!apiKey) {
      throw new Error(
        'OpenRouter API key is missing. Please set OPENROUTER_API_KEY environment variable.'
      );
    }

    // NOTE: Provider routing (order, allowFallbacks) should be passed at request time
    // via providerOptions.openrouter.provider, NOT at factory level.
    // See: https://openrouter.ai/docs/features/provider-routing
    // The buildProviderOptions utility handles this correctly.
    return createOpenRouter({
      apiKey,
      baseURL: config?.baseUrl || envConfig.baseUrl,
      headers: {
        'HTTP-Referer': config?.siteUrl || envConfig.siteUrl || 'https://onecoach.ai',
        'X-Title': config?.appName || envConfig.appName || 'onecoach AI',
      },
    });
  }

  /**
   * Create an OpenAI provider
   */
  public static createOpenAI(apiKey?: string): OpenAIProvider {
    const key = apiKey || getAIProviderKey('openai');
    return createOpenAI({ apiKey: key });
  }

  /**
   * Create an Anthropic provider
   */
  public static createAnthropic(apiKey?: string): AnthropicProvider {
    const key = apiKey || getAIProviderKey('anthropic');
    return createAnthropic({ apiKey: key });
  }

  /**
   * Create a Google provider
   */
  public static createGoogle(apiKey?: string): GoogleGenerativeAIProvider {
    const key = apiKey || getAIProviderKey('google');
    return createGoogleGenerativeAI({ apiKey: key });
  }

  /**
   * Create an xAI provider
   */
  public static createXAI(apiKey?: string): XaiProvider {
    const key = apiKey || getAIProviderKey('xai');
    return createXai({ apiKey: key });
  }

  /**
   * Create a MiniMax provider using official vercel-minimax-ai-provider
   * https://github.com/MiniMax-AI/vercel-minimax-ai-provider
   */
  public static createMiniMax(apiKey?: string): MinimaxProvider {
    const key = apiKey || getAIProviderKey('minimax');
    // Official provider uses Anthropic-compatible API by default
    // which provides better support for advanced features
    return createMinimax({ apiKey: key });
  }

  /**
   * Get a model instance from a provider
   */
  public static async getModel(
    providerName: AIProviderType,
    modelName: string,
    config?: {
      apiKey?: string;
      preferredProvider?: string | null;
      thinkingLevel?: GeminiThinkingLevel;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    switch (providerName) {
      case 'openrouter':
        return this.createOpenRouter({
          apiKey: config?.apiKey,
          preferredProvider: config?.preferredProvider,
        }).languageModel(modelName);
      case 'openai':
        return this.createOpenAI(config?.apiKey).languageModel(modelName);
      case 'anthropic':
        return this.createAnthropic(config?.apiKey).languageModel(modelName);
      case 'google':
        return this.createGoogle(config?.apiKey).languageModel(modelName);
      case 'xai':
        return this.createXAI(config?.apiKey).languageModel(modelName);
      case 'minimax':
        return this.createMiniMax(config?.apiKey).languageModel(modelName);
      default:
        throw new Error(`Unsupported provider: ${providerName}`);
    }
  }
}
