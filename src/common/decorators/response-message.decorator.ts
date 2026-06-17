import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used to store custom response messages.
 * Used by TransformInterceptor to override the default "Success" message.
 */
export const RESPONSE_MESSAGE_KEY = 'response_message';

/**
 * Decorator that sets a custom success message for the API response.
 * 
 * The message will be used by TransformInterceptor to override the default
 * "Success" message in the response. If the service returns an object with
 * a "message" property, the decorator message takes precedence.
 * 
 * @param message - Custom success message to include in the response
 * 
 * @example
 * ```typescript
 * @Post('users')
 * @ResponseMessage('User created successfully')
 * async createUser(@Body() dto: CreateUserDto) {
 *   return this.usersService.create(dto);
 * }
 * ```
 * 
 * @example
 * ```typescript
 * @Delete('users/:id')
 * @ResponseMessage('User deleted successfully')
 * async deleteUser(@Param('id') id: string) {
 *   await this.usersService.delete(id);
 *   return { id };
 * }
 * ```
 * 
 * @returns A metadata decorator that stores the custom message
 * 
 * @throws {Error} If message is empty or not a string
 */
export const ResponseMessage = (message: string) => {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('ResponseMessage decorator requires a non-empty string');
  }
  return SetMetadata(RESPONSE_MESSAGE_KEY, message);
};