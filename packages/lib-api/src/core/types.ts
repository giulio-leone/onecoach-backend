/**
 * API Client Types
 */

export interface RequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  body?: string;
  skipAuth?: boolean;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  skipAuth?: boolean;
}

export interface ResponseConfig<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface RequestInterceptor {
  onRequest(config: RequestConfig): Promise<RequestConfig> | RequestConfig;
}

export interface ResponseInterceptor {
  onResponse<T>(response: ResponseConfig<T>): Promise<ResponseConfig<T>> | ResponseConfig<T>;
  onError?(error: ApiError): Promise<unknown> | unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
    public config?: RequestConfig
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
