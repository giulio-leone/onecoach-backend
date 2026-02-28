import { ZodError } from 'zod';
import type { McpErrorResponse, McpSuccessResponse, McpTextChunk } from '../types';

/**
 * MCP Error Handler
 *
 * Centralized error handling for MCP tool execution.
 * Follows DRY principle and provides consistent error formatting.
 */

const DEFAULT_ERROR_CODE = -32001; // Custom server error (JSON-RPC compatible)

function toChunk(text: string): McpTextChunk {
  return { type: 'text', text };
}

function serializeError(error: unknown): { message: string; code?: number } {
  if (error instanceof ZodError) {
    const issues = error.issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`);
    return {
      message: `Parametri non validi: ${issues.join('; ')}`,
      code: -32602, // Invalid params (JSON-RPC)
    };
  }

  if (error instanceof Error) {
    if (error.message.toLowerCase().includes('unauthorized')) {
      return { message: error.message, code: -32000 };
    }
    return { message: error.message, code: DEFAULT_ERROR_CODE };
  }

  return { message: String(error), code: DEFAULT_ERROR_CODE };
}

/**
 * Formats error as MCP-compatible response
 */
export function formatMcpError(error: unknown): McpErrorResponse {
  const normalized = serializeError(error);

  return {
    content: [
      toChunk(JSON.stringify({ error: true, message: normalized.message, code: normalized.code })),
    ],
    isError: true,
    code: normalized.code,
    message: normalized.message,
  };
}

/**
 * Formats success result as MCP-compatible response
 */
export function formatMcpSuccess<T>(result: T): McpSuccessResponse<T> {
  return {
    content: [toChunk(JSON.stringify(result, null, 2))],
    data: result,
    isError: false,
  };
}
