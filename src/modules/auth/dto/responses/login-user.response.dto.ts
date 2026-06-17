import { Expose } from 'class-transformer';

export class LoginUserResponseDto {
  @Expose()
  email!: string;

  @Expose()
  createdAt!: Date;
}