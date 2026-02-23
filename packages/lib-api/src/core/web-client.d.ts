/**
 * Web API Client
 *
 * Implementazione web di BaseApiClient per Next.js
 */
import { BaseApiClient } from './base-client';
export declare class WebApiClient extends BaseApiClient {
  protected getDefaultBaseUrl(): string;
  protected getAuthToken(): Promise<string | null>;
  protected saveAuthToken(_token: string): Promise<void>;
}
//# sourceMappingURL=web-client.d.ts.map
