import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Pagination query parameters DTO.
 * 
 * Used for paginated endpoints to accept page and limit query parameters.
 * Provides validation and type transformation for pagination values.
 * 
 * **Features:**
 * - Automatic type transformation (string to number)
 * - Validation (min/max constraints)
 * - Default values (page: 1, limit: 10)
 * - Maximum limit enforcement (100 items per page)
 * 
 * **Validation Rules:**
 * - `page`: Must be an integer >= 1 (default: 1)
 * - `limit`: Must be an integer between 1 and 100 (default: 10)
 * 
 * **Usage:**
 * This DTO is used with the `@Query()` decorator in NestJS controllers.
 * The ValidationPipe automatically validates and transforms query parameters.
 * 
 * @example
 * ```typescript
 * @Get('users')
 * async getUsers(@Query() pagination: PaginationDto) {
 *   return this.usersService.findAll(pagination);
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Request: GET /api/v1/users?page=2&limit=20
 * // pagination.page = 2 (automatically converted to number)
 * // pagination.limit = 20 (automatically converted to number)
 * 
 * // Request: GET /api/v1/users (no query params)
 * // pagination.page = 1 (default)
 * // pagination.limit = 10 (default)
 * 
 * // Request: GET /api/v1/users?page=0&limit=200
 * // Validation fails: page must be >= 1, limit must be <= 100
 * ```
 * 
 * @example
 * ```typescript
 * // With filters
 * @Get('ads')
 * async getAds(
 *   @Query() pagination: PaginationDto,
 *   @Query('status') status?: string
 * ) {
 *   return this.adsService.findAll(pagination, { status });
 * }
 * ```
 * 
 * @see {@link https://docs.nestjs.com/techniques/validation | NestJS Validation}
 * @see {@link PaginatedResult} For the response structure
 */
export class PaginationDto {
    /**
     * Page number (1-indexed).
     * 
     * Represents the current page number in offset-based pagination.
     * Pages are numbered starting from 1 (not 0).
     * 
     * **Validation:**
     * - Must be an integer
     * - Minimum value: 1
     * - Automatically converted from string to number
     * 
     * **Default:** 1 (first page)
     * 
     * @example 1
     * @example 2
     * @example 10
     */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    /**
     * Number of items per page.
     * 
     * Specifies how many items should be returned in each page.
     * This value is enforced to prevent excessive data retrieval
     * and ensure consistent API performance.
     * 
     * **Validation:**
     * - Must be an integer
     * - Minimum value: 1
     * - Maximum value: 100 (enforced to prevent performance issues)
     * - Automatically converted from string to number
     * 
     * **Default:** 10 items per page
     * 
     * **Performance Note:**
     * Larger limits increase response time and memory usage.
     * For large datasets (>10,000 records), consider using
     * page token-based pagination instead.
     * 
     * @example 10
     * @example 20
     * @example 50
     * @example 100 (maximum)
     */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;
}