import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterRequestDto } from './dto/requests/register.request.dto';
import { LoginRequestDto } from './dto/requests/login.request.dto';
import { AuthTokensResponseDto } from './dto/responses/auth-tokens.response.dto';
import { Public } from '@common/decorators/public.decorator';

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
}