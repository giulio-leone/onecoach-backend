/**
 * MCP Handler Adapter
 *
 * Adapter per convertire i tool esistenti nel formato server.tool() di mcp-handler.
 * Segue la documentazione ufficiale di Vercel mcp-handler.
 *
 * PRINCIPI:
 * - KISS: Registrazione diretta senza logica complessa
 * - SOLID (SRP): Adapter fa solo conversione, non validazione
 * - DRY: Nessuna duplicazione di logica
 *
 * NOTA: La validazione dei tool è garantita a compile-time da TypeScript.
 * I moduli tool esportano solo oggetti conformi a McpTool.
 *
 * @see https://github.com/vercel/mcp-handler
 */

import type { McpTool, McpContext, McpResponse } from './types';
import { formatMcpSuccess, formatMcpError } from './utils/error-handler';

import { logger } from '@giulio-leone/lib-core';
// Tipo per authInfo secondo la documentazione ufficiale
interface AuthInfo {
  token: string;
  scopes: string[];
  clientId: string;
  extra?: {
    userId?: string;
    isAdmin?: boolean;
    source?: string;
  };
}

/**
 * Estrae il context dall'authInfo passato da withMcpAuth.
 * Segue il pattern documentato: extra.authInfo contiene le info di autenticazione.
 */
function extractContextFromAuthInfo(authInfo?: AuthInfo): McpContext {
  if (authInfo?.extra) {
    return {
      userId: authInfo.extra.userId || 'anonymous',
      isAdmin: authInfo.extra.isAdmin || false,
    };
  }
  return {
    userId: 'anonymous',
    isAdmin: false,
  };
}

/**
 * Registra un tool MCP esistente su un server mcp-handler.
 * L'authInfo viene automaticamente iniettato da withMcpAuth in extra.authInfo.
 *
 * IMPORTANTE: mcp-handler (e l'SDK MCP) si aspetta un ZodRawShape,
 * cioè l'oggetto interno { key: z.type() }, non z.object({...}).
 * Passiamo tool.parameters.shape per estrarre lo shape.
 */
type McpServer = {
  tool: (
    name: string,
    description: string,
    schema: unknown,
    handler: (
      args: unknown,
      extra?: { authInfo?: AuthInfo; signal?: AbortSignal }
    ) => Promise<McpResponse>
  ) => void;
};

export function registerMcpTool(
  server: McpServer,
  tool: McpTool,
  _defaultContext: McpContext // Manteniamo per backward compatibility ma non lo usiamo
): void {
  // Estrai lo shape dallo schema Zod - mcp-handler si aspetta { key: z.type() }, non z.object({...})
  const zodShape = 'shape' in tool.parameters ? tool.parameters.shape : tool.parameters;

  server.tool(
    tool.name,
    tool.description,
    zodShape,
    async (
      args: unknown,
      extra?: { authInfo?: AuthInfo; signal?: AbortSignal }
    ): Promise<McpResponse> => {
      const callId = Math.random().toString(36).substring(7);
      const startTime = Date.now();

      try {
        // Estrai il context dall'authInfo iniettato da withMcpAuth
        const context = extractContextFromAuthInfo(extra?.authInfo);

        if (process.env.NODE_ENV === 'development') {
          logger.warn(`🔧 [MCP] [${callId}] ${tool.name} | User: ${context.userId}`);
        }

        // Gli args arrivano già validati dallo schema Zod passato a server.tool()
        // Ma facciamo comunque una validazione esplicita per sicurezza e per
        // applicare trasformazioni/default definiti nello schema completo
        const parsed = tool.parameters.safeParse(args);
        if (!parsed.success) {
          return formatMcpError(parsed.error);
        }

        // Esegui il tool con il context estratto da authInfo
        const result = await tool.execute(
          parsed.data as Parameters<typeof tool.execute>[0],
          context
        );

        if (process.env.NODE_ENV === 'development') {
          logger.warn(
            `✅ [MCP] [${callId}] ${tool.name} completato in ${Date.now() - startTime}ms`
          );
        }

        return formatMcpSuccess(result);
      } catch (error: unknown) {
        logger.error(`❌ [MCP] [${callId}] ${tool.name} errore:`, error);
        return formatMcpError(error);
      }
    }
  );
}

/**
 * Registra tutti i tool MCP su un server mcp-handler.
 *
 * NOTA: Accetta McpTool[] tipizzato - la conformità è garantita
 * a compile-time. Non serve validazione runtime.
 */
export function registerMcpTools(server: McpServer, tools: McpTool[], defaultContext: McpContext) {
  for (const tool of tools) {
    registerMcpTool(server, tool, defaultContext);
  }
}
