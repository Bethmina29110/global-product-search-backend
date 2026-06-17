import { IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordRequestDto {
    @IsString()
    @MinLength(8)
    oldPassword!: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).*$/, {
        message: 'Password must contain uppercase, lowercase, number and special character',
    })
    newPassword!: string;

    @IsString()
    confirmPassword!: string;
}