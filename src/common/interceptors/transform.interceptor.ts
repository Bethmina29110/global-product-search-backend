import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

/**
 * Standardized API response format.
 * 
 * All successful API responses follow this structure for consistency.
 * 
 * @template T - Type of the data payload
 */
export interface Response<T> {
  /** HTTP status code */
  statusCode: number;
  /** Whether the request was successful (2xx status codes) */
  success: boolean;
  /** Success or error message */
  message: string;
  /** Response data payload (null if only message is returned) */
  data: T;
  /** Response metadata */
  meta?: {
    /** ISO timestamp of the response */
    timestamp: string;
    /** Request path */
    path: string;
  };
}

/**
 * Response transformation interceptor.
 * 
 * Standardizes all API responses to a consistent format. This interceptor:
 * - Wraps all responses in a standardized structure
 * - Extracts custom messages from service responses or @ResponseMessage decorator
 * - Adds timestamp and path metadata
 * - Handles empty data responses (when only message is returned)
 * 
 * Response Format:
 * ```typescript
 * {
 *   statusCode: number,
 *   success: boolean,
 *   message: string,
 *   data: T | null,
 *   meta: {
 *     timestamp: string,
 *     path: string
 *   }
 * }
 * ```
 * 
 * @template T - Type of the response data
 * 
 * @example
 * ```typescript
 * // Service returns: { message: 'User created', id: '123' }
 * // Response: { statusCode: 201, success: true, message: 'User created', data: { id: '123' }, meta: {...} }
 * 
 * // Service returns: { message: 'Operation successful' }
 * // Response: { statusCode: 200, success: true, message: 'Operation successful', data: null, meta: {...} }
 * 
 * // Service returns: { id: '123', name: 'John' }
 * // Response: { statusCode: 200, success: true, message: 'Success', data: { id: '123', name: 'John' }, meta: {...} }
 * ```
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  constructor(private reflector: Reflector) {}

  /**
   * Intercepts the response and transforms it to the standard format.
   * 
   * @param context - Execution context containing request/response
   * @param next - Call handler for the next interceptor or route handler
   * @returns Observable of the transformed response
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Check for custom message from @ResponseMessage decorator
    const customMessage = this.reflector.getAllAndOverride<string>(
      RESPONSE_MESSAGE_KEY,
      [context.getHandler(), context.getClass()],
    );

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode || 200;
        let message = customMessage || 'Success';
        let finalData = data;

        // Extract message from service response if no custom message is set
        if (!customMessage && data && typeof data === 'object' && !Array.isArray(data)) {
          if ('message' in data) {
            message = data.message;
            const { message: extractedMsg, ...rest } = data;
            // If only message exists, set data to null
            if (Object.keys(rest).length === 0) {
              finalData = null;
            } else {
              finalData = rest;
            }
          }
        }

        return {
          statusCode,
          success: statusCode >= 200 && statusCode < 300,
          message: message,
          data: finalData,
          meta: {
            timestamp: new Date().toISOString(),
            path: request.url,
          },
        };
      }),
    );
  }
}