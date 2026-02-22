/**
 * Streaming Handler Utility
 *
 * Utility condivisa per endpoint streaming SSE:
 * - Autenticazione
 * - Validazione request
 * - ReadableStream setup
 * - Event sending
 * - Error handling
 * - SSE headers
 *
 * Principi: KISS, SOLID (Single Responsibility), DRY
 */

import { NextRequest } from 'next/server';
import type { AgentRole, AgentError } from '../types/agent.types';
import { requireAdmin } from '@giulio-leone/lib-core';

/**
 * Tipo per eventi stream
 */
export type StreamEvent =
  | {
      type: 'agent_start';
      data: {
        role: string;
        description: string;
      };
    }
  | {
      type: 'agent_progress';
      data: {
        progress: number;
        message: string;
      };
    }
  | {
      type: 'agent_complete';
      data: {
        role: string;
        duration?: number;
      };
    }
  | {
      type: 'agent_error';
      data: {
        role: string;
        error: AgentError;
        retrying: boolean;
      };
    }
  | {
      type: 'complete';
      data: {
        output: unknown;
      };
    };

/**
 * Configurazione per streaming handler
 */
export interface StreamingHandlerConfig<TInput, TOutput> {
  /** Agent role per eventi */
  agentRole: AgentRole | string;
  /** Descrizione iniziale */
  initialDescription: string;
  /** Funzione per validare request body */
  validateRequest: (body: unknown) => { valid: boolean; error?: string; data?: TInput };
  /** Funzione per eseguire generazione e inviare eventi */
  executeGeneration: (params: {
    input: TInput;
    userId: string;
    sendEvent: (event: StreamEvent) => void;
  }) => Promise<TOutput>;
  /** Funzione per costruire output finale */
  buildOutput: (result: TOutput) => unknown;
}

/**
 * Crea handler per endpoint streaming SSE
 *
 * @param config Configurazione handler
 * @returns Handler function per Next.js route
 */
export function createStreamingHandler<TInput, TOutput>(
  config: StreamingHandlerConfig<TInput, TOutput>
) {
  return async function handler(request: NextRequest): Promise<Response> {
    try {
      // Authenticate admin
      const adminOrError = await requireAdmin();
      if (adminOrError instanceof Response) {
        return adminOrError;
      }

      // Parse and validate request body
      const body = await request.json();
      const validation = config.validateRequest(body);

      if (!validation.valid || !validation.data) {
        return new Response(
          JSON.stringify({
            error: 'Invalid request',
            details: validation.error || 'Invalid request body',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Create readable stream for SSE
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          const buildAgentError = (error: unknown, code: string): AgentError => ({
            message: error instanceof Error ? error.message : 'Unknown error',
            code,
            details: error,
            recoverable: false,
          });

          // Helper to send SSE message
          const sendEvent = (event: StreamEvent) => {
            const message = JSON.stringify(event);
            controller.enqueue(encoder.encode(`data: ${message}\n\n`));
          };

          try {
            // Send start event
            sendEvent({
              type: 'agent_start',
              data: {
                role: config.agentRole,
                description: config.initialDescription,
              },
            });

            // Execute generation
            if (!validation.data) {
              sendEvent({
                type: 'agent_error',
                data: {
                  role: config.agentRole,
                  error: buildAgentError(new Error('Invalid input'), 'VALIDATION_ERROR'),
                  retrying: false,
                },
              });
              return;
            }
            const result = await config.executeGeneration({
              input: validation.data,
              userId: adminOrError.id,
              sendEvent,
            });

            // Send complete event
            sendEvent({
              type: 'agent_complete',
              data: {
                role: config.agentRole,
              },
            });

            // Send final output
            sendEvent({
              type: 'complete',
              data: {
                output: config.buildOutput(result),
              },
            });
          } catch (error: unknown) {
            // Send error event
            const agentError = buildAgentError(error, 'GENERATION_ERROR');
            sendEvent({
              type: 'agent_error',
              data: {
                role: config.agentRole,
                error: agentError,
                retrying: false,
              },
            });
          } finally {
            // Close stream
            controller.close();
          }
        },
      });

      // Return SSE response
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no', // Disable buffering in nginx
        },
      });
    } catch (error: unknown) {
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}
