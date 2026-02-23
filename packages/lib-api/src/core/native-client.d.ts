/**
 * Native API Client
 *
 * Implementazione native di BaseApiClient per React Native con refresh token
 */
import { BaseApiClient } from './base-client';
import type { RequestOptions } from './types';
export declare class NativeApiClient extends BaseApiClient {
  private refreshPromise;
  protected getDefaultBaseUrl(): string;
  protected getAuthToken(): Promise<string | null>;
  protected saveAuthToken(_token: string): Promise<void>;
  /**
   * Refresh access token using refresh token
   * Prevents multiple simultaneous refresh requests
   */
  private refreshAccessToken;
  request<T>(endpoint: string, options?: RequestOptions): Promise<T>;
}
//# sourceMappingURL=native-client.d.ts.map
