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
 * Provider config descriptor returned by the factory.
 * Replaces the AI SDK LanguageModel — consumers should use Gauss Agent directly.
 */
export interface ProviderConfigDescriptor {
  readonly provider: string;
  readonly modelId: string;
  readonly apiKey: string | undefined;
  readonly baseUrl?: string;
  readonly preferredProvider?: string | null;
}

/**
 * AIProviderFactory
 *
 * Centralized factory for AI provider configuration.
 * Returns config descriptors instead of AI SDK models —
 * all actual AI calls go through Gauss Agent.
 */
export class AIProviderFactory {
  /**
   * Create an OpenRouter config descriptor
   */
  public static createOpenRouter(
    config?: Partial<ProviderConfig> & { preferredProvider?: string | null }
  ): (model: string) => ProviderConfigDescriptor {
    const envConfig = getOpenRouterConfig();
    const apiKey = config?.apiKey || envConfig.apiKey;
    if (!apiKey) {
      throw new Error(
        'OpenRouter API key is missing. Please set OPENROUTER_API_KEY environment variable.'
      );
    }
    const baseUrl = config?.baseUrl || envConfig.baseUrl;
    const preferredProvider = config?.preferredProvider;

    return (modelId: string) => ({
      provider: 'openrouter',
      modelId,
      apiKey,
      baseUrl,
      preferredProvider,
    });
  }

  public static createOpenAI(apiKey?: string): (model: string) => ProviderConfigDescriptor {
    const key = apiKey || getAIProviderKey('openai');
    return (modelId: string) => ({ provider: 'openai', modelId, apiKey: key });
  }

  public static createAnthropic(apiKey?: string): (model: string) => ProviderConfigDescriptor {
    const key = apiKey || getAIProviderKey('anthropic');
    return (modelId: string) => ({ provider: 'anthropic', modelId, apiKey: key });
  }

  public static createGoogle(apiKey?: string): (model: string) => ProviderConfigDescriptor {
    const key = apiKey || getAIProviderKey('google');
    return (modelId: string) => ({ provider: 'google', modelId, apiKey: key });
  }

  public static createXAI(apiKey?: string): (model: string) => ProviderConfigDescriptor {
    const key = apiKey || getAIProviderKey('xai');
    return (modelId: string) => ({ provider: 'xai', modelId, apiKey: key });
  }

  public static createMiniMax(apiKey?: string): (model: string) => ProviderConfigDescriptor {
    const key = apiKey || getAIProviderKey('minimax');
    return (modelId: string) => ({ provider: 'minimax', modelId, apiKey: key });
  }

  /**
   * Get a model config descriptor
   */
  public static async getModel(
    providerName: AIProviderType,
    modelName: string,
    config?: {
      apiKey?: string;
      preferredProvider?: string | null;
      thinkingLevel?: GeminiThinkingLevel;
    }
  ): Promise<ProviderConfigDescriptor> {
    switch (providerName) {
      case 'openrouter':
        return this.createOpenRouter({
          apiKey: config?.apiKey,
          preferredProvider: config?.preferredProvider,
        })(modelName);
      case 'openai':
        return this.createOpenAI(config?.apiKey)(modelName);
      case 'anthropic':
        return this.createAnthropic(config?.apiKey)(modelName);
      case 'google':
        return this.createGoogle(config?.apiKey)(modelName);
      case 'xai':
        return this.createXAI(config?.apiKey)(modelName);
      case 'minimax':
        return this.createMiniMax(config?.apiKey)(modelName);
      default:
        throw new Error(`Unsupported provider: ${providerName}`);
    }
  }
}
