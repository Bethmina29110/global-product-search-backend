import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Request DTO for sending email verification OTP.
 * No database save or check; generates 4-digit OTP, sends to email, returns hashed token.
 */
export class EmailVerifySendRequestDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;
}
