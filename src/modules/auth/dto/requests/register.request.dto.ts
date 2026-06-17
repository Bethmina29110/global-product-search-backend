import { IsEmail, IsString, MinLength, MaxLength, Matches, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterRequestDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).*$/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Confirm password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Confirm password must not exceed 128 characters' })
  confirmPassword!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  fullName!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(512)
  @Transform(({ value }) => value?.trim())
  address!: string;
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+94[0-9]{9}$/, {
    message: 'Phone number must be in format: +94XXXXXXXXX',
  })
  phoneNo?: string;
}