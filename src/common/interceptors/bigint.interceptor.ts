import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * BigInt serialization interceptor.
 * 
 * Converts BigInt values to strings for JSON serialization, as JavaScript's
 * JSON.stringify() cannot serialize BigInt values natively. This interceptor
 * recursively transforms nested objects and arrays to ensure all BigInt values
 * are converted to strings.
 * 
 * Features:
 * - Recursively transforms nested objects and arrays
 * - Preserves Date objects (not converted)
 * - Handles null and undefined values
 * - Type-safe transformation
 * 
 * @example
 * ```typescript
 * // Input: { id: 123n, user: { id: 456n }, items: [789n, 101112n] }
 * // Output: { id: "123", user: { id: "456" }, items: ["789", "101112"] }
 * 
 * // Input: { id: 123n, createdAt: new Date() }
 * // Output: { id: "123", createdAt: Date object (preserved) }
 * ```
 */
@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  /**
   * Intercepts the response and transforms BigInt values to strings.
   * 
   * @param context - Execution context
   * @param next - Call handler for the next interceptor or route handler
   * @returns Observable with transformed data (BigInt values as strings)
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.transformBigInt(data)),
    );
  }

  /**
   * Recursively transforms BigInt values to strings in the data structure.
   * 
   * @param data - Data to transform (can be any type)
   * @returns Transformed data with BigInt values as strings
   */
  private transformBigInt(data: any): any {
    // Handle null and undefined
    if (data === null || data === undefined) {
      return data;
    }

    // Convert BigInt to string
    if (typeof data === 'bigint') {
      return data.toString();
    }

    // Preserve Date objects
    if (data instanceof Date) {
      return data;
    }

    // Transform arrays recursively
    if (Array.isArray(data)) {
      return data.map((item) => this.transformBigInt(item));
    }

    // Transform objects recursively
    if (typeof data === 'object') {
      // Preserve class instances (except plain objects)
      if (data.constructor && data.constructor !== Object) {
        return data;
      }

      const transformed: any = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          transformed[key] = this.transformBigInt(data[key]);
        }
      }
      return transformed;
    }

    // Return primitive values as-is
    return data;
  }
}