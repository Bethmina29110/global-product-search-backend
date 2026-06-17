/**
 * Page token-based paginated response structure.
 * 
 * Implements Google AIP-158 standard for token-based pagination responses.
 * Page token pagination is more efficient for large datasets as it doesn't require
 * scanning skipped records.
 * 
 * **Industry Standard (Google AIP-158):**
 * - Uses `next_page_token` field (instead of `nextCursor`)
 * - Follows REST API best practices
 * - Compatible with Google Cloud APIs, AWS APIs, and other major platforms
 * 
 * @template T - Type of items in the data array
 * 
 * @example
 * ```typescript
 * const result: PageTokenPaginatedResult<User> = {
 *   data: [user1, user2, user3],
 *   meta: {
 *     next_page_token: "123",
 *     hasMore: true,
 *     limit: 10
 *   }
 * };
 * ```
 * 
 * @see {@link https://aip.dev/158 | Google AIP-158: Pagination}
 */
export interface PageTokenPaginatedResult<T> {
    /** Array of paginated items */
    data: T[];
    /** Page token pagination metadata */
    meta: {
        /** Page token for the next page (null if no more pages) - Google AIP-158 standard */
        next_page_token: string | null;
        /** Whether there are more items available */
        hasMore: boolean;
        /** Number of items per page */
        limit: number;
        /** Optional: Total count (if available, may be expensive for large datasets) */
        total?: number;
    };
}
