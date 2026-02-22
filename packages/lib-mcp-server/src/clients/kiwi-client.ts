/**
 * Kiwi MCP Client
 *
 * Client per comunicare con il server MCP esterno di Kiwi.com.
 * Usa il protocollo MCP standard su trasporto SSE.
 * 
 * ARCHITETTURA: Ogni chiamata a callTool() crea una connessione dedicata
 * per evitare race condition in ricerche parallele.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { logger } from '@giulio-leone/lib-shared';

/**
 * Rappresenta una connessione MCP isolata
 */
interface McpConnection {
  client: Client;
  transport: SSEClientTransport;
}

export class KiwiMcpClient {
  private static instance: KiwiMcpClient | null = null;

  private constructor() {}

  /**
   * Ottiene l'istanza singleton del client (stateless, no shared connection)
   */
  public static getInstance(): KiwiMcpClient {
    if (!KiwiMcpClient.instance) {
      KiwiMcpClient.instance = new KiwiMcpClient();
    }
    return KiwiMcpClient.instance;
  }

  /**
   * Crea una nuova connessione dedicata per una singola operazione
   */
  private async createConnection(): Promise<McpConnection> {
    const transport = new SSEClientTransport(new URL("https://mcp.kiwi.com"));
    const client = new Client(
      { name: "onecoach-flight-agent", version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(transport);
    
    if (process.env.NODE_ENV === 'development') {
      logger.warn("✈️ [Kiwi MCP] Connesso con successo a Kiwi.com");
    }

    return { client, transport };
  }

  /**
   * Chiude una connessione specifica
   */
  private async closeConnection(conn: McpConnection | null): Promise<void> {
    if (conn?.transport) {
      try {
        await conn.transport.close();
      } catch (e) {
        // Ignora errori di chiusura (connessione già chiusa)
      }
    }
  }

  /**
   * Esegue un tool sul server Kiwi con retry logic.
   * Ogni chiamata usa una connessione isolata per evitare race condition.
   */
  public async callTool<T = any>(name: string, args: Record<string, any>, maxRetries = 2): Promise<T> {
    let lastError: Error | null = null;
    let conn: McpConnection | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          logger.warn(`🔄 [Kiwi MCP] Retry ${attempt}/${maxRetries} per ${name}`);
        }
        
        // Crea connessione dedicata per questo tentativo
        conn = await this.createConnection();

        const response = await conn.client.callTool({
          name,
          arguments: args,
        });
        
        // Chiudi connessione dopo successo
        await this.closeConnection(conn);
        
        return response as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.error(`❌ [Kiwi MCP] Errore tentativo ${attempt + 1} per ${name}:`, {
          error: lastError.message,
          attempt: attempt + 1,
          maxRetries,
        });
        
        // Chiudi connessione fallita
        await this.closeConnection(conn);
        conn = null;
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    
    throw lastError ?? new Error(`Failed to call ${name} after ${maxRetries + 1} attempts`);
  }


  /**
   * Lista i tools disponibili sul server Kiwi.
   * Crea una connessione temporanea per l'operazione.
   */
  public async listTools() {
    const conn = await this.createConnection();
    try {
      return await conn.client.listTools();
    } finally {
      await this.closeConnection(conn);
    }
  }

}
