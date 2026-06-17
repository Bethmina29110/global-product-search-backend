import { IsEmail, IsString, Length, MinLength, Matches } from 'class-validator';

export class ResetPasswordRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(4, 4, { message: 'OTP must be exactly 4 digits' })
  otp!: string;

  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password too weak. Use uppercase, lowercase, number and symbol.',
  })
  newPassword!: string;

  @IsString()
  confirmPassword!: string;
}