import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenRequestDto {
  @IsString({ message: 'Refresh token must be a string' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken!: string;
}
