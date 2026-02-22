/**
 * Error Handler Core - Cross-Platform Interfaces
 *
 * Re-exports from lib-shared for backwards compatibility.
 * The actual implementation now lives in @giulio-leone/lib-shared/core-types
 * to avoid cyclic dependencies.
 */

export type {
  ApiErrorResponse,
  ApiResponse,
  CreateErrorResponseParams,
  ErrorCode,
  HttpStatus,
} from '@giulio-leone/lib-shared/core-types';

export {
  createErrorResponseObject,
  createApiResponseObject,
  ERROR_CODES,
  HTTP_STATUS,
} from '@giulio-leone/lib-shared/core-types';

