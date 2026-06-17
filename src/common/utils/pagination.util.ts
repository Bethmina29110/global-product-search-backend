import { PaginationDto } from '../dto/pagination.dto';
import { PageTokenPaginationDto } from '../dto/page-token-pagination.dto';
import { PaginatedResult } from '../interfaces/paginated-result.interface';
import { PageTokenPaginatedResult } from '../interfaces/page-token-paginated-result.interface';

/**
 * Paginates Prisma model queries using offset-based pagination.
 * 
 * This utility function provides a standardized way to paginate database queries.
 * It uses offset-based pagination (skip/take), which is efficient for small to
 * medium datasets. For large datasets (>10,000 records), consider implementing
 * page token-based pagination (Google AIP-158 standard) for better performance.
 * 
 * Features:
 * - Parallel query execution (findMany and count run simultaneously)
 * - Standardized pagination metadata
 * - Type-safe generic implementation
 * - Supports all Prisma query options (where, orderBy, select, include, etc.)
 * 
 * @template T - Type of items in the paginated result
 * 
 * @param model - Prisma model delegate with findMany and count methods
 * @param paginationDto - Pagination parameters (page, limit)
 * @param args - Additional Prisma query arguments (where, orderBy, select, include, etc.)
 * 
 * @returns Paginated result with data array and metadata
 * 
 * @example
 * ```typescript
 * // Basic pagination
 * const result = await paginate(
 *   this.prisma.user,
 *   { page: 1, limit: 10 }
 * );
 * 
 * // With filters and ordering
 * const result = await paginate(
 *   this.prisma.ad,
 *   { page: 2, limit: 20 },
 *   {
 *     where: { status: 'ACTIVE' },
 *     orderBy: { createdAt: 'desc' },
 *     include: { user: true, category: true }
 *   }
 * );
 * 
 * // Response format:
 * // {
 * //   data: [...],
 * //   meta: {
 * //     total: 100,
 * //     lastPage: 5,
 * //     currentPage: 2,
 * //     perPage: 20,
 * //     prev: 1,
 * //     next: 3
 * //   }
 * // }
 * ```
 * 
 * @note For large datasets, consider page token-based pagination:
 * ```typescript
 * // Page token pagination example (Google AIP-158 standard)
 * const result = await paginatePageToken(
 *   this.prisma.user,
 *   { limit: 10, page_token: '123' },
 *   { orderBy: { id: 'asc' } },
 *   'id'
 * );
 * ```
 */
export async function paginate<T>(
    model: {
        findMany: (args: any) => Promise<T[]>;
        count: (args: any) => Promise<number>;
    },
    paginationDto: PaginationDto,
    args: any = {},
): Promise<PaginatedResult<T>> {
    // Normalize pagination parameters
    const page = Math.max(1, Number(paginationDto.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(paginationDto.limit) || 10));
    const skip = (page - 1) * limit;

    // Execute queries in parallel for better performance
    const [data, total] = await Promise.all([
        model.findMany({
            ...args,
            skip,
            take: limit,
        }),
        model.count({
            where: args.where,
        }),
    ]);

    // Calculate pagination metadata (lastPage 0 when no results)
    const lastPage = total === 0 ? 0 : Math.ceil(total / limit);

    return {
        data,
        meta: {
            total,
            lastPage,
            currentPage: page,
            perPage: limit,
            prev: page > 1 ? page - 1 : null,
            next: page < lastPage ? page + 1 : null,
        },
    };
}

/**
 * Paginates Prisma model queries using page token-based pagination (Google AIP-158 standard).
 * 
 * Page token pagination is more efficient than offset-based pagination for large datasets
 * because it doesn't require scanning skipped records. It's ideal for:
 * - Large datasets (>10,000 records)
 * - Real-time data that changes frequently
 * - When consistent results are needed even if data changes during pagination
 * 
 * **Industry Standard:**
 * - Follows Google AIP-158 pagination standard
 * - Uses `page_token` parameter (industry standard naming)
 * - Uses `next_page_token` in response (industry standard naming)
 * - Compatible with Google Cloud APIs, AWS APIs, and other major platforms
 * 
 * **Performance Benefits:**
 * - O(1) complexity instead of O(n) for offset-based
 * - No performance degradation as you paginate deeper
 * - More efficient database queries (uses indexed token field)
 * 
 * **How it works:**
 * 1. First request: Omit page_token, returns first `limit` items ordered by token field
 * 2. Subsequent requests: Use page_token from previous response's `next_page_token`
 * 3. Continue until `hasMore` is false
 * 
 * **Requirements:**
 * - The model must have a unique, ordered field (typically `id` or `createdAt`)
 * - The `orderBy` argument should order by the token field (ascending or descending)
 * - The token field must be included in the query results
 * 
 * @template T - Type of items in the paginated result
 * 
 * @param model - Prisma model delegate with findMany method
 * @param paginationDto - Page token pagination parameters (limit, page_token)
 * @param args - Additional Prisma query arguments (where, orderBy, select, include, etc.)
 * @param tokenField - Field name to use as page token (default: 'id')
 * 
 * @returns Page token-paginated result with data array and token metadata
 * 
 * @example
 * ```typescript
 * // Basic page token pagination
 * const result = await paginatePageToken(
 *   this.prisma.user,
 *   { limit: 10 },
 *   { orderBy: { id: 'asc' } },
 *   'id'
 * );
 * 
 * // Next page using page token
 * const nextResult = await paginatePageToken(
 *   this.prisma.user,
 *   { limit: 10, page_token: result.meta.next_page_token },
 *   { orderBy: { id: 'asc' } },
 *   'id'
 * );
 * ```
 * 
 * @example
 * ```typescript
 * // With filters and ordering by createdAt
 * const result = await paginatePageToken(
 *   this.prisma.ad,
 *   { limit: 20, page_token: '2024-01-01T00:00:00Z' },
 *   {
 *     where: { status: 'ACTIVE' },
 *     orderBy: { createdAt: 'desc' },
 *     include: { user: true, category: true }
 *   },
 *   'createdAt'
 * );
 * ```
 * 
 * @example
 * ```typescript
 * // Response format (Google AIP-158 standard):
 * // {
 * //   data: [...],
 * //   meta: {
 * //     next_page_token: "123",
 * //     hasMore: true,
 * //     limit: 10
 * //   }
 * // }
 * ```
 * 
 * @note The token field must be:
 * - Unique (or unique within the filtered dataset)
 * - Ordered (ascending or descending, matching orderBy)
 * - Included in the query results (use select/include)
 * 
 * @see {@link paginate} For offset-based pagination (better for small datasets)
 * @see {@link https://aip.dev/158 | Google AIP-158: Pagination}
 */
export async function paginatePageToken<T extends Record<string, any>>(
    model: {
        findMany: (args: any) => Promise<T[]>;
        count?: (args: any) => Promise<number>;
    },
    paginationDto: PageTokenPaginationDto,
    args: any = {},
    tokenField: string = 'id',
): Promise<PageTokenPaginatedResult<T>> {
    // Normalize pagination parameters
    const limit = Math.max(1, Math.min(100, Number(paginationDto.limit) || 10));
    const pageToken = paginationDto.page_token;

    // Build query arguments
    const queryArgs: any = {
        ...args,
        take: limit + 1, // Fetch one extra to determine if there are more pages
    };

    // Add page token condition if provided
    if (pageToken) {
        // Determine sort direction from orderBy
        const orderBy = args.orderBy || {};
        const orderByField = Object.keys(orderBy)[0] || tokenField;
        const orderDirection = orderBy[orderByField] || 'asc';

        // Build page token condition
        queryArgs.where = {
            ...args.where,
            [tokenField]: orderDirection === 'desc'
                ? { lt: pageToken }
                : { gt: pageToken },
        };
    }

    // Execute query
    const data = await model.findMany(queryArgs);

    // Determine if there are more pages
    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;

    // Get next page token (value of tokenField from last item) - Google AIP-158 standard
    const nextPageToken = hasMore && items.length > 0
        ? String(items[items.length - 1][tokenField])
        : null;

    // Optionally get total count (may be expensive for large datasets)
    let total: number | undefined;
    if (model.count && !pageToken) {
        // Only count on first page to avoid performance issues
        try {
            total = await model.count({ where: args.where });
        } catch (error) {
            // Silently fail if count is not available or expensive
            total = undefined;
        }
    }

    return {
        data: items,
        meta: {
            next_page_token: nextPageToken,
            hasMore,
            limit,
            ...(total !== undefined && { total }),
        },
    };
}