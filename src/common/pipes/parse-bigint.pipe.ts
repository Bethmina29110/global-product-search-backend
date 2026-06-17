import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

/**
 * Transforms string parameters to BigInt values.
 * 
 * This pipe validates and transforms string route parameters (typically IDs) into BigInt values.
 * It is designed for use with Prisma models that use BigInt for primary keys and foreign keys.
 * 
 * **Validation Rules:**
 * - Input must be a non-empty string
 * - Must contain only numeric digits (0-9) - no decimals, signs, or whitespace
 * - Must represent a non-negative integer (>= 0)
 * - Must be convertible to BigInt without overflow
 * - Whitespace is automatically trimmed before validation
 * 
 * **Error Handling:**
 * - Provides descriptive error messages including the parameter name
 * - Throws `BadRequestException` (400 status) for all validation failures
 * - Error messages are user-friendly and include the invalid value
 * 
 * **Use Cases:**
 * - Route parameters representing database IDs (users/:id, ads/:id)
 * - Query parameters that need BigInt conversion
 * - Path parameters in nested routes
 * 
 * **BigInt Considerations:**
 * - BigInt can represent arbitrarily large integers (unlike Number)
 * - No maximum value validation is performed (supports very large IDs)
 * - Negative numbers are rejected (IDs should be positive)
 * - Leading/trailing whitespace is automatically trimmed
 * 
 * @example
 * ```typescript
 * // Basic usage with route parameter
 * @Get('users/:id')
 * async getUser(@Param('id', ParseBigIntPipe) id: bigint) {
 *   return this.usersService.findOne(id);
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Usage with nested routes
 * @Delete('ads/:adId/reviews/:reviewId')
 * async deleteReview(
 *   @Param('adId', ParseBigIntPipe) adId: bigint,
 *   @Param('reviewId', ParseBigIntPipe) reviewId: bigint,
 * ) {
 *   return this.reviewsService.delete(adId, reviewId);
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Usage with query parameter (if needed)
 * @Get('conversations')
 * async getConversations(
 *   @Query('userId', ParseBigIntPipe) userId: bigint,
 * ) {
 *   return this.conversationsService.findByUser(userId);
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Error responses
 * // Invalid: "abc" → 400 Bad Request
 * // Error: "Invalid id: \"abc\" is not a valid ID. Expected a numeric value."
 * 
 * // Invalid: "-123" → 400 Bad Request  
 * // Error: "Invalid id: ID must be a positive number."
 * 
 * // Invalid: "123.45" → 400 Bad Request
 * // Error: "Invalid id: \"123.45\" is not a valid ID. Expected a numeric value."
 * 
 * // Valid: "12345678901234567890" → BigInt(12345678901234567890n)
 * ```
 * 
 * @throws {BadRequestException} When:
 * - Value is not a string or is empty
 * - Value contains non-numeric characters
 * - Value represents a negative number
 * - Value cannot be converted to BigInt
 * 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt | MDN: BigInt}
 * @see {@link https://docs.nestjs.com/pipes | NestJS Pipes Documentation}
 */
@Injectable()
export class ParseBigIntPipe implements PipeTransform<string, bigint> {
  /**
   * Transforms a string parameter to a BigInt value.
   * 
   * Performs comprehensive validation before conversion:
   * 1. Validates input is a non-empty string
   * 2. Validates format contains only digits (after trimming)
   * 3. Converts to BigInt
   * 4. Validates result is non-negative
   * 
   * @param value - String value from route parameter, query parameter, or request body
   * @param metadata - Argument metadata containing parameter name and type information
   * @returns BigInt value representing the validated and converted input
   * @throws {BadRequestException} If validation fails at any step
   * 
   * @example
   * ```typescript
   * // Input: "123"
   * // Output: 123n (BigInt)
   * 
   * // Input: "  456  "
   * // Output: 456n (BigInt, whitespace trimmed)
   * 
   * // Input: "abc"
   * // Throws: BadRequestException
   * ```
   */
  transform(value: string, metadata: ArgumentMetadata): bigint {
    const paramName = metadata.data || metadata.type || 'parameter';
    
    // Validate input is a string
    if (!value || typeof value !== 'string') {
      throw new BadRequestException(
        `Invalid ${paramName}: "${value}" is not a valid string.`
      );
    }

    // Validate format (only digits)
    if (!/^\d+$/.test(value.trim())) {
      throw new BadRequestException(
        `Invalid ${paramName}: "${value}" is not a valid ID. Expected a numeric value.`
      );
    }

    try {
      const result = BigInt(value.trim());

      // Validate positive number
      if (result < 0n) {
        throw new BadRequestException(
          `Invalid ${paramName}: ID must be a positive number.`
        );
      }

      return result;
    } catch (error) {
      // Re-throw BadRequestException as-is
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Handle BigInt conversion errors
      throw new BadRequestException(
        `Invalid ${paramName}: "${value}" cannot be converted to a valid ID.`
      );
    }
  }
}
