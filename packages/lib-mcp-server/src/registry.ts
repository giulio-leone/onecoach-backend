/**
 * MCP Tools Registry
 *
 * Centralized registry with metadata, categories, and discovery capabilities.
 *
 * @module lib-mcp-server/registry
 */

import { allTools, toolsList, toolCategories } from './tools';
import type { McpTool } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface ToolMetadata {
  name: string;
  description: string;
  category: ToolCategory;
  subcategory?: string;
  requiredContext?: ('userId' | 'athleteId' | 'planId' | 'programId')[];
  requiresAuth: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
  sideEffects: 'none' | 'read' | 'write' | 'delete';
  tags: string[];
}

export type ToolCategory =
  | 'food'
  | 'exercise'
  | 'workout'
  | 'nutrition'
  | 'athlete'
  | 'oneagenda'
  | 'marketplace'
  | 'analytics'
  | 'chat'
  | 'settings'
  | 'admin'
  | 'body_measurements';

export interface ToolRegistryEntry {
  tool: McpTool;
  metadata: ToolMetadata;
}

// ============================================================================
// METADATA DEFINITIONS
// ============================================================================

const toolMetadataMap: Record<string, Partial<ToolMetadata>> = {
  // ===== NUTRITION TOOLS =====
  nutrition_generate_plan: {
    category: 'nutrition',
    subcategory: 'plan',
    requiredContext: ['userId', 'athleteId'],
    complexity: 'complex',
    sideEffects: 'write',
    tags: ['ai', 'generation', 'calories', 'macros', 'flexible', 'ai-driven'],
    description:
      'Generates nutrition plan structure. AI autonomously determines BMR/TDEE calculations, macro distribution, meal timing, and food selection based on profile and goals. No prescriptive methodologies enforced.',
  },
  nutrition_get_plan: {
    category: 'nutrition',
    subcategory: 'plan',
    requiredContext: ['planId'],
    complexity: 'simple',
    sideEffects: 'read',
    tags: ['query'],
  },
  nutrition_list_plans: {
    category: 'nutrition',
    subcategory: 'plan',
    requiredContext: ['athleteId'],
    complexity: 'simple',
    sideEffects: 'read',
    tags: ['list', 'query'],
  },
  nutrition_update_plan: {
    category: 'nutrition',
    subcategory: 'plan',
    requiredContext: ['planId'],
    complexity: 'moderate',
    sideEffects: 'write',
    tags: ['update'],
  },
  nutrition_delete_plan: {
    category: 'nutrition',
    subcategory: 'plan',
    requiredContext: ['planId'],
    complexity: 'simple',
    sideEffects: 'delete',
    tags: ['delete'],
  },
  nutrition_duplicate_plan: {
    category: 'nutrition',
    subcategory: 'plan',
    requiredContext: ['planId'],
    complexity: 'moderate',
    sideEffects: 'write',
    tags: ['copy', 'duplicate'],
  },
  nutrition_add_meal: {
    category: 'nutrition',
    subcategory: 'meal',
    requiredContext: ['planId'],
    complexity: 'moderate',
    sideEffects: 'write',
    tags: ['create', 'meal'],
  },
  nutrition_log_intake: {
    category: 'nutrition',
    subcategory: 'tracking',
    requiredContext: ['userId'],
    complexity: 'moderate',
    sideEffects: 'write',
    tags: ['tracking', 'log'],
  },
  nutrition_get_adherence_report: {
    category: 'nutrition',
    subcategory: 'tracking',
    requiredContext: ['userId', 'planId'],
    complexity: 'moderate',
    sideEffects: 'read',
    tags: ['analytics', 'report'],
  },
  nutrition_calculate_macros: {
    category: 'nutrition',
    subcategory: 'calculation',
    complexity: 'simple',
    sideEffects: 'none',
    tags: ['calculation', 'macros', 'tdee'],
  },

  // ===== WORKOUT TOOLS =====
  workout_generate_program: {
    category: 'workout',
    subcategory: 'program',
    requiredContext: ['userId', 'athleteId'],
    complexity: 'complex',
    sideEffects: 'write',
    tags: ['ai', 'generation', 'periodization', 'flexible', 'ai-driven'],
    description:
      'Generates workout program structure. AI autonomously decides on split type, volume, intensity, progression strategies, and exercise selection. No prescriptive training methodologies enforced - AI uses its knowledge to determine optimal approach.',
  },
  workout_get_program: {
    category: 'workout',
    subcategory: 'program',
    requiredContext: ['programId'],
    complexity: 'simple',
    sideEffects: 'read',
    tags: ['query'],
  },
  workout_add_exercise_to_day: {
    category: 'workout',
    subcategory: 'exercise',
    requiredContext: ['programId'],
    complexity: 'moderate',
    sideEffects: 'write',
    tags: ['add', 'exercise'],
  },
  workout_search_exercises: {
    category: 'workout',
    subcategory: 'exercise',
    complexity: 'simple',
    sideEffects: 'read',
    tags: ['search', 'library'],
  },

  // ===== ATHLETE TOOLS =====
  athlete_list: {
    category: 'athlete',
    subcategory: 'management',
    requiredContext: ['userId'],
    complexity: 'simple',
    sideEffects: 'read',
    tags: ['list', 'query'],
  },
  athlete_get_profile: {
    category: 'athlete',
    subcategory: 'profile',
    requiredContext: ['athleteId'],
    complexity: 'simple',
    sideEffects: 'read',
    tags: ['query', 'profile'],
  },
  athlete_update_profile: {
    category: 'athlete',
    subcategory: 'profile',
    requiredContext: ['athleteId'],
    complexity: 'moderate',
    sideEffects: 'write',
    tags: ['update', 'profile'],
  },
  athlete_set_max: {
    category: 'athlete',
    subcategory: 'performance',
    requiredContext: ['athleteId'],
    complexity: 'moderate',
    sideEffects: 'write',
    tags: ['1rm', 'strength', 'tracking'],
  },
  athlete_get_progress: {
    category: 'athlete',
    subcategory: 'analytics',
    requiredContext: ['athleteId'],
    complexity: 'moderate',
    sideEffects: 'read',
    tags: ['analytics', 'progress', 'report'],
  },
  athlete_assign_plan: {
    category: 'athlete',
    subcategory: 'management',
    requiredContext: ['athleteId'],
    complexity: 'moderate',
    sideEffects: 'write',
    tags: ['assignment', 'plan'],
  },

  // ===== MARKETPLACE TOOLS =====
  marketplace_list_products: {
    category: 'marketplace',
    subcategory: 'products',
    complexity: 'simple',
    sideEffects: 'read',
    tags: ['list', 'query', 'products'],
  },
  marketplace_create_product: {
    category: 'marketplace',
    subcategory: 'products',
    requiredContext: ['userId'],
    complexity: 'moderate',
    sideEffects: 'write',
    tags: ['create', 'product'],
  },
  marketplace_list_orders: {
    category: 'marketplace',
    subcategory: 'orders',
    requiredContext: ['userId'],
    complexity: 'simple',
    sideEffects: 'read',
    tags: ['list', 'orders'],
  },
  affiliate_get_stats: {
    category: 'marketplace',
    subcategory: 'affiliate',
    requiredContext: ['userId'],
    complexity: 'moderate',
    sideEffects: 'read',
    tags: ['analytics', 'affiliate', 'revenue'],
  },
  affiliate_get_links: {
    category: 'marketplace',
    subcategory: 'affiliate',
    requiredContext: ['userId'],
    complexity: 'simple',
    sideEffects: 'read',
    tags: ['affiliate', 'referral'],
  },

  // ===== ANALYTICS TOOLS =====
  analytics_athlete_overview: {
    category: 'analytics',
    subcategory: 'athlete',
    requiredContext: ['athleteId'],
    complexity: 'complex',
    sideEffects: 'read',
    tags: ['overview', 'comprehensive', 'report'],
  },
  analytics_workout_progress: {
    category: 'analytics',
    subcategory: 'workout',
    requiredContext: ['athleteId'],
    complexity: 'moderate',
    sideEffects: 'read',
    tags: ['progress', 'workout', 'charts'],
  },
  analytics_coach_dashboard: {
    category: 'analytics',
    subcategory: 'coach',
    requiredContext: ['userId'],
    complexity: 'complex',
    sideEffects: 'read',
    tags: ['dashboard', 'overview', 'kpi'],
  },
  analytics_revenue: {
    category: 'analytics',
    subcategory: 'business',
    requiredContext: ['userId'],
    complexity: 'moderate',
    sideEffects: 'read',
    tags: ['revenue', 'business', 'financial'],
  },
  analytics_engagement: {
    category: 'analytics',
    subcategory: 'engagement',
    requiredContext: ['userId'],
    complexity: 'moderate',
    sideEffects: 'read',
    tags: ['engagement', 'activity', 'retention'],
  },
  analytics_goal_projection: {
    category: 'analytics',
    subcategory: 'prediction',
    requiredContext: ['athleteId'],
    complexity: 'complex',
    sideEffects: 'read',
    tags: ['prediction', 'ai', 'goals'],
  },

  // ===== BODY MEASUREMENTS TOOLS =====
  body_measurements_list: {
    category: 'body_measurements',
    subcategory: 'crud',
    requiredContext: ['userId'],
    complexity: 'simple',
    sideEffects: 'read',
    tags: ['list', 'history'],
  },
  body_measurements_create: {
    category: 'body_measurements',
    subcategory: 'crud',
    requiredContext: ['userId'],
    complexity: 'moderate',
    sideEffects: 'write',
    tags: ['create', 'log'],
  },
  body_measurements_update: {
    category: 'body_measurements',
    subcategory: 'crud',
    requiredContext: ['userId'],
    complexity: 'moderate',
    sideEffects: 'write',
    tags: ['update'],
  },
  body_measurements_delete: {
    category: 'body_measurements',
    subcategory: 'crud',
    requiredContext: ['userId'],
    complexity: 'simple',
    sideEffects: 'delete',
    tags: ['delete'],
  },
  body_measurements_import: {
    category: 'body_measurements',
    subcategory: 'import',
    requiredContext: ['userId'],
    complexity: 'complex',
    sideEffects: 'write',
    tags: ['import', 'ai', 'vision', 'pdf', 'csv'],
    description: 'Imports measurements from files (PDF, Images, CSV) using AI extraction.',
  },
  body_measurements_analyze: {
    category: 'body_measurements',
    subcategory: 'analytics',
    requiredContext: ['userId'],
    complexity: 'moderate',
    sideEffects: 'read',
    tags: ['analytics', 'trends', 'bmi'],
  },
  body_measurements_compare: {
    category: 'body_measurements',
    subcategory: 'analytics',
    requiredContext: ['userId'],
    complexity: 'moderate',
    sideEffects: 'read',
    tags: ['comparison', 'diff'],
  },
};

// ============================================================================
// REGISTRY CLASS
// ============================================================================

class ToolRegistry {
  private tools: Map<string, ToolRegistryEntry> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize() {
    for (const tool of toolsList) {
      const customMeta = toolMetadataMap[tool.name] || {};

      const metadata: ToolMetadata = {
        name: tool.name,
        description: tool.description,
        category: customMeta.category || this.inferCategory(tool.name),
        subcategory: customMeta.subcategory,
        requiredContext: customMeta.requiredContext || [],
        requiresAuth: true, // Default to requiring auth
        complexity: customMeta.complexity || 'moderate',
        sideEffects: customMeta.sideEffects || 'read',
        tags: customMeta.tags || [],
      };

      this.tools.set(tool.name, { tool, metadata });
    }
  }

  private inferCategory(toolName: string): ToolCategory {
    const prefixMap: Record<string, ToolCategory> = {
      nutrition_: 'nutrition',
      workout_: 'workout',
      exercise_: 'exercise',
      food_: 'food',
      athlete_: 'athlete',
      oneagenda_: 'oneagenda',
      marketplace_: 'marketplace',
      affiliate_: 'marketplace',
      analytics_: 'analytics',
      body_measurements_: 'body_measurements',
    };

    for (const [prefix, category] of Object.entries(prefixMap)) {
      if (toolName.startsWith(prefix)) {
        return category;
      }
    }

    return 'admin';
  }

  // ===== PUBLIC API =====

  /**
   * Get a tool by name
   */
  get(name: string): ToolRegistryEntry | undefined {
    return this.tools.get(name);
  }

  /**
   * Get tool metadata only
   */
  getMetadata(name: string): ToolMetadata | undefined {
    return this.tools.get(name)?.metadata;
  }

  /**
   * Get all tools
   */
  getAll(): ToolRegistryEntry[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get all tool names
   */
  getNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Filter tools by category
   */
  getByCategory(category: ToolCategory): ToolRegistryEntry[] {
    return this.getAll().filter((entry: any) => entry.metadata.category === category);
  }

  /**
   * Filter tools by tag
   */
  getByTag(tag: string): ToolRegistryEntry[] {
    return this.getAll().filter((entry: any) => entry.metadata.tags.includes(tag));
  }

  /**
   * Filter tools by complexity
   */
  getByComplexity(complexity: ToolMetadata['complexity']): ToolRegistryEntry[] {
    return this.getAll().filter((entry: any) => entry.metadata.complexity === complexity);
  }

  /**
   * Filter tools by side effects
   */
  getBySideEffects(sideEffects: ToolMetadata['sideEffects']): ToolRegistryEntry[] {
    return this.getAll().filter((entry: any) => entry.metadata.sideEffects === sideEffects);
  }

  /**
   * Search tools by query (name, description, tags)
   */
  search(query: string): ToolRegistryEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(
      (entry: ToolRegistryEntry) =>
        entry.metadata.name.toLowerCase().includes(lowerQuery) ||
        entry.metadata.description.toLowerCase().includes(lowerQuery) ||
        entry.metadata.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get tools suitable for a given context
   */
  getForContext(context: {
    userId?: string;
    athleteId?: string;
    planId?: string;
    programId?: string;
  }): ToolRegistryEntry[] {
    return this.getAll().filter((entry: ToolRegistryEntry) => {
      const required = entry.metadata.requiredContext || [];
      return required.every((key: string) => {
        switch (key) {
          case 'userId':
            return !!context.userId;
          case 'athleteId':
            return !!context.athleteId;
          case 'planId':
            return !!context.planId;
          case 'programId':
            return !!context.programId;
          default:
            return true;
        }
      });
    });
  }

  /**
   * Get summary of all tools by category
   */
  getSummary(): Record<ToolCategory, { count: number; tools: string[] }> {
    const summary: Partial<Record<ToolCategory, { count: number; tools: string[] }>> = {};

    for (const entry of this.getAll()) {
      const cat = entry.metadata.category;
      if (!summary[cat]) {
        summary[cat] = { count: 0, tools: [] };
      }
      summary[cat]!.count++;
      summary[cat]!.tools.push(entry.metadata.name);
    }

    return summary as Record<ToolCategory, { count: number; tools: string[] }>;
  }

  /**
   * Get statistics
   */
  getStats() {
    const all = this.getAll();
    return {
      total: all.length,
      byCategory: Object.entries(this.getSummary()).map(([cat, data]) => ({
        category: cat,
        count: data.count,
      })),
      byComplexity: {
        simple: all.filter((e: any) => e.metadata.complexity === 'simple').length,
        moderate: all.filter((e: any) => e.metadata.complexity === 'moderate').length,
        complex: all.filter((e: any) => e.metadata.complexity === 'complex').length,
      },
      bySideEffects: {
        none: all.filter((e: any) => e.metadata.sideEffects === 'none').length,
        read: all.filter((e: any) => e.metadata.sideEffects === 'read').length,
        write: all.filter((e: any) => e.metadata.sideEffects === 'write').length,
        delete: all.filter((e: any) => e.metadata.sideEffects === 'delete').length,
      },
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const toolRegistry = new ToolRegistry();

// Re-export for convenience
export { allTools, toolsList, toolCategories };
