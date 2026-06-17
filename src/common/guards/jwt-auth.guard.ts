import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';

/**
 * JWT Authentication Guard.
 * 
 * Protects routes by default, requiring valid JWT tokens for access.
 * Routes can be marked as public using the @Public() decorator to bypass authentication.
 * 
 * This guard:
 * - Validates JWT tokens from the Authorization header
 * - Sets the authenticated user on the request object (request.user)
 * - Allows public routes via @Public() decorator
 * - Works in conjunction with RolesGuard for role-based authorization
 * - Provides comprehensive error handling and logging
 * 
 * @example
 * ```typescript
 * @Controller('users')
 * @UseGuards(JwtAuthGuard)
 * export class UsersController {
 *   @Public()
 *   @Get('public')
 *   async publicRoute() {
 *     return { message: 'Public route - no auth required' };
 *   }
 * 
 *   @Get('profile')
 *   async getProfile(@CurrentUser() user: User) {
 *     return user; // Requires authentication
 *   }
 * }
 * ```
 * 
 * @example
 * ```typescript
 * @Controller('admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * export class AdminController {
 *   @Roles(UserRole.ADMIN)
 *   @Delete('users/:id')
 *   async deleteUser(@Param('id') id: string) {
 *     return this.usersService.delete(id);
 *   }
 * }
 * ```
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determines if the route can be activated.
   * 
   * Checks if the route is marked as public. If public, allows access without authentication.
   * Otherwise, delegates to the parent AuthGuard to validate JWT token.
   * 
   * @param context - Execution context containing route handler and class metadata
   * @returns true if route is public, otherwise result of JWT validation
   * @throws {UnauthorizedException} If authentication fails
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const route = `${request.method} ${request.url}`;

    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Validate JWT token via parent AuthGuard
    try {
      const result = await super.canActivate(context);
      
      // Handle both boolean and Promise<boolean> results
      const canActivate = result instanceof Promise ? await result : result;
      
      if (!canActivate) {
        this.logger.warn(`[${route}] Authentication failed - Guard returned false`);
        throw new UnauthorizedException('Authentication failed');
      }

      return canActivate;
    } catch (error) {
      // Log authentication failures for security monitoring
      if (error instanceof UnauthorizedException) {
        this.logger.warn(`[${route}] Authentication failed: ${error.message}`);
        throw error;
      }

      // Handle unexpected errors
      this.logger.error(
        `[${route}] Unexpected error during authentication: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Re-throw as UnauthorizedException for consistency
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Handles authentication errors.
   * 
   * Overrides the parent method to provide better error handling and logging.
   * 
   * @param err - The error that occurred during authentication
   * @param user - The user object (if available)
   * @param info - Additional error information
   * @returns Never returns (always throws)
   * @throws {UnauthorizedException} Always throws an UnauthorizedException
   */
  handleRequest<TUser = any>(
    err: Error | null,
    user: TUser | false,
    info: any,
  ): TUser {
    if (err) {
      this.logger.error(`JWT authentication error: ${err.message}`, err.stack);
      throw new UnauthorizedException('Authentication failed');
    }

    if (!user) {
      const errorMessage = info?.message || 'Invalid or expired token';
      this.logger.warn(`JWT authentication failed: ${errorMessage}`);
      throw new UnauthorizedException(errorMessage);
    }

    return user;
  }
}