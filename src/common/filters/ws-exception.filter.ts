import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

/**
 * WebSocket error response interface.
 * 
 * Standardized format for WebSocket error responses.
 */
export interface WsErrorResponse {
  /** Always false for error responses */
  success: false;
  /** Error message */
  error: string;
  /** Optional error code */
  code?: string;
  /** ISO timestamp of the error */
  timestamp: string;
}

/**
 * Creates a standardized WebSocket error response.
 * 
 * @param error - Error message
 * @param code - Optional error code
 * @returns Standardized error response object
 */
export const createWsErrorResponse = (error: string, code?: string): WsErrorResponse => ({
  success: false,
  error,
  code,
  timestamp: new Date().toISOString(),
});

/**
 * Exception filter for WebSocket errors.
 * 
 * Provides standardized error responses for WebSocket events. This filter:
 * - Handles WsException instances with custom error codes
 * - Handles generic Error instances
 * - Emits error events to WebSocket clients
 * - Supports acknowledgment callbacks (ack)
 * - Logs errors with stack traces
 * 
 * Features:
 * - Consistent error format for WebSocket clients
 * - Error event emission
 * - Callback acknowledgment support
 * - Comprehensive error logging
 * 
 * @example
 * ```typescript
 * // Thrown: new WsAuthenticationException('Invalid token')
 * // Emits: { success: false, error: 'Invalid token', code: 'AUTH_FAILED', timestamp: '...' }
 * ```
 */
@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  /**
   * Catches and handles WebSocket exceptions.
   * 
   * @param exception - The exception that was thrown
   * @param host - Arguments host containing WebSocket client and data
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();
    const data = host.switchToWs().getData();

    let errorMessage = 'An unexpected error occurred';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof WsException) {
      const exceptionError = exception.getError();
      if (typeof exceptionError === 'string') {
        errorMessage = exceptionError;
        errorCode = 'WS_ERROR';
      } else if (typeof exceptionError === 'object' && exceptionError !== null) {
        errorMessage = (exceptionError as { message?: string }).message || errorMessage;
        errorCode = (exceptionError as { code?: string }).code || errorCode;
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
      errorCode = exception.name || 'ERROR';
    }

    this.logger.error(
      `WebSocket Error [${client.id}]: ${errorMessage}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    client.emit('error', createWsErrorResponse(errorMessage, errorCode));

    if (data && typeof data === 'object' && 'ack' in data && typeof data.ack === 'function') {
      data.ack(createWsErrorResponse(errorMessage, errorCode));
    }
  }
}

/**
 * WebSocket authentication exception.
 * 
 * Thrown when WebSocket authentication fails (invalid token, expired token, etc.).
 */
export class WsAuthenticationException extends WsException {
  constructor(message = 'Authentication failed') {
    super({ message, code: 'AUTH_FAILED' });
  }
}

/**
 * WebSocket authorization exception.
 * 
 * Thrown when a user is not authorized to perform a specific WebSocket action.
 */
export class WsAuthorizationException extends WsException {
  constructor(message = 'Not authorized to perform this action') {
    super({ message, code: 'FORBIDDEN' });
  }
}

/**
 * WebSocket not found exception.
 * 
 * Thrown when a requested resource is not found (conversation, message, etc.).
 */
export class WsNotFoundException extends WsException {
  constructor(resource = 'Resource') {
    super({ message: `${resource} not found`, code: 'NOT_FOUND' });
  }
}

/**
 * WebSocket rate limit exception.
 * 
 * Thrown when a client exceeds the rate limit for WebSocket events.
 */
export class WsRateLimitException extends WsException {
  constructor(retryAfter = 60) {
    super({
      message: `Rate limit exceeded. Retry after ${retryAfter} seconds`,
      code: 'RATE_LIMITED',
      retryAfter,
    });
  }
}

/**
 * WebSocket validation exception.
 * 
 * Thrown when WebSocket event data fails validation.
 */
export class WsValidationException extends WsException {
  constructor(errors: string[]) {
    super({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors,
    });
  }
}

/**
 * WebSocket conversation blocked exception.
 * 
 * Thrown when attempting to send a message to a blocked conversation.
 */
export class WsConversationBlockedException extends WsException {
  constructor() {
    super({ message: 'Conversation is blocked', code: 'CONVERSATION_BLOCKED' });
  }
}



