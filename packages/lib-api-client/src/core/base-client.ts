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
  ResponseConfig,
} from './types';
import { ApiError } from './types';

export abstract class BaseApiClient {
  protected baseUrl: string;
  protected requestInterceptors: RequestInterceptor[] = [];
  protected responseInterceptors: ResponseInterceptor[] = [];

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || this.getDefaultBaseUrl();
  }

  protected abstract getDefaultBaseUrl(): string;
  protected abstract getAuthToken(): Promise<string | null>;
  protected abstract saveAuthToken(token: string): Promise<void>;

  use(interceptor: RequestInterceptor | ResponseInterceptor): this {
    if ('onRequest' in interceptor) {
      this.requestInterceptors.push(interceptor);
    } else {
      this.responseInterceptors.push(interceptor);
    }
    return this;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  protected buildConfig(endpoint: string, options: RequestOptions = {}): RequestConfig {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    return {
      url,
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      skipAuth: options.skipAuth,
    };
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    let config = this.buildConfig(endpoint, options);

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      config = await interceptor.onRequest(config);
    }

    // Add auth token if not skipped
    if (!config.skipAuth) {
      const token = await this.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body,
      });

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      // Check Content-Type to determine how to parse response
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      let responseData: T;

      if (isJson) {
        try {
          responseData = (await response.json()) as T;
        } catch (jsonError: unknown) {
          // If JSON parsing fails, try to read as text for better error message
          const text = await response.text();
          throw new ApiError(
            `Invalid JSON response: ${text.substring(0, 100)}`,
            response.status,
            { raw: text },
            config
          );
        }
      } else {
        // For non-JSON responses, read as text
        const text = await response.text();

        // If response is not ok, throw error with text content
        if (!response.ok) {
          throw new ApiError(
            `API Error: ${response.statusText}. Response: ${text.substring(0, 200)}`,
            response.status,
            { raw: text },
            config
          );
        }

        // If response is ok but not JSON, try to parse as JSON anyway
        // (some APIs return JSON without proper Content-Type)
        try {
          responseData = JSON.parse(text) as T;
        } catch (_error: unknown) {
          // If parsing fails, return text as data
          responseData = text as T;
        }
      }

      const responseConfig: ResponseConfig<T> = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };

      // Apply response interceptors
      let finalResponse = responseConfig;
      for (const interceptor of this.responseInterceptors) {
        finalResponse = await interceptor.onResponse(finalResponse);
      }

      if (!response.ok) {
        throw new ApiError(
          String((finalResponse.data as Record<string, unknown>)?.error ||
            (finalResponse.data as Record<string, unknown>)?.message ||
            `API Error: ${response.statusText}`),
          response.status,
          finalResponse.data,
          config
        );
      }

      return finalResponse.data as T;
    } catch (error: unknown) {
      // Apply error interceptors
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onError) {
          try {
            return await interceptor.onError(error as ApiError) as T;
          } catch (e: unknown) {
            // If interceptor doesn't handle it, continue to next
          }
        }
      }

      // Re-throw if not handled
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0,
        undefined,
        config
      );
    }
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  patch<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}
