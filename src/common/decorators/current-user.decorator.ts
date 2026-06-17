import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Parameter decorator that extracts the authenticated user from the request object.
 * 
 * The user is set by JwtAuthGuard after successful JWT authentication.
 * This decorator provides type safety and validation to ensure the user exists.
 * 
 * **Features:**
 * - Type-safe user extraction with generic type parameter
 * - Validation: Throws UnauthorizedException if user is not authenticated
 * - Works seamlessly with JwtAuthGuard
 * 
 * **Usage:**
 * - Must be used with @UseGuards(JwtAuthGuard) to ensure authentication
 * - Provides type safety when used with TypeScript generics
 * - Throws UnauthorizedException if user is missing (defensive check)
 * 
 * @template T - Type of the user object (defaults to any)
 * 
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@CurrentUser() user: User) {
 *   return user; // user is guaranteed to exist and be typed as User
 * }
 * ```
 * 
 * @example
 * ```typescript
 * @Put('users/:id')
 * @UseGuards(JwtAuthGuard)
 * async updateUser(
 *   @Param('id') id: string,
 *   @CurrentUser() user: User,
 *   @Body() dto: UpdateUserDto
 * ) {
 *   return this.usersService.update(id, dto, user.id);
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // With custom user type
 * interface AuthUser {
 *   id: string;
 *   email: string;
 *   role: UserRole;
 * }
 * 
 * @Get('dashboard')
 * @UseGuards(JwtAuthGuard)
 * async getDashboard(@CurrentUser() user: AuthUser) {
 *   return this.dashboardService.getData(user.id);
 * }
 * ```
 * 
 * @returns The authenticated user object from the request
 * @throws {UnauthorizedException} If user is not authenticated (user is undefined/null)
 */
export const CurrentUser = createParamDecorator(
  <T = any>(data: unknown, ctx: ExecutionContext): T => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Defensive check: If JwtAuthGuard is working correctly, user should always exist
    // However, this check provides an extra layer of safety
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return user as T;
  },
);