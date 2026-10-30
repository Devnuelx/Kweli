import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../../core/database/prisma.service';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let prisma: any;

  const mockPrisma = {
    apiKey: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createApiKey', () => {
    it('should generate a kw_live_ key and store hash', async () => {
      mockPrisma.apiKey.create.mockResolvedValue({
        id: 'key-1',
        name: 'Zebra Printer',
        keyPrefix: 'kw_live_1234',
        createdAt: new Date(),
      });

      const result = await service.createApiKey('org-123', {
        name: 'Zebra Printer',
      });

      expect(result.id).toBe('key-1');
      expect(result.apiKey).toMatch(/^kw_live_[0-9a-f]{48}$/);
      expect(mockPrisma.apiKey.create).toHaveBeenCalledTimes(1);

      const createArg = mockPrisma.apiKey.create.mock.calls[0][0].data;
      expect(createArg.organizationId).toBe('org-123');
      expect(createArg.keyPrefix).toMatch(/^kw_live_/);
      expect(createArg.keyHash).toHaveLength(64); // SHA-256
    });
  });

  describe('validateApiKey', () => {
    it('should authenticate a valid raw key', async () => {
      const rawKey = 'kw_live_abcdef1234567890abcdef1234567890abcdef1234567890';
      const mockOrg = { id: 'org-1', legalName: 'Pfizer' };

      mockPrisma.apiKey.findUnique.mockResolvedValue({
        id: 'key-1',
        name: 'Factory Key',
        isRevoked: false,
        organization: mockOrg,
      });
      mockPrisma.apiKey.update.mockResolvedValue({});

      const validated = await service.validateApiKey(rawKey);

      expect(validated).toBeDefined();
      expect(validated?.organization.id).toBe('org-1');
      expect(validated?.name).toBe('Factory Key');
      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: { lastUsedAt: expect.any(Date) },
      });
    });

    it('should reject invalid or non-kw prefix keys', async () => {
      const validated = await service.validateApiKey('invalid_secret_token');
      expect(validated).toBeNull();
      expect(mockPrisma.apiKey.findUnique).not.toHaveBeenCalled();
    });
  });
});
