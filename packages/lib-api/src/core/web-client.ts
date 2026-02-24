/**
 * Web API Client
 *
 * Implementazione web di BaseApiClient per Next.js
 */

import { BaseApiClient } from './base-client';

export class WebApiClient extends BaseApiClient {
  protected getDefaultBaseUrl(): string {
    // Browser context - use window.location.origin
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }

    // Server-side context (MCP server, SSR, etc.) - use environment variables
    // Check for common Next.js/Vercel environment variables
    const vercelUrl = process.env.VERCEL_URL;
    const nextPublicUrl = process.env.NEXT_PUBLIC_APP_URL;
    const appUrl = process.env.APP_URL;
    const mcpApiUrl = process.env.MCP_API_BASE_URL;

    if (mcpApiUrl) {
      return mcpApiUrl;
    }
    if (nextPublicUrl) {
      return nextPublicUrl;
    }
    if (appUrl) {
      return appUrl;
    }
    if (vercelUrl) {
      // VERCEL_URL doesn't include protocol
      return `https://${vercelUrl}`;
    }

    // Fallback to localhost for local development
    return 'http://localhost:3000';
  }

  protected async getAuthToken(): Promise<string | null> {
    // NextAuth handles auth via cookies, no token needed
    return null;
  }

  protected async saveAuthToken(_token: string): Promise<void> {
    // Not used in web - NextAuth handles this
  }
}
