import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginRequestDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}