import { z } from 'zod';

/**
 * MCP Context - Extended context for all MCP tools
 *
 * Aligned with McpToolContext from @giulio-leone/lib-stores/copilot.store.ts
 * Contains all contextual information needed for MCP tool execution
 */
export interface McpContext {
  // User/Role context
  userId?: string;
  coachId?: string;
  athleteId?: string;
  clientId?: string; // Alias for athleteId
  isAdmin?: boolean;

  // Domain context (which area of the app)
  domain?:
    | 'nutrition'
    | 'workout'
    | 'exercise'
    | 'athlete'
    | 'oneagenda'
    | 'marketplace'
    | 'analytics'
    | 'chat'
    | 'settings'
    | 'admin'
    | null;

  // Route metadata
  route?: string;
  locale?: string;

  // Domain-specific context
  nutrition?: {
    planId?: string | null;
    dayNumber?: number | null;
    mealIndex?: number | null;
    athleteId?: string | null;
    totalDays?: number | null;
  };

  workout?: {
    programId?: string | null;
    weekNumber?: number | null;
    dayNumber?: number | null;
    exerciseIndex?: number | null;
    setGroupIndex?: number | null;
    athleteId?: string | null;
    totalWeeks?: number | null;
  };

  exercise?: {
    exerciseId?: string | null;
    categoryFilter?: string | null;
    muscleGroupFilter?: string | null;
    searchQuery?: string | null;
  };

  oneAgenda?: {
    projectId?: string | null;
    taskId?: string | null;
    milestoneId?: string | null;
    habitId?: string | null;
  };

  marketplace?: {
    productId?: string | null;
    categoryId?: string | null;
    affiliateCode?: string | null;
    orderId?: string | null;
  };

  analytics?: {
    athleteId?: string | null;
    dateRange?: { start: string; end: string } | null;
    metricType?: 'nutrition' | 'workout' | 'progress' | 'all' | null;
  };
}

export type McpTextChunk = { type: 'text'; text: string };

type ResolveInput<T> = unknown extends T ? any : T;

export interface McpSuccessResponse<T = unknown> {
  content: McpTextChunk[];
  /**
   * Payload originale da restituire a monte (utile lato server)
   */
  data?: T;
  isError?: false;
}

export interface McpErrorResponse {
  content: McpTextChunk[];
  isError: true;
  code?: number;
  message?: string;
}

export type McpResponse<T = unknown> = McpSuccessResponse<T> | McpErrorResponse;

export type McpHandler<TSchema extends z.ZodTypeAny, TResult> = (
  args: ResolveInput<z.infer<TSchema>>,
  context: McpContext,
  signal?: AbortSignal
) => Promise<TResult>;

export interface McpTool<
  TInput = unknown,
  TOutput = unknown,
  TSchema extends z.ZodType<TInput> = z.ZodType<TInput>,
> {
  name: string;
  description: string;
  parameters: TSchema;
  execute: (args: ResolveInput<z.infer<TSchema>>, context: McpContext) => Promise<TOutput>;
}

export interface BatchResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  id?: string;
}

/**
 * Helper per estrarre userId effettivo dal contesto
 * Priorità: athleteId > clientId > userId
 */
export function getEffectiveUserId(context: McpContext): string | undefined {
  return context.athleteId || context.clientId || context.userId;
}

/**
 * Helper per verificare se il contesto ha un dominio specifico
 */
export function isDomain(context: McpContext, domain: McpContext['domain']): boolean {
  return context.domain === domain;
}

/**
 * Helper per ottenere il contesto del dominio corrente
 */
export function getDomainContext(
  context: McpContext
): McpContext['nutrition'] | McpContext['workout'] | McpContext['exercise'] | null {
  switch (context.domain) {
    case 'nutrition':
      return context.nutrition ?? null;
    case 'workout':
      return context.workout ?? null;
    case 'exercise':
      return context.exercise ?? null;
    default:
      return null;
  }
}
