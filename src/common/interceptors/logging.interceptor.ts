import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

/**
 * HTTP request/response logging interceptor.
 * 
 * Logs all HTTP requests with comprehensive information including:
 * - Request details: method, URL, IP address, User-Agent, Request ID
 * - Response details: status code, duration
 * - Error details: error message, stack trace (for server errors)
 * - Performance warnings: slow request detection with configurable thresholds
 * 
 * Log Format:
 * - Request: `[requestId] METHOD URL - IP: xxx - User-Agent: xxx`
 * - Success: `[requestId] METHOD URL STATUS_CODE - DURATIONms`
 * - Slow Warning: `[requestId] SLOW REQUEST: METHOD URL STATUS_CODE - DURATIONms (threshold: XXXms)`
 * - Slow Critical: `[requestId] CRITICAL SLOW REQUEST: METHOD URL STATUS_CODE - DURATIONms (threshold: XXXms)`
 * - Error: `[requestId] METHOD URL STATUS_CODE - DURATIONms - Error: xxx\nStack: xxx`
 * 
 * Features:
 * - Tracks request duration for performance monitoring
 * - Includes Request ID for request tracing
 * - Logs errors with stack traces for debugging
 * - Uses different log levels based on status codes
 * - Configurable slow request thresholds (warning and critical)
 * - Categorizes slow requests by severity
 * 
 * Configuration:
 * - `SLOW_REQUEST_WARNING_THRESHOLD`: Threshold for warning-level slow requests (default: 1000ms)
 * - `SLOW_REQUEST_CRITICAL_THRESHOLD`: Threshold for critical-level slow requests (default: 3000ms)
 * 
 * @example
 * ```typescript
 * // Request log:
 * // [abc-123] GET /api/v1/users - IP: 192.168.1.1 - User-Agent: Mozilla/5.0...
 * 
 * // Success log:
 * // [abc-123] GET /api/v1/users 200 - 45ms
 * 
 * // Slow request warning:
 * // [abc-123] SLOW REQUEST: GET /api/v1/users 200 - 1500ms (threshold: 1000ms)
 * 
 * // Critical slow request:
 * // [abc-123] CRITICAL SLOW REQUEST: POST /api/v1/reports 200 - 4500ms (threshold: 3000ms)
 * 
 * // Error log:
 * // [abc-123] POST /api/v1/users 500 - 120ms - Error: Internal server error\nStack: ...
 * ```
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  private readonly slowRequestWarningThreshold: number;
  private readonly slowRequestCriticalThreshold: number;

  constructor(private readonly configService: ConfigService) {
    this.slowRequestWarningThreshold = this.configService.get<number>(
      'app.performance.slowRequestWarningThreshold',
      1000,
    );
    this.slowRequestCriticalThreshold = this.configService.get<number>(
      'app.performance.slowRequestCriticalThreshold',
      3000,
    );
  }

  /**
   * Intercepts HTTP requests and responses for logging.
   * 
   * @param context - Execution context containing request/response
   * @param next - Call handler for the next interceptor or route handler
   * @returns Observable that logs request/response information
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();
    
    const method = req.method;
    const url = req.originalUrl || req.url;
    const requestId = (req as any).requestId || '-';
    const userAgent = req.headers['user-agent'] || '-';
    const ip = req.ip || req.connection?.remoteAddress || '-';
    const now = Date.now();

    // Log incoming request
    this.logger.log(`[${requestId}] ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent.substring(0, 50)}`);

    return next.handle().pipe(
      tap((data) => {
        const delay = Date.now() - now;
        const statusCode = res.statusCode;
        
        // Categorize slow requests by severity
        if (delay >= this.slowRequestCriticalThreshold) {
          // Critical slow request - log as error for immediate attention
          this.logger.error(
            `[${requestId}] CRITICAL SLOW REQUEST: ${method} ${url} ${statusCode} - ${delay}ms (threshold: ${this.slowRequestCriticalThreshold}ms)`,
          );
        } else if (delay >= this.slowRequestWarningThreshold) {
          // Warning-level slow request - log as warning
          this.logger.warn(
            `[${requestId}] SLOW REQUEST: ${method} ${url} ${statusCode} - ${delay}ms (threshold: ${this.slowRequestWarningThreshold}ms)`,
          );
        } else {
          // Normal request - log as info
          this.logger.log(`[${requestId}] ${method} ${url} ${statusCode} - ${delay}ms`);
        }
      }),
      catchError((error) => {
        const delay = Date.now() - now;
        const statusCode = error.status || res.statusCode || 500;
        
        // Log error response - include stack trace in message to avoid Winston serialization issues
        const errorMessage = error.message || 'Unknown error';
        const stackTrace = error.stack || 'N/A';
        
        // Check if error occurred in a slow request context
        const isSlowRequest = delay >= this.slowRequestWarningThreshold;
        const slowRequestPrefix = isSlowRequest 
          ? delay >= this.slowRequestCriticalThreshold 
            ? 'CRITICAL SLOW REQUEST + ERROR:'
            : 'SLOW REQUEST + ERROR:'
          : '';
        
        // Use different log levels based on status code
        if (statusCode >= 500) {
          // Server errors: log as error with stack trace
          const logMessage = slowRequestPrefix
            ? `[${requestId}] ${slowRequestPrefix} ${method} ${url} ${statusCode} - ${delay}ms - Error: ${errorMessage}\nStack: ${stackTrace}`
            : `[${requestId}] ${method} ${url} ${statusCode} - ${delay}ms - Error: ${errorMessage}\nStack: ${stackTrace}`;
          
          this.logger.error(logMessage);
        } else {
          // Client errors: log as warn (4xx errors)
          const logMessage = slowRequestPrefix
            ? `[${requestId}] ${slowRequestPrefix} ${method} ${url} ${statusCode} - ${delay}ms - Error: ${errorMessage}`
            : `[${requestId}] ${method} ${url} ${statusCode} - ${delay}ms - Error: ${errorMessage}`;
          
          this.logger.warn(logMessage);
        }
        
        return throwError(() => error);
      }),
    );
  }
}