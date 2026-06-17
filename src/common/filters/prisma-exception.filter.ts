import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

/**
 * Standardized Prisma error response interface.
 * 
 * Matches the success response format from TransformInterceptor for consistency.
 */
interface PrismaErrorResponse {
  statusCode: number;
  success: boolean;
  message: string;
  error: {
    code: string;
    details?: any;
  } | null;
  meta: {
    timestamp: string;
    path: string;
  };
}

/**
 * Exception filter for Prisma database errors.
 * 
 * Converts Prisma-specific errors to user-friendly HTTP responses with
 * appropriate status codes and error messages.
 * 
 * Handled Error Codes:
 * - P2000: Value too long → 400 Bad Request
 * - P2001: Record does not exist → 404 Not Found
 * - P2002: Unique constraint violation → 409 Conflict
 * - P2003: Foreign key constraint violation → 400 Bad Request
 * - P2011: Null constraint violation → 400 Bad Request
 * - P2012: Missing required value → 400 Bad Request
 * - P2014: Required relation violation → 400 Bad Request
 * - P2015: Record not found for operation → 404 Not Found
 * - P2016: Query interpretation error → 400 Bad Request
 * - P2017: Records for relation not connected → 400 Bad Request
 * - P2018: Required connected records not found → 404 Not Found
 * - P2019: Input error → 400 Bad Request
 * - P2020: Value out of range → 400 Bad Request
 * - P2021: Table does not exist → 500 Internal Server Error
 * - P2022: Column does not exist → 500 Internal Server Error
 * - P2023: Inconsistent column data → 500 Internal Server Error
 * - P2024: Connection pool timeout → 503 Service Unavailable
 * - P2025: Record not found → 404 Not Found
 * - P2026: Unsupported database feature → 400 Bad Request
 * - P2027: Multiple errors → 400 Bad Request
 * - Default: Unhandled Prisma errors → Delegates to base filter
 * 
 * Features:
 * - User-friendly error messages
 * - Proper HTTP status code mapping
 * - Field name formatting (snake_case → readable format)
 * - Detailed error logging
 * - Standardized error response format
 * 
 * @see https://www.prisma.io/docs/reference/api-reference/error-reference
 * 
 * @example
 * ```typescript
 * // Prisma Error: Unique constraint on email
 * // Response: {
 * //   statusCode: 409,
 * //   success: false,
 * //   message: 'A record with this email already exists.',
 * //   error: { code: 'UNIQUE_CONSTRAINT_VIOLATION', details: { fields: ['email'] } },
 * //   meta: { timestamp: '...', path: '/api/v1/users' }
 * // }
 * ```
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  /**
   * Catches and handles Prisma database errors.
   * 
   * @param exception - The Prisma error that was thrown
   * @param host - Arguments host containing request/response context
   */
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const timestamp = new Date().toISOString();
    const path = request.url;

    switch (exception.code) {
      case 'P2000': {
        // Value too long for column type
        const status = HttpStatus.BAD_REQUEST;
        const column = exception.meta?.column_name as string;
        const message = column
          ? `The provided value is too long for the ${this.formatFieldName(column)} field.`
          : 'The provided value is too long for the field.';

        this.logger.warn(
          `[${request.method}] ${path} - Value too long for column: ${column || 'unknown'}`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'VALUE_TOO_LONG',
            details: column ? { column } : undefined,
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2001': {
        // Record does not exist (query filter)
        const status = HttpStatus.NOT_FOUND;
        const message = 'The requested record was not found.';

        this.logger.warn(`[${request.method}] ${path} - Record does not exist`);

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'RECORD_DOES_NOT_EXIST',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2002': {
        // Unique constraint violation
        const status = HttpStatus.CONFLICT;
        const fields = (exception.meta?.target as string[]) || [];
        const fieldNames = fields.map((f) => this.formatFieldName(f)).join(', ');
        const message = fields.length > 0
          ? `A record with this ${fieldNames} already exists.`
          : 'A record with these values already exists.';

        this.logger.warn(
          `[${request.method}] ${path} - Unique constraint violation on: ${fields.join(', ')}`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'UNIQUE_CONSTRAINT_VIOLATION',
            details: { fields },
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2003': {
        // Foreign key constraint violation
        const status = HttpStatus.BAD_REQUEST;
        const field = exception.meta?.field_name as string;
        const message = field
          ? `Invalid reference: the related ${this.formatFieldName(field)} does not exist.`
          : 'Invalid reference: the related record does not exist.';

        this.logger.warn(
          `[${request.method}] ${path} - Foreign key constraint violation`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
            details: field ? { field } : undefined,
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2011': {
        // Null constraint violation
        const status = HttpStatus.BAD_REQUEST;
        const field = exception.meta?.field_name as string;
        const message = field
          ? `The ${this.formatFieldName(field)} field cannot be null.`
          : 'A required field cannot be null.';

        this.logger.warn(
          `[${request.method}] ${path} - Null constraint violation on: ${field || 'unknown'}`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'NULL_CONSTRAINT_VIOLATION',
            details: field ? { field } : undefined,
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2012': {
        // Missing required value
        const status = HttpStatus.BAD_REQUEST;
        const field = exception.meta?.field_name as string;
        const message = field
          ? `The ${this.formatFieldName(field)} field is required.`
          : 'A required value is missing.';

        this.logger.warn(
          `[${request.method}] ${path} - Missing required value: ${field || 'unknown'}`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'MISSING_REQUIRED_VALUE',
            details: field ? { field } : undefined,
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2014': {
        // Required relation violation
        const status = HttpStatus.BAD_REQUEST;
        const message = 'The operation would violate a required relation.';

        this.logger.warn(
          `[${request.method}] ${path} - Required relation violation`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'REQUIRED_RELATION_VIOLATION',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2015': {
        // Record not found for update/delete operation
        const status = HttpStatus.NOT_FOUND;
        const message = 'The record to update or delete was not found.';

        this.logger.warn(
          `[${request.method}] ${path} - Record not found for operation`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'RECORD_NOT_FOUND_FOR_OPERATION',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2016': {
        // Query interpretation error
        const status = HttpStatus.BAD_REQUEST;
        const message = 'Invalid query parameters. Please check your request.';

        this.logger.warn(
          `[${request.method}] ${path} - Query interpretation error`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'QUERY_INTERPRETATION_ERROR',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2017': {
        // Records for relation not connected
        const status = HttpStatus.BAD_REQUEST;
        const message = 'The records for this relation are not connected.';

        this.logger.warn(
          `[${request.method}] ${path} - Records for relation not connected`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'RELATION_NOT_CONNECTED',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2018': {
        // Required connected records not found
        const status = HttpStatus.NOT_FOUND;
        const message = 'Required connected records were not found.';

        this.logger.warn(
          `[${request.method}] ${path} - Required connected records not found`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'REQUIRED_CONNECTED_RECORDS_NOT_FOUND',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2019': {
        // Input error
        const status = HttpStatus.BAD_REQUEST;
        const message = 'Invalid input provided. Please check your request data.';

        this.logger.warn(
          `[${request.method}] ${path} - Input error`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'INPUT_ERROR',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2020': {
        // Value out of range
        const status = HttpStatus.BAD_REQUEST;
        const field = exception.meta?.field_name as string;
        const message = field
          ? `The provided value for ${this.formatFieldName(field)} is out of range.`
          : 'The provided value is out of range.';

        this.logger.warn(
          `[${request.method}] ${path} - Value out of range: ${field || 'unknown'}`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'VALUE_OUT_OF_RANGE',
            details: field ? { field } : undefined,
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2021': {
        // Table does not exist
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        const table = exception.meta?.table_name as string;
        const message = table
          ? `Database table "${table}" does not exist.`
          : 'Database table does not exist.';

        this.logger.error(
          `[${request.method}] ${path} - Table does not exist: ${table || 'unknown'}`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'TABLE_DOES_NOT_EXIST',
            details: table ? { table } : undefined,
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2022': {
        // Column does not exist
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        const column = exception.meta?.column_name as string;
        const message = column
          ? `Database column "${column}" does not exist.`
          : 'Database column does not exist.';

        this.logger.error(
          `[${request.method}] ${path} - Column does not exist: ${column || 'unknown'}`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'COLUMN_DOES_NOT_EXIST',
            details: column ? { column } : undefined,
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2023': {
        // Inconsistent column data
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        const message = 'Inconsistent column data detected.';

        this.logger.error(
          `[${request.method}] ${path} - Inconsistent column data`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'INCONSISTENT_COLUMN_DATA',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2024': {
        // Timed out fetching a new connection from the connection pool
        const status = HttpStatus.SERVICE_UNAVAILABLE;
        const message = 'Database connection timeout. Please try again later.';

        this.logger.error(
          `[${request.method}] ${path} - Connection pool timeout`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'CONNECTION_POOL_TIMEOUT',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2025': {
        // Record not found
        const status = HttpStatus.NOT_FOUND;
        const message = 'The requested record was not found.';

        this.logger.warn(`[${request.method}] ${path} - Record not found`);

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'RECORD_NOT_FOUND',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2026': {
        // Unsupported database feature
        const status = HttpStatus.BAD_REQUEST;
        const message = 'This database feature is not supported.';

        this.logger.warn(
          `[${request.method}] ${path} - Unsupported database feature`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'UNSUPPORTED_DATABASE_FEATURE',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2027': {
        // Multiple errors occurred
        const status = HttpStatus.BAD_REQUEST;
        const errors = exception.meta?.errors as any[] || [];
        const message = 'Multiple errors occurred while processing your request.';

        this.logger.warn(
          `[${request.method}] ${path} - Multiple errors: ${errors.length} errors`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'MULTIPLE_ERRORS',
            details: { errors },
          },
          meta: { timestamp, path },
        });
        break;
      }

      default:
        // Log unhandled Prisma errors
        this.logger.error(
          `[${request.method}] ${path} - Unhandled Prisma error: ${exception.code}`,
          exception.stack,
        );
        super.catch(exception, host);
        break;
    }
  }

  /**
   * Sends a standardized JSON error response.
   * 
   * @param response - Express response object
   * @param body - Error response body
   */
  private sendResponse(response: Response, body: PrismaErrorResponse): void {
    response.status(body.statusCode).json(body);
  }

  /**
   * Formats database field names to human-readable format.
   * 
   * Converts snake_case and camelCase field names to readable text.
   * 
   * @param field - Database field name (e.g., "email_address", "userId")
   * @returns Human-readable field name (e.g., "email address", "user ID")
   * 
   * @example
   * ```typescript
   * formatFieldName('email_address') // Returns "email address"
   * formatFieldName('userId') // Returns "user id"
   * formatFieldName('first_name') // Returns "first name"
   * ```
   */
  private formatFieldName(field: string): string {
    return field
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase();
  }
}