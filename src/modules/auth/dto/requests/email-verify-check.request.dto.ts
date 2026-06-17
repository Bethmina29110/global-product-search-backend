import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

/**
 * Request DTO for verifying email OTP.
 * Client sends only the token from send-otp response and the OTP received by email.
 */
export class EmailVerifyCheckRequestDto {
  @IsString()
  @Length(4, 4, { message: 'OTP must be exactly 4 digits' })
  @Matches(/^\d{4}$/, { message: 'OTP must be exactly 4 digits' })
  otp!: string;

  @IsString()
  @IsNotEmpty({ message: 'Verification token is required' })
  token!: string;
}
