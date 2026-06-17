import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used to mark routes as public.
 * Used by JwtAuthGuard to bypass authentication checks.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator that marks a route as public, bypassing JWT authentication.
 * 
 * When applied to a route handler or controller, the JwtAuthGuard will
 * skip authentication checks for that route.
 * 
 * @example
 * ```typescript
 * @Controller('auth')
 * export class AuthController {
 *   @Public()
 *   @Post('login')
 *   async login(@Body() dto: LoginDto) {
 *     return this.authService.login(dto);
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
 * @Public()
 * @Controller('health')
 * export class HealthController {
 *   @Get()
 *   async check() {
 *     return { status: 'ok' };
 *   }
 * }
 * ```
 * 
 * @returns A metadata decorator that sets IS_PUBLIC_KEY to true
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);