import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/database/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret =
      configService.get<string>('JWT_SECRET') ||
      configService.get<string>('NEXTAUTH_SECRET');

    if (!secret) {
      throw new Error(
        'CRITICAL CONFIG ERROR: Neither JWT_SECRET nor NEXTAUTH_SECRET is configured. Cannot initialize JwtStrategy safely.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const userId = payload.sub;

    if (!userId) {
      throw new UnauthorizedException('Malformed token: missing subject claim');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        memberships: {
          select: {
            id: true,
            role: true,
            organization: {
              select: {
                id: true,
                legalName: true,
                tradingName: true,
                kybStatus: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Account not found or session terminated');
    }

    return user;
  }
}
