import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

/**
 * Standardized error response interface.
 * 
 * Matches the success response format from TransformInterceptor for consistency.
 * All error responses follow this structure.
 */
export interface ErrorResponse {
  /** HTTP status code */
  statusCode: number;
  /** Always false for error responses */
  success: boolean;
  /** Human-readable error message */
  message: string;
  /** Error details with code and optional details */
  error: {
    /** Error code (e.g., 'VALIDATION_ERROR', 'BAD_REQUEST') */
    code?: string;
    /** Additional error details (e.g., validation errors array) */
    details?: any;
  } | null;
  /** Response metadata */
  meta: {
    /** ISO timestamp of the error */
    timestamp: string;
    /** Request path where error occurred */
    path: string;
  };
}

/**
 * Global exception filter that catches all unhandled exceptions.
 * 
 * Provides standardized error response format matching TransformInterceptor.
 * This filter handles:
 * - HTTP exceptions (BadRequestException, NotFoundException, etc.)
 * - Validation errors from class-validator
 * - Unhandled errors (converts to 500 Internal Server Error)
 * - Maps HTTP status codes to error codes
 * - Logs errors appropriately (error level for 5xx, warn for 4xx)
 * 
 * Features:
 * - Consistent error format across all endpoints
 * - Proper error logging with stack traces for server errors
 * - User-friendly error messages
 * - Error code mapping for client error handling
 * 
 * @example
 * ```typescript
 * // Thrown: new BadRequestException('Invalid input')
 * // Response: {
 * //   statusCode: 400,
 * //   success: false,
 * //   message: 'Invalid input',
 * //   error: { code: 'BAD_REQUEST' },
 * //   meta: { timestamp: '...', path: '/api/v1/users' }
 * // }
 * ```
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  /**
   * Catches and handles all exceptions.
   * 
   * @param exception - The exception that was thrown
   * @param host - Arguments host containing request/response context
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract error details from exception
    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal Server Error';

    // Parse message and error details
    let message: string;
    let errorDetails: { code?: string; details?: any } | null = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      const response = exceptionResponse as any;
      message = response.message || response.error || 'An error occurred';

      // Handle validation errors (class-validator)
      if (Array.isArray(response.message)) {
        message = 'Validation failed';
        errorDetails = {
          code: 'VALIDATION_ERROR',
          details: response.message,
        };
      } else if (response.error) {
        // Include error code/type if available
        errorDetails = {
          code: this.getErrorCode(httpStatus, response.error),
        };
      }
    } else {
      message = 'An error occurred';
    }

    // Log server errors with stack trace
    if (httpStatus === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (httpStatus >= 400) {
      // Log client errors at warn level for security monitoring
      this.logger.warn(
        `[${request.method}] ${request.url} - ${httpStatus} - ${message}`,
      );
    }

    // Build standardized response matching TransformInterceptor format
    const responseBody: ErrorResponse = {
      statusCode: httpStatus,
      success: false,
      message: message,
      error: errorDetails,
      meta: {
        timestamp: new Date().toISOString(),
        path: httpAdapter.getRequestUrl(request),
      },
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }

  /**
   * Maps HTTP status code and error type to a standardized error code.
   * 
   * Converts HTTP status codes and error types to uppercase error codes
   * for consistent client-side error handling.
   * 
   * @param status - HTTP status code
   * @param errorType - Optional error type string (e.g., "Bad Request")
   * @returns Standardized error code (e.g., "BAD_REQUEST")
   * 
   * @example
   * ```typescript
   * getErrorCode(400, "Bad Request") // Returns "BAD_REQUEST"
   * getErrorCode(404) // Returns "NOT_FOUND"
   * getErrorCode(500) // Returns "INTERNAL_SERVER_ERROR"
   * ```
   */
  /**
   * Maps HTTP status code and error type to a standardized error code.
   * 
   * Converts HTTP status codes and error types to uppercase error codes
   * for consistent client-side error handling. Includes comprehensive
   * mapping for all standard HTTP status codes.
   * 
   * @param status - HTTP status code
   * @param errorType - Optional error type string (e.g., "Bad Request")
   * @returns Standardized error code (e.g., "BAD_REQUEST")
   * 
   * @example
   * ```typescript
   * getErrorCode(400, "Bad Request") // Returns "BAD_REQUEST"
   * getErrorCode(404) // Returns "NOT_FOUND"
   * getErrorCode(500) // Returns "INTERNAL_SERVER_ERROR"
   * getErrorCode(405) // Returns "METHOD_NOT_ALLOWED"
   * ```
   */
  private getErrorCode(status: number, errorType?: string): string {
    if (errorType) {
      // Convert "Bad Request" to "BAD_REQUEST"
      return errorType.toUpperCase().replace(/\s+/g, '_');
    }

    // Comprehensive HTTP status code mapping
    const statusCodeMap: Record<number, string> = {
      // 4xx Client Errors
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      402: 'PAYMENT_REQUIRED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      406: 'NOT_ACCEPTABLE',
      407: 'PROXY_AUTHENTICATION_REQUIRED',
      408: 'REQUEST_TIMEOUT',
      409: 'CONFLICT',
      410: 'GONE',
      411: 'LENGTH_REQUIRED',
      412: 'PRECONDITION_FAILED',
      413: 'PAYLOAD_TOO_LARGE',
      414: 'URI_TOO_LONG',
      415: 'UNSUPPORTED_MEDIA_TYPE',
      416: 'RANGE_NOT_SATISFIABLE',
      417: 'EXPECTATION_FAILED',
      418: "I'M_A_TEAPOT",
      421: 'MISDIRECTED_REQUEST',
      422: 'UNPROCESSABLE_ENTITY',
      423: 'LOCKED',
      424: 'FAILED_DEPENDENCY',
      425: 'TOO_EARLY',
      426: 'UPGRADE_REQUIRED',
      428: 'PRECONDITION_REQUIRED',
      429: 'TOO_MANY_REQUESTS',
      431: 'REQUEST_HEADER_FIELDS_TOO_LARGE',
      451: 'UNAVAILABLE_FOR_LEGAL_REASONS',

      // 5xx Server Errors
      500: 'INTERNAL_SERVER_ERROR',
      501: 'NOT_IMPLEMENTED',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
      505: 'HTTP_VERSION_NOT_SUPPORTED',
      506: 'VARIANT_ALSO_NEGOTIATES',
      507: 'INSUFFICIENT_STORAGE',
      508: 'LOOP_DETECTED',
      510: 'NOT_EXTENDED',
      511: 'NETWORK_AUTHENTICATION_REQUIRED',
    };

    return statusCodeMap[status] || 'UNKNOWN_ERROR';
  }
}