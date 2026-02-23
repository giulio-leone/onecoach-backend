/**
 * Auth Interceptor
 *
 * Interceptor per aggiungere automaticamente il token di autenticazione
 */
import type { RequestInterceptor, RequestConfig } from '../core/types';
export declare class AuthInterceptor implements RequestInterceptor {
  private getToken;
  constructor(getToken: () => Promise<string | null>);
  onRequest(config: RequestConfig): Promise<RequestConfig>;
}
//# sourceMappingURL=auth.interceptor.d.ts.map
