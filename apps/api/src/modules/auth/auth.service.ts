import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { UserRole, KybStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterBrandDto } from './dto/register-brand.dto';
import { LoginDto } from './dto/login.dto';

export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new consumer user and initialize their points account.
   */
  async registerConsumer(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName: dto.firstName?.trim() || null,
          lastName: dto.lastName?.trim() || null,
          phone: dto.phone?.trim() || null,
          role: UserRole.CONSUMER,
          isEmailVerified: false,
        },
      });

      const pointAccount = await tx.pointAccount.create({
        data: {
          userId: user.id,
          balance: 0,
          lifetimeEarned: 0,
        },
      });

      return { user, pointAccount };
    });

    this.logger.log(`Consumer registered: ${result.user.id} (${result.user.email})`);

    return {
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      role: result.user.role,
      isEmailVerified: result.user.isEmailVerified,
      createdAt: result.user.createdAt,
    };
  }

  /**
   * Register a brand administrator, their organization, initial brand, and membership.
   */
  async registerBrand(dto: RegisterBrandDto) {
    const email = dto.email.trim().toLowerCase();
    const companyName = dto.companyName.trim();
    const registrationNum = dto.registrationNum?.trim() || null;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    if (registrationNum) {
      const existingOrg = await this.prisma.organization.findUnique({
        where: { registrationNum },
      });
      if (existingOrg) {
        throw new ConflictException(
          'An organization with this registration number is already registered',
        );
      }
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          legalName: companyName,
          tradingName: companyName,
          registrationNum,
          websiteUrl: dto.websiteUrl || null,
          kybStatus: KybStatus.PENDING_REVIEW,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          phone: dto.phone?.trim() || null,
          role: UserRole.BRAND_ADMIN,
          isEmailVerified: false,
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: UserRole.BRAND_ADMIN,
        },
      });

      const brand = await tx.brand.create({
        data: {
          organizationId: organization.id,
          name: companyName,
        },
      });

      return { user, organization, brand };
    });

    this.logger.log(
      `Brand admin registered: ${result.user.id} for Org ${result.organization.id} (${result.organization.legalName})`,
    );

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        isEmailVerified: result.user.isEmailVerified,
      },
      organization: {
        id: result.organization.id,
        legalName: result.organization.legalName,
        kybStatus: result.organization.kybStatus,
      },
      brand: {
        id: result.brand.id,
        name: result.brand.name,
      },
    };
  }

  /**
   * Universal Login: Authenticates consumer or brand user, creates a database-backed
   * revocable RefreshSession, and issues short-lived JWT access token + refresh token.
   */
  async login(dto: LoginDto, metadata: RequestMetadata) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { accessToken, refreshToken, expiresAt } = await this.issueTokens(
      user.id,
      user.email,
      user.role,
      metadata,
    );

    return {
      accessToken,
      refreshToken,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        memberships: user.memberships.map((m) => ({
          id: m.id,
          role: m.role,
          organization: {
            id: m.organization.id,
            legalName: m.organization.legalName,
            tradingName: m.organization.tradingName,
            kybStatus: m.organization.kybStatus,
          },
        })),
      },
    };
  }

  /**
   * Rotate refresh token and issue a fresh 15-minute access token.
   */
  async refreshToken(rawRefreshToken: string, metadata: RequestMetadata) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const tokenHash = this.hashToken(rawRefreshToken);

    const session = await this.prisma.refreshSession.findFirst({
      where: {
        tokenHash,
        isRevoked: false,
      },
      include: {
        user: {
          include: {
            memberships: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or revoked refresh session');
    }

    if (session.expiresAt < new Date()) {
      await this.prisma.refreshSession.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Refresh token expired, please sign in again');
    }

    // Revoke old session immediately (Token Rotation to prevent replay)
    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    const user = session.user;
    const { accessToken, refreshToken, expiresAt } = await this.issueTokens(
      user.id,
      user.email,
      user.role,
      metadata,
    );

    return {
      accessToken,
      refreshToken,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        memberships: user.memberships.map((m) => ({
          id: m.id,
          role: m.role,
          organization: {
            id: m.organization.id,
            legalName: m.organization.legalName,
            tradingName: m.organization.tradingName,
            kybStatus: m.organization.kybStatus,
          },
        })),
      },
    };
  }

  /**
   * Revoke a refresh session on logout.
   */
  async logout(rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await this.prisma.refreshSession.updateMany({
        where: { tokenHash },
        data: { isRevoked: true },
      });
    }

    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Get current authenticated user profile with points balance and memberships.
   */
  async getMe(userId: string) {
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
        pointAccount: {
          select: {
            balance: true,
            lifetimeEarned: true,
          },
        },
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
                brands: {
                  select: {
                    id: true,
                    name: true,
                    logoUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User account not found');
    }

    return user;
  }

  /**
   * Private helper to issue tokens and persist the SHA-256 hashed refresh token session.
   */
  private async issueTokens(
    userId: string,
    email: string,
    role: UserRole,
    metadata: RequestMetadata,
  ) {
    const accessPayload = {
      sub: userId,
      email,
      role,
    };

    // 15-minute access token
    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: '15m',
    });

    // 30-day random refresh token
    const rawRefreshToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshSession.create({
      data: {
        userId,
        tokenHash,
        ipAddress: metadata.ipAddress || null,
        userAgent: metadata.userAgent || null,
        expiresAt,
        isRevoked: false,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresAt,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
