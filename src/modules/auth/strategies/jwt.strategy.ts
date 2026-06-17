import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { RequestUser } from '@common/interfaces/request-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'default_secret',
    });
  }

  async validate(payload: any): Promise<RequestUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(payload.sub, 10) },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return {
      id: user.id.toString(),
      sub: user.id.toString(),
      email: user.email,
      fullName: user.name,
    };
  }
}
