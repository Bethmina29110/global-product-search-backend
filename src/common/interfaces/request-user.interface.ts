/**
 * Shape of the authenticated user attached to the request by JwtStrategy.
 * Use with @CurrentUser() in controllers.
 */
export interface RequestUser {
  /** User ID (string). Use BigInt(user.id) when calling services that expect bigint. */
  id: string;
  /** Present for compatibility with code that uses user.sub; same as id. */
  sub?: string;
  email: string;
  fullName: string;
}
