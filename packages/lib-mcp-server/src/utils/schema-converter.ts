/**
 * Schema Converter Utilities
 *
 * Centralized utilities for converting Zod schemas to MCP-compatible formats.
 * Follows DRY principle to avoid duplication.
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { McpTool } from '../types';

/**
 * Converts Zod schema to JSON Schema for MCP protocol
 */
export function zodToMcpSchema(zodSchema: z.ZodTypeAny): Record<string, unknown> {
  return zodToJsonSchema(zodSchema as unknown as z.ZodType) as Record<string, unknown>;
}

/**
 * Converts tool list to MCP tools format
 */
export function toolsToMcpFormat(tools: McpTool[]): Array<{
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}> {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: zodToMcpSchema(tool.parameters),
  }));
}
