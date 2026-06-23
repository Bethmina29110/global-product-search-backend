import { Injectable, UnauthorizedException, ConflictException, Logger, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RegisterRequestDto } from './dto/requests/register.request.dto';
import { LoginRequestDto } from './dto/requests/login.request.dto';
import { RefreshTokenRequestDto } from './dto/requests/refresh-token.request.dto';
import { AuthTokensResponseDto } from './dto/responses/auth-tokens.response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterRequestDto): Promise<AuthTokensResponseDto> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const saltRounds = this.configService.get<number>('security.bcryptRounds', 12);
      const passwordHash = await bcrypt.hash(dto.password, saltRounds);

      const user = await this.prisma.user.create({
        data: {
          name: dto.fullName || dto.email.split('@')[0],
          email: dto.email,
          password: passwordHash,
        },
      });

      return this.generateTokens(user.id.toString(), user.email, user.name);
    } catch (error: any) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Registration failed for email ${dto.email}`, error.stack);
      throw new InternalServerErrorException('An unexpected error occurred during registration');
    }
  }

  async login(dto: LoginRequestDto): Promise<AuthTokensResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(dto.password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return this.generateTokens(user.id.toString(), user.email, user.name);
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Login failed for email ${dto.email}`, error.stack);
      throw new InternalServerErrorException('An unexpected error occurred during login');
    }
  }

  async refreshToken(dto: RefreshTokenRequestDto): Promise<AuthTokensResponseDto> {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: parseInt(payload.sub, 10) },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user.id.toString(), user.email, user.name);
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Differentiate between a JWT format/expiration error and a database crash
      if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
      
      this.logger.error(`Refresh token failed`, error.stack);
      throw new InternalServerErrorException('An unexpected error occurred while refreshing the token');
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    // For stateless JWTs, the client handles clearing the token.
    // If we had a token blacklist, we would insert the token here.
    return { message: 'Logged out successfully' };
  }

  private generateTokens(userId: string, email: string, name: string): AuthTokensResponseDto {
    const payload = { sub: userId, email, name };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') as any,
    });

    return {
      message: 'Authentication successful',
      accessToken,
      refreshToken,
    };
  }
}