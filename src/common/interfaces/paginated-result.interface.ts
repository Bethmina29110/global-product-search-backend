/**
 * Standard paginated response structure.
 * 
 * Used by the pagination utility and all paginated endpoints to provide
 * a consistent response format across the application.
 * 
 * @template T - Type of items in the data array
 * 
 * @example
 * ```typescript
 * const result: PaginatedResult<User> = {
 *   data: [user1, user2, user3],
 *   meta: {
 *     total: 100,
 *     lastPage: 10,
 *     currentPage: 1,
 *     perPage: 10,
 *     prev: null,
 *     next: 2
 *   }
 * };
 * ```
 */
export interface PaginatedResult<T> {
    /** Array of paginated items */
    data: T[];
    /** Pagination metadata */
    meta: {
        /** Total number of items across all pages */
        total: number;
        /** Last page number */
        lastPage: number;
        /** Current page number (1-indexed) */
        currentPage: number;
        /** Number of items per page */
        perPage: number;
        /** Previous page number (null if on first page) */
        prev: number | null;
        /** Next page number (null if on last page) */
        next: number | null;
        /** Optional: Unread count (used for notifications) */
        unreadCount?: number;
    };
}