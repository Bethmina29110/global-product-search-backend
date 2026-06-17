import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID middleware.
 * 
 * Generates or extracts a unique request ID for request tracing and correlation.
 * This middleware:
 * - Extracts X-Request-ID from request headers if present and valid
 * - Validates header format, length, and character restrictions
 * - Generates a UUID v4 if no header is provided or header is invalid
 * - Attaches the request ID to the request object (req.requestId)
 * - Sets X-Request-ID response header for client correlation
 * - Logs warnings for invalid headers (security monitoring)
 * 
 * The request ID is used throughout the application for:
 * - Logging and log correlation
 * - Error tracking and debugging
 * - Request tracing across services
 * - Performance monitoring
 * 
 * Header Validation Rules:
 * - Maximum length: 128 characters (configurable)
 * - Allowed characters: alphanumeric, hyphens (-), underscores (_), dots (.)
 * - Must not be empty after trimming
 * - Invalid headers are rejected and a new UUID is generated
 * 
 * @example
 * ```typescript
 * // Valid request header: X-Request-ID: abc-123-def-456
 * // Response header: X-Request-ID: abc-123-def-456
 * // Request object: req.requestId = "abc-123-def-456"
 * 
 * // Invalid header (contains special chars): X-Request-ID: <script>alert('xss')</script>
 * // Generates new UUID: X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
 * // Logs warning about invalid header
 * 
 * // No header provided:
 * // Generates: X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
 * ```
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
    private readonly logger = new Logger(RequestIdMiddleware.name);
    
    /** Maximum length for request ID header (prevents DoS attacks) */
    private readonly MAX_REQUEST_ID_LENGTH = 128;
    
    /** Regular expression for valid request ID characters (alphanumeric, hyphens, underscores, dots) */
    private readonly VALID_REQUEST_ID_PATTERN = /^[a-zA-Z0-9._-]+$/;

    /**
     * Validates the request ID header format and content.
     * 
     * @param headerId - The header value to validate
     * @returns true if valid, false otherwise
     */
    private isValidRequestId(headerId: string): boolean {
        // Check length
        if (headerId.length > this.MAX_REQUEST_ID_LENGTH) {
            return false;
        }

        // Check character pattern (alphanumeric, hyphens, underscores, dots only)
        if (!this.VALID_REQUEST_ID_PATTERN.test(headerId)) {
            return false;
        }

        return true;
    }

    /**
     * Processes the request to add or extract request ID.
     * 
     * Validates incoming X-Request-ID headers for security and format compliance.
     * Invalid headers are rejected and a new UUID is generated, with a warning logged.
     * 
     * @param req - Express request object
     * @param res - Express response object
     * @param next - Express next function
     */
    use(req: Request, res: Response, next: NextFunction): void {
        const headerId = req.headers['x-request-id'];
        let requestId: string;

        // Check if header is provided and is a string
        if (headerId && typeof headerId === 'string') {
            const trimmedId = headerId.trim();
            
            // Validate header if not empty
            if (trimmedId.length > 0) {
                if (this.isValidRequestId(trimmedId)) {
                    // Valid header - use it
                    requestId = trimmedId;
                } else {
                    // Invalid header - log warning and generate new UUID
                    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
                    const url = req.url || req.originalUrl || 'unknown';
                    
                    this.logger.warn(
                        `Invalid X-Request-ID header rejected - IP: ${ip}, URL: ${url}, ` +
                        `Header value: "${headerId.substring(0, 50)}${headerId.length > 50 ? '...' : ''}" ` +
                        `(length: ${headerId.length}, contains invalid characters or exceeds max length)`
                    );
                    
                    requestId = uuidv4();
                }
            } else {
                // Empty header after trimming - generate new UUID
                requestId = uuidv4();
            }
        } else {
            // No header provided or not a string - generate new UUID
            requestId = uuidv4();
        }
        
        // Attach to request object for use in controllers/services
        (req as any).requestId = requestId;
        
        // Set response header for client correlation
        res.setHeader('X-Request-ID', requestId);
        
        next();
    }
}