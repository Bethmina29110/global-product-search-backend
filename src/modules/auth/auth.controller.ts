import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterRequestDto } from './dto/requests/register.request.dto';
import { LoginRequestDto } from './dto/requests/login.request.dto';
import { ForgotPasswordRequestDto } from './dto/requests/forgot-password.request.dto';
import { ResetPasswordRequestDto } from './dto/requests/reset-password.request.dto';
import { AuthTokensResponseDto } from './dto/responses/auth-tokens.response.dto';
import { RefreshTokenRequestDto } from './dto/requests/refresh-token.request.dto';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterRequestDto): Promise<AuthTokensResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginRequestDto): Promise<AuthTokensResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenRequestDto): Promise<AuthTokensResponseDto> {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: any): Promise<{ message: string }> {
    return this.authService.logout(user.sub);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordRequestDto): Promise<{ message: string }> {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordRequestDto): Promise<{ message: string }> {
    return this.authService.resetPassword(dto);
  }
}