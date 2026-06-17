import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min, IsString } from 'class-validator';

/**
 * Page token-based pagination query parameters DTO.
 * 
 * Implements Google AIP-158 standard for token-based pagination, which is more efficient
 * than offset-based pagination for large datasets. Page token pagination doesn't require
 * scanning skipped records, making it ideal for large datasets.
 * 
 * **Industry Standard (Google AIP-158):**
 * - Uses `page_token` parameter (instead of `cursor`)
 * - Uses `next_page_token` in response (instead of `nextCursor`)
 * - Follows REST API best practices
 * 
 * **When to use page token pagination:**
 * - Large datasets (>10,000 records)
 * - Real-time data that changes frequently
 * - When you need consistent results even if data is added/removed during pagination
 * - When performance is critical
 * 
 * **How it works:**
 * - First request: Omit `page_token`, returns first `limit` items
 * - Subsequent requests: Use `page_token` from previous response's `next_page_token`
 * - Continue until `next_page_token` is null
 * 
 * @example
 * ```typescript
 * @Get('users')
 * async getUsers(@Query() pagination: PageTokenPaginationDto) {
 *   return this.usersService.findAll(pagination);
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // First request: GET /api/v1/users?limit=20
 * // Response: { data: [...], meta: { next_page_token: "123", hasMore: true } }
 * 
 * // Next request: GET /api/v1/users?limit=20&page_token=123
 * // Response: { data: [...], meta: { next_page_token: "456", hasMore: true } }
 * 
 * // Last request: GET /api/v1/users?limit=20&page_token=456
 * // Response: { data: [...], meta: { next_page_token: null, hasMore: false } }
 * ```
 * 
 * @see {@link https://aip.dev/158 | Google AIP-158: Pagination}
 */
export class PageTokenPaginationDto {
    /**
     * Number of items to return per page.
     * 
     * @default 10
     * @minimum 1
     * @maximum 100
     * 
     * @example 10
     * @example 50
     */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    /**
     * Page token for pagination (typically the ID of the last item from previous page).
     * 
     * Omit for the first page. Use the `next_page_token` value from the previous response
     * to fetch the next page.
     * 
     * Follows Google AIP-158 standard naming convention.
     * 
     * @default undefined
     * 
     * @example "123"
     * @example "550e8400-e29b-41d4-a716-446655440000"
     */
    @IsOptional()
    @IsString()
    page_token?: string;
}
