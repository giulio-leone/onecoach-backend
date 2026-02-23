/**
 * Retry Interceptor
 *
 * Interceptor per gestire retry automatico su errori 401 con refresh token
 */
import type { ResponseInterceptor, ApiError, ResponseConfig, RequestConfig } from '../core/types';
export declare class RetryInterceptor implements ResponseInterceptor {
  private refreshToken;
  private retryRequest;
  constructor(
    refreshToken: () => Promise<void>,
    retryRequest: (config: RequestConfig) => Promise<unknown>
  );
  onResponse<T>(response: ResponseConfig<T>): Promise<ResponseConfig<T>>;
  onError(error: ApiError): Promise<unknown>;
}
//# sourceMappingURL=retry.interceptor.d.ts.map
