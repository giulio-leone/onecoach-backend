/**
 * Logging Interceptor
 *
 * Interceptor per logging di richieste e risposte (solo in development)
 */
import type {
  RequestInterceptor,
  ResponseInterceptor,
  RequestConfig,
  ResponseConfig,
} from '../core/types';
export declare class LoggingInterceptor implements RequestInterceptor, ResponseInterceptor {
  onRequest(config: RequestConfig): Promise<RequestConfig>;
  onResponse<T>(response: ResponseConfig<T>): Promise<ResponseConfig<T>>;
}
//# sourceMappingURL=logging.interceptor.d.ts.map
