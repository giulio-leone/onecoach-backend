import { prisma } from '@giulio-leone/lib-core';
import type { ai_framework_configs, ai_framework_config_history } from '@prisma/client';
import { logger, toPrismaJsonValue } from '@giulio-leone/lib-shared';

const log = logger.child('AIFrameworkConfigService');

/**
 * AI Framework Configuration Service
 *
 * Gestisce le configurazioni avanzate del framework agentico:
 * - Consensus system (multi-model voting)
 * - Skills system (universal skills registry)
 * - Learning feedback loop (adaptive thresholds)
 * - Mode selection intelligence
 * - Decomposition strategies
 */

/**
 * Framework features disponibili
 */
export enum FrameworkFeature {
  CONSENSUS_SYSTEM = 'consensus_system',
  SKILLS_SYSTEM = 'skills_system',
  LEARNING_FEEDBACK_LOOP = 'learning_feedback_loop',
  INTELLIGENT_MODE_SELECTION = 'intelligent_mode_selection',
  AUTO_DECOMPOSITION = 'auto_decomposition',
  ADAPTIVE_RECOVERY = 'adaptive_recovery',
  COST_MONITORING = 'cost_monitoring',
  ORCHESTRATION_TRACING = 'orchestration_tracing',
  WORKOUT_GENERATION_RETRY = 'workout_generation_retry',
  IMPORT_MODELS = 'import_models',
  GENERATION_RECOVERY = 'generation_recovery',
}

const FEATURE_ALIASES: Partial<Record<string, FrameworkFeature>> = {
  workout_import: FrameworkFeature.IMPORT_MODELS,
} as const;

const normalizeFeature = (feature: string): FrameworkFeature =>
  FEATURE_ALIASES[feature] ?? (feature as FrameworkFeature);

/**
 * Consensus system configuration
 */
export interface ConsensusConfig {
  votingStrategy: 'majority' | 'weighted' | 'confidence' | 'unanimous';
  minModels: number; // Minimum models for consensus (2-5)
  maxModels: number; // Maximum models to query (2-5)
  confidenceThreshold: number; // 0-1, minimum confidence to accept result
  modelTiers: Array<'fast' | 'balanced' | 'quality'>; // Which model tiers to use
  timeoutMs: number; // Timeout for ensemble execution
}

/**
 * Skills system configuration
 */
export interface SkillsConfig {
  enableBuiltInSkills: boolean;
  enableDomainSkills: boolean; // Nutrition, workout specific skills
  enableCustomSkills: boolean; // User-defined skills
  autoDiscovery: boolean; // Auto-discover new skills
  skillTimeout: number; // Timeout for skill execution
}

/**
 * Learning feedback loop configuration
 */
export interface LearningConfig {
  enableAdaptiveThresholds: boolean;
  enableMetricsCollection: boolean;
  enableFeedbackLoop: boolean;
  thresholdAdjustmentRate: number; // 0-1, how fast thresholds adapt
  metricsRetentionDays: number; // How long to keep metrics
  minSamplesForAdjustment: number; // Minimum samples before adjusting thresholds
}

/**
 * Mode selection configuration
 */
export interface ModeSelectionConfig {
  useAISelection: boolean; // Use AI vs heuristic mode selection
  enableCaching: boolean;
  fallbackMode: 'planning' | 'analyze' | 'explain' | 'review';
  minConfidenceThreshold: number; // 0-1
}

/**
 * Auto-decomposition configuration
 */
export interface AutoDecompositionConfig {
  enableAutoDecomposition: boolean;
  maxDepth: number; // Max nesting depth (1-10)
  minConfidenceThreshold: number; // 0-1
  enableCaching: boolean;
}

/**
 * Adaptive recovery configuration
 */
export interface AdaptiveRecoveryConfig {
  enableAdaptiveRecovery: boolean;
  maxRetries: number; // Maximum retry attempts (1-5)
  strategies: Array<'regenerate' | 'patch' | 'escalate'>;
  confidenceThreshold: number; // 0-1
}

/**
 * Cost monitoring configuration
 */
export interface CostMonitoringConfig {
  enableMonitoring: boolean;
  budgetLimit: number; // Credits limit per operation
  enableAlerts: boolean;
  alertThreshold: number; // % of budget to trigger alert (0-100)
}

/**
 * Orchestration tracing configuration
 */
export interface TracingConfig {
  enableTracing: boolean;
  enablePerformanceMetrics: boolean;
  enableDecisionLogging: boolean;
  retentionDays: number;
}

/**
 * Workout generation retry configuration
 */
export interface WorkoutGenerationRetryConfig {
  count: number;
}

/**
 * Generation recovery configuration
 */
export interface GenerationRecoveryConfig {
  enabled: boolean;
  maxRetriesPerPhase: number;
  stateRetentionHours: number;
  errorFeedbackLevel: 'minimal' | 'detailed';
}

/**
 * Import models configuration (vision/text multi-formato)
 * Consente di selezionare i modelli AI per parsing/import multi-formato
 */
export interface ImportModelsConfig {
  /** Model ID to use for spreadsheet/CSV parsing (e.g., 'google/gemini-2.5-flash') */
  spreadsheetModel: string;
  /** Model ID to use for image parsing */
  imageModel: string;
  /** Model ID to use for PDF parsing */
  pdfModel: string;
  /** Model ID to use for document parsing */
  documentModel: string;
  /** Fallback model if primary fails */
  fallbackModel: string;
  /** Credit costs per file type (configurable via admin) */
  creditCosts: {
    image: number;
    pdf: number;
    document: number;
    spreadsheet: number;
  };
  /** Max retry attempts for AI calls */
  maxRetries: number;
  /** Base delay (ms) for exponential backoff */
  retryDelayBaseMs: number;
}

/**
 * Type guard per config types
 */
type FeatureConfigMap = {
  [FrameworkFeature.CONSENSUS_SYSTEM]: ConsensusConfig;
  [FrameworkFeature.SKILLS_SYSTEM]: SkillsConfig;
  [FrameworkFeature.LEARNING_FEEDBACK_LOOP]: LearningConfig;
  [FrameworkFeature.INTELLIGENT_MODE_SELECTION]: ModeSelectionConfig;
  [FrameworkFeature.AUTO_DECOMPOSITION]: AutoDecompositionConfig;
  [FrameworkFeature.ADAPTIVE_RECOVERY]: AdaptiveRecoveryConfig;
  [FrameworkFeature.COST_MONITORING]: CostMonitoringConfig;
  [FrameworkFeature.ORCHESTRATION_TRACING]: TracingConfig;
  [FrameworkFeature.WORKOUT_GENERATION_RETRY]: WorkoutGenerationRetryConfig;
  [FrameworkFeature.IMPORT_MODELS]: ImportModelsConfig;
  [FrameworkFeature.GENERATION_RECOVERY]: GenerationRecoveryConfig;
};

/**
 * Union type of all possible config types
 */
type AllConfigTypes =
  | ConsensusConfig
  | SkillsConfig
  | LearningConfig
  | ModeSelectionConfig
  | AutoDecompositionConfig
  | AdaptiveRecoveryConfig
  | CostMonitoringConfig
  | TracingConfig
  | WorkoutGenerationRetryConfig
  | ImportModelsConfig
  | GenerationRecoveryConfig;

const IMPORT_MODELS_DEFAULT: ImportModelsConfig = {
  spreadsheetModel: 'google/gemini-2.5-flash',
  imageModel: 'google/gemini-2.5-flash',
  pdfModel: 'google/gemini-2.5-flash',
  documentModel: 'google/gemini-2.5-flash',
  fallbackModel: 'openai/gpt-4o-mini',
  creditCosts: {
    image: 8,
    pdf: 10,
    document: 8,
    spreadsheet: 6,
  },
  maxRetries: 2,
  retryDelayBaseMs: 1000,
};

/**
 * Default configurations per feature
 */
const DEFAULT_CONFIGS: Record<FrameworkFeature, unknown> = {
  [FrameworkFeature.CONSENSUS_SYSTEM]: {
    votingStrategy: 'weighted',
    minModels: 2,
    maxModels: 3,
    confidenceThreshold: 0.7,
    modelTiers: ['fast', 'balanced'],
    timeoutMs: 30000,
  } as ConsensusConfig,

  [FrameworkFeature.SKILLS_SYSTEM]: {
    enableBuiltInSkills: true,
    enableDomainSkills: true,
    enableCustomSkills: false,
    autoDiscovery: false,
    skillTimeout: 10000,
  } as SkillsConfig,

  [FrameworkFeature.LEARNING_FEEDBACK_LOOP]: {
    enableAdaptiveThresholds: true,
    enableMetricsCollection: true,
    enableFeedbackLoop: false, // Disabled by default until fully tested
    thresholdAdjustmentRate: 0.1,
    metricsRetentionDays: 30,
    minSamplesForAdjustment: 100,
  } as LearningConfig,

  [FrameworkFeature.INTELLIGENT_MODE_SELECTION]: {
    useAISelection: true,
    enableCaching: true,
    fallbackMode: 'planning',
    minConfidenceThreshold: 0.6,
  } as ModeSelectionConfig,

  [FrameworkFeature.AUTO_DECOMPOSITION]: {
    enableAutoDecomposition: true,
    maxDepth: 5,
    minConfidenceThreshold: 0.6,
    enableCaching: true,
  } as AutoDecompositionConfig,

  [FrameworkFeature.ADAPTIVE_RECOVERY]: {
    enableAdaptiveRecovery: true,
    maxRetries: 3,
    strategies: ['regenerate', 'patch', 'escalate'],
    confidenceThreshold: 0.7,
  } as AdaptiveRecoveryConfig,

  [FrameworkFeature.COST_MONITORING]: {
    enableMonitoring: true,
    budgetLimit: 1000, // 1000 credits
    enableAlerts: true,
    alertThreshold: 80, // 80%
  } as CostMonitoringConfig,

  [FrameworkFeature.ORCHESTRATION_TRACING]: {
    enableTracing: true,
    enablePerformanceMetrics: true,
    enableDecisionLogging: true,
    retentionDays: 7,
  } as TracingConfig,

  [FrameworkFeature.WORKOUT_GENERATION_RETRY]: {
    count: 3,
  } as WorkoutGenerationRetryConfig,

  [FrameworkFeature.IMPORT_MODELS]: IMPORT_MODELS_DEFAULT,
  [FrameworkFeature.GENERATION_RECOVERY]: {
    enabled: true,
    maxRetriesPerPhase: 2,
    stateRetentionHours: 24,
    errorFeedbackLevel: 'detailed',
  } as GenerationRecoveryConfig,
};

/**
 * Feature descriptions
 */
const FEATURE_DESCRIPTIONS: Record<FrameworkFeature, string> = {
  [FrameworkFeature.CONSENSUS_SYSTEM]:
    'Multi-model voting system for improved accuracy and reliability',
  [FrameworkFeature.SKILLS_SYSTEM]: 'Universal skills registry for extensible agent capabilities',
  [FrameworkFeature.LEARNING_FEEDBACK_LOOP]:
    'Adaptive learning system that improves over time based on performance metrics',
  [FrameworkFeature.INTELLIGENT_MODE_SELECTION]:
    'AI-powered semantic mode selection for optimal task execution',
  [FrameworkFeature.AUTO_DECOMPOSITION]: 'Automatic task decomposition for complex operations',
  [FrameworkFeature.ADAPTIVE_RECOVERY]: 'Smart error recovery with multiple fallback strategies',
  [FrameworkFeature.COST_MONITORING]: 'Real-time cost tracking and budget management',
  [FrameworkFeature.ORCHESTRATION_TRACING]:
    'Distributed tracing for orchestration debugging and analytics',
  [FrameworkFeature.WORKOUT_GENERATION_RETRY]:
    'Configuration for workout generation retry attempts',
  [FrameworkFeature.IMPORT_MODELS]:
    'AI model configuration for import/parsing (CSV, XLSX, PDF, images, documents)',
  [FrameworkFeature.GENERATION_RECOVERY]:
    'Sistema di resilienza e recovery per processi di generazione AI complessi',
};

/**
 * AI Framework Config Service
 */
export class AIFrameworkConfigService {
  /**
   * Get configuration for a specific feature
   */
  static async getConfig<F extends FrameworkFeature>(
    feature: F
  ): Promise<{
    isEnabled: boolean;
    config: FeatureConfigMap[F];
  }> {
    const normalizedFeature = normalizeFeature(feature);

    const record = await prisma.ai_framework_configs.findUnique({
      where: { feature: normalizedFeature },
    });

    if (!record) {
      // Return default configuration if not found
      return {
        isEnabled: false, // All features disabled by default
        config: DEFAULT_CONFIGS[normalizedFeature] as FeatureConfigMap[F],
      };
    }

    return {
      isEnabled: record.isEnabled,
      config:
        (record.config as unknown as FeatureConfigMap[F]) ||
        (DEFAULT_CONFIGS[normalizedFeature] as FeatureConfigMap[F]),
    };
  }

  /**
   * Get all feature configurations
   */
  static async getAllConfigs(): Promise<ai_framework_configs[]> {
    return await prisma.ai_framework_configs.findMany({
      orderBy: { feature: 'asc' },
    });
  }

  /**
   * Update configuration for a feature
   */
  static async updateConfig<F extends FrameworkFeature>(params: {
    feature: F;
    isEnabled?: boolean;
    config?: Partial<FeatureConfigMap[F]>;
    updatedBy: string;
    changeReason?: string;
  }): Promise<ai_framework_configs> {
    const { feature, isEnabled, config, updatedBy, changeReason } = params;
    const normalizedFeature = normalizeFeature(feature);

    // Get current config
    const current = await this.getConfig(normalizedFeature as F);

    // Merge with new config
    let mergedConfig = config ? { ...current.config, ...config } : current.config;

    // Deep-merge nested creditCosts for import models to avoid overwriting missing keys
    if (normalizedFeature === FrameworkFeature.IMPORT_MODELS && config && 'creditCosts' in config) {
      const currentConfig = current.config as ImportModelsConfig;
      const incomingCosts = (config as Partial<ImportModelsConfig>).creditCosts;

      log.warn('[AIFrameworkConfigService] Deep-merging creditCosts:', {
        current: currentConfig?.creditCosts,
        incoming: incomingCosts,
      });

      if (incomingCosts) {
        mergedConfig = {
          ...mergedConfig,
          creditCosts: {
            ...(currentConfig?.creditCosts ||
              (DEFAULT_CONFIGS[FrameworkFeature.IMPORT_MODELS] as ImportModelsConfig).creditCosts),
            ...incomingCosts,
          },
        };
      }
    }

    log.warn('[AIFrameworkConfigService] updateConfig:', {
      feature: normalizedFeature,
      isEnabled,
      currentConfig: current.config,
      incomingConfig: config,
      mergedConfig,
    });

    // Upsert configuration
    const updated = await prisma.ai_framework_configs.upsert({
      where: { feature: normalizedFeature },
      create: {
        feature: normalizedFeature,
        isEnabled: isEnabled ?? false,
        config: toPrismaJsonValue(mergedConfig as unknown as Record<string, unknown>),
        description: FEATURE_DESCRIPTIONS[normalizedFeature],
        updatedBy,
      },
      update: {
        isEnabled: isEnabled ?? current.isEnabled,
        config: toPrismaJsonValue(mergedConfig as unknown as Record<string, unknown>),
        updatedBy,
        updatedAt: new Date(),
      },
    });

    // Create history record
    await this.createHistory({
      feature: normalizedFeature,
      isEnabled: updated.isEnabled,
      config: mergedConfig as FeatureConfigMap[F],
      changedBy: updatedBy,
      changeReason,
    });

    return updated;
  }

  /**
   * Check if a feature is enabled
   */
  static async isFeatureEnabled(feature: FrameworkFeature): Promise<boolean> {
    const { isEnabled } = await this.getConfig(feature);
    return isEnabled;
  }

  /**
   * Enable a feature
   */
  static async enableFeature(
    feature: FrameworkFeature,
    updatedBy: string,
    changeReason?: string
  ): Promise<ai_framework_configs> {
    return await this.updateConfig({
      feature,
      isEnabled: true,
      updatedBy,
      changeReason,
    });
  }

  /**
   * Disable a feature
   */
  static async disableFeature(
    feature: FrameworkFeature,
    updatedBy: string,
    changeReason?: string
  ): Promise<ai_framework_configs> {
    return await this.updateConfig({
      feature,
      isEnabled: false,
      updatedBy,
      changeReason,
    });
  }

  /**
   * Initialize default configurations
   */
  static async initializeDefaults(updatedBy: string = 'system'): Promise<void> {
    const handled = new Set<FrameworkFeature>();

    for (const feature of Object.values(FrameworkFeature)) {
      const normalizedFeature = normalizeFeature(feature);
      if (handled.has(normalizedFeature)) continue;
      handled.add(normalizedFeature);

      const existing = await prisma.ai_framework_configs.findUnique({
        where: { feature: normalizedFeature },
      });

      if (!existing) {
        await prisma.ai_framework_configs.create({
          data: {
            feature: normalizedFeature,
            isEnabled: false, // All features disabled by default
            config: toPrismaJsonValue(
              DEFAULT_CONFIGS[normalizedFeature] as unknown as Record<string, unknown>
            ),
            description: FEATURE_DESCRIPTIONS[normalizedFeature],
            updatedBy,
          },
        });
      }
    }
  }

  /**
   * Create history record
   */
  private static async createHistory(params: {
    feature: string;
    isEnabled: boolean;
    config: AllConfigTypes;
    changedBy: string;
    changeReason?: string;
  }): Promise<ai_framework_config_history> {
    return await prisma.ai_framework_config_history.create({
      data: {
        ...params,
        // Cast necessario per Prisma JsonValue (richiede Record<string, unknown>)
        // Il tipo del parametro è già specifico (AllConfigTypes)
        config: toPrismaJsonValue(params.config as unknown as Record<string, unknown>),
      },
    });
  }

  /**
   * Get configuration history for a feature
   */
  static async getHistory(feature: FrameworkFeature): Promise<ai_framework_config_history[]> {
    const normalizedFeature = normalizeFeature(feature);
    return await prisma.ai_framework_config_history.findMany({
      where: { feature: normalizedFeature },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Get feature descriptions
   */
  static getFeatureDescription(feature: FrameworkFeature): string {
    return FEATURE_DESCRIPTIONS[normalizeFeature(feature)];
  }

  /**
   * Get all feature descriptions
   */
  static getAllFeatureDescriptions(): Record<FrameworkFeature, string> {
    return FEATURE_DESCRIPTIONS;
  }

  /**
   * Validate configuration
   */
  static validateConfig<F extends FrameworkFeature>(
    feature: F,
    config: FeatureConfigMap[F]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (feature) {
      case FrameworkFeature.CONSENSUS_SYSTEM: {
        const c = config as ConsensusConfig;
        if (c.minModels < 2 || c.minModels > 5) {
          errors.push('minModels must be between 2 and 5');
        }
        if (c.maxModels < c.minModels || c.maxModels > 5) {
          errors.push('maxModels must be >= minModels and <= 5');
        }
        if (c.confidenceThreshold < 0 || c.confidenceThreshold > 1) {
          errors.push('confidenceThreshold must be between 0 and 1');
        }
        break;
      }

      case FrameworkFeature.LEARNING_FEEDBACK_LOOP: {
        const c = config as LearningConfig;
        if (c.thresholdAdjustmentRate < 0 || c.thresholdAdjustmentRate > 1) {
          errors.push('thresholdAdjustmentRate must be between 0 and 1');
        }
        if (c.metricsRetentionDays < 1 || c.metricsRetentionDays > 365) {
          errors.push('metricsRetentionDays must be between 1 and 365');
        }
        break;
      }

      case FrameworkFeature.AUTO_DECOMPOSITION: {
        const c = config as AutoDecompositionConfig;
        if (c.maxDepth < 1 || c.maxDepth > 10) {
          errors.push('maxDepth must be between 1 and 10');
        }
        break;
      }

      case FrameworkFeature.ADAPTIVE_RECOVERY: {
        const c = config as AdaptiveRecoveryConfig;
        if (c.maxRetries < 1 || c.maxRetries > 5) {
          errors.push('maxRetries must be between 1 and 5');
        }
        break;
      }

      case FrameworkFeature.COST_MONITORING: {
        const c = config as CostMonitoringConfig;
        if (c.budgetLimit < 0) {
          errors.push('budgetLimit must be >= 0');
        }
        if (c.alertThreshold < 0 || c.alertThreshold > 100) {
          errors.push('alertThreshold must be between 0 and 100');
        }
        break;
      }

      case FrameworkFeature.IMPORT_MODELS: {
        const c = config as ImportModelsConfig;
        if (c.maxRetries < 0 || c.maxRetries > 5) {
          errors.push('maxRetries must be between 0 and 5');
        }
        if (c.retryDelayBaseMs < 0) {
          errors.push('retryDelayBaseMs must be >= 0');
        }
        if (!c.creditCosts) {
          errors.push('creditCosts configuration is required');
          break;
        }
        (['image', 'pdf', 'document', 'spreadsheet'] as const).forEach((key) => {
          const value = c.creditCosts[key];
          if (value === undefined || Number.isNaN(Number(value)) || value < 0) {
            errors.push(`creditCosts.${key} must be >= 0`);
          }
        });
        break;
      }

      case FrameworkFeature.GENERATION_RECOVERY: {
        const c = config as GenerationRecoveryConfig;
        if (c.maxRetriesPerPhase < 1 || c.maxRetriesPerPhase > 5) {
          errors.push('maxRetriesPerPhase must be between 1 and 5');
        }
        if (c.stateRetentionHours < 1 || c.stateRetentionHours > 168) {
          errors.push('stateRetentionHours must be between 1 and 168');
        }
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
