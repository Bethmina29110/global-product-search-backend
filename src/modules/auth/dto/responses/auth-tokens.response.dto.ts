import { Expose } from 'class-transformer';

export class AuthTokensResponseDto {
  @Expose()
  message!: string;

  @Expose()
  accessToken!: string;

  @Expose()
  refreshToken!: string;
}

export class RefreshTokenResponseDto {
  @Expose()
  message!: string;

  @Expose()
  accessToken!: string;

  @Expose()
  refreshToken!: string;
}
