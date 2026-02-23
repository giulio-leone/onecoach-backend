/**
 * Base API Client
 *
 * Classe base astratta per API client cross-platform con supporto interceptors
 */
import type {
  RequestConfig,
  RequestOptions,
  RequestInterceptor,
  ResponseInterceptor,
} from './types';
export declare abstract class BaseApiClient {
  protected baseUrl: string;
  protected requestInterceptors: RequestInterceptor[];
  protected responseInterceptors: ResponseInterceptor[];
  constructor(baseUrl?: string);
  protected abstract getDefaultBaseUrl(): string;
  protected abstract getAuthToken(): Promise<string | null>;
  protected abstract saveAuthToken(token: string): Promise<void>;
  use(interceptor: RequestInterceptor | ResponseInterceptor): this;
  getBaseUrl(): string;
  protected buildConfig(endpoint: string, options?: RequestOptions): RequestConfig;
  request<T>(endpoint: string, options?: RequestOptions): Promise<T>;
  get<T>(endpoint: string, options?: RequestOptions): Promise<T>;
  post<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<T>;
  put<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<T>;
  patch<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<T>;
  delete<T>(endpoint: string, options?: RequestOptions): Promise<T>;
}
//# sourceMappingURL=base-client.d.ts.map
