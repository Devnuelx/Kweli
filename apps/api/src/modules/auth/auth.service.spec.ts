import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { PrismaService } from '../../core/database/prisma.service';
import { UserRole, KybStatus } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      organization: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      organizationMember: {
        create: jest.fn(),
      },
      brand: {
        create: jest.fn(),
      },
      pointAccount: {
        create: jest.fn(),
      },
      refreshSession: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock_jwt_access_token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('registerConsumer', () => {
    it('should register a consumer and create a points account with 0 balance', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'consumer@example.com',
        firstName: 'Ada',
        lastName: 'Okonkwo',
        role: UserRole.CONSUMER,
        isEmailVerified: false,
        createdAt: new Date(),
      });
      prisma.pointAccount.create.mockResolvedValue({
        id: 'points-uuid-1',
        userId: 'user-uuid-1',
        balance: 0,
        lifetimeEarned: 0,
      });

      const res = await service.registerConsumer({
        email: 'consumer@example.com',
        password: 'ValidPassword123!',
        firstName: 'Ada',
        lastName: 'Okonkwo',
      });

      expect(res.id).toBe('user-uuid-1');
      expect(res.email).toBe('consumer@example.com');
      expect(res.role).toBe(UserRole.CONSUMER);
      expect(prisma.pointAccount.create).toHaveBeenCalledWith({
        data: { userId: 'user-uuid-1', balance: 0, lifetimeEarned: 0 },
      });
    });

    it('should throw ConflictException if email is already in use', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.registerConsumer({
          email: 'consumer@example.com',
          password: 'ValidPassword123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('registerBrand', () => {
    it('should register brand admin, organization, and initial brand', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.organization.findUnique.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue({
        id: 'org-uuid-1',
        legalName: 'Acme Pharma Ltd',
        kybStatus: KybStatus.PENDING_REVIEW,
      });
      prisma.user.create.mockResolvedValue({
        id: 'admin-uuid-1',
        email: 'admin@acme.com',
        firstName: 'Chidi',
        lastName: 'Eze',
        role: UserRole.BRAND_ADMIN,
        isEmailVerified: false,
      });
      prisma.brand.create.mockResolvedValue({
        id: 'brand-uuid-1',
        name: 'Acme Pharma Ltd',
      });

      const res = await service.registerBrand({
        email: 'admin@acme.com',
        password: 'SecurePassword123!',
        firstName: 'Chidi',
        lastName: 'Eze',
        companyName: 'Acme Pharma Ltd',
        registrationNum: 'RC-1234567',
      });

      expect(res.user.id).toBe('admin-uuid-1');
      expect(res.organization.legalName).toBe('Acme Pharma Ltd');
      expect(res.organization.kybStatus).toBe(KybStatus.PENDING_REVIEW);
      expect(res.brand.name).toBe('Acme Pharma Ltd');
    });
  });

  describe('login', () => {
    it('should authenticate user and issue access token and refresh token', async () => {
      const password = 'CorrectPassword123!';
      const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'consumer@example.com',
        passwordHash,
        firstName: 'Ada',
        lastName: 'Okonkwo',
        role: UserRole.CONSUMER,
        isEmailVerified: true,
        memberships: [],
      });
      prisma.refreshSession.create.mockResolvedValue({ id: 'session-uuid-1' });

      const res = await service.login(
        { email: 'consumer@example.com', password },
        { ipAddress: '127.0.0.1', userAgent: 'Jest' },
      );

      expect(res.accessToken).toBe('mock_jwt_access_token');
      expect(res.refreshToken).toBeDefined();
      expect(res.user.email).toBe('consumer@example.com');
      expect(prisma.refreshSession.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const passwordHash = await argon2.hash('RealPassword123!', {
        type: argon2.argon2id,
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'consumer@example.com',
        passwordHash,
      });

      await expect(
        service.login(
          { email: 'consumer@example.com', password: 'WrongPassword' },
          {},
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should rotate refresh token and revoke previous session', async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24);
      prisma.refreshSession.findFirst.mockResolvedValue({
        id: 'old-session-id',
        expiresAt: futureDate,
        isRevoked: false,
        user: {
          id: 'user-uuid-1',
          email: 'consumer@example.com',
          role: UserRole.CONSUMER,
          memberships: [],
        },
      });

      const res = await service.refreshToken('valid_raw_token_xyz', {});

      expect(prisma.refreshSession.update).toHaveBeenCalledWith({
        where: { id: 'old-session-id' },
        data: { isRevoked: true },
      });
      expect(res.accessToken).toBe('mock_jwt_access_token');
      expect(res.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException if session is expired or revoked', async () => {
      prisma.refreshSession.findFirst.mockResolvedValue(null);

      await expect(
        service.refreshToken('non_existent_token', {}),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
