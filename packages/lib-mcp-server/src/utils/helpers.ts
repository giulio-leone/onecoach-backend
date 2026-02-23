/**
 * MCP Tools Shared Helpers
 *
 * Utility functions shared across MCP tools to follow DRY principle.
 * These helpers eliminate code duplication and ensure consistency.
 *
 * PRINCIPI:
 * - KISS: Funzioni semplici e dirette
 * - SOLID (SRP): Ogni helper ha una responsabilità singola
 * - DRY: Elimina duplicazioni comuni
 *
 * @module lib-mcp-server/utils/helpers
 */

import { logger, handleMemoryEvent } from '@giulio-leone/lib-core';
import type { McpSuccessResponse, McpTool } from '../types';

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates if a string is a valid UUID v4
 * Shared utility to avoid duplication across tools
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Creates a standardized MCP text response
 * Eliminates duplication of { content: [{ type: 'text', text: ... }] } pattern
 */
export function createMcpTextResponse(
  text: string,
  data?: Record<string, unknown>
): McpSuccessResponse<Record<string, unknown> | undefined> & Record<string, unknown> {
  const response: McpSuccessResponse<Record<string, unknown> | undefined> &
    Record<string, unknown> = {
    content: [
      {
        type: 'text',
        text,
      },
    ],
    data,
    isError: false,
  };

  if (data) {
    Object.assign(response, data);
  }

  return response;
}

// ============================================================================
// MEMORY HELPERS
// ============================================================================

/**
 * Safely handles memory events with error catching
 * Wrapper to eliminate duplicate try/catch patterns
 */
export async function safeHandleMemoryEvent(
  event: Parameters<typeof handleMemoryEvent>[0]
): Promise<void> {
  try {
    await handleMemoryEvent(event);
  } catch (error: unknown) {
    // Non-blocking: memory update failures shouldn't break tool execution
    logger.warn(`[MCP Helper] Error updating memory for ${event.type}:`, { error });
  }
}

// ============================================================================
// TOOL REGISTRY HELPERS
// ============================================================================

/**
 * Converts an array of MCP tools to a record (name -> tool)
 * Eliminates duplication of Object.fromEntries pattern
 *
 * Uses generic type to preserve tool-specific types while allowing
 * conversion to base McpTool interface
 */
export function arrayToToolRecord<T extends McpTool>(tools: T[]): Record<string, McpTool> {
  return Object.fromEntries(tools.map((tool) => [tool.name, tool])) as Record<string, McpTool>;
}
