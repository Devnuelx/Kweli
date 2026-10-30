import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ProductsService } from './products.service';
import { PrismaService } from '../../core/database/prisma.service';
import { QrGeneratorService } from '../../core/qr/qr-generator.service';
import { UnitStatus } from '@prisma/client';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: any;

  const mockPrisma = {
    brand: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    productBatch: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    productUnit: {
      createMany: jest.fn(),
      count: jest.fn(),
    },
    scanEvent: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret-key-32-chars-length!!';
      if (key === 'FRONTEND_URL') return 'https://test.kweli.co';
      return null;
    }),
  };

  const mockQrGenerator = {
    generateDataUrl: jest.fn(),
    generateBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-qr-bytes')),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: QrGeneratorService, useValue: mockQrGenerator },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerProduct', () => {
    it('should create brand, product, batch and generate units with dual-layer security', async () => {
      mockPrisma.brand.findFirst.mockResolvedValue(null);
      mockPrisma.brand.create.mockResolvedValue({ id: 'brand-1', name: 'Pfizer' });
      mockPrisma.product.findFirst.mockResolvedValue(null);
      mockPrisma.product.create.mockResolvedValue({
        id: 'prod-1',
        name: 'Lipitor',
        brandId: 'brand-1',
      });
      mockPrisma.productBatch.create.mockResolvedValue({
        id: 'batch-1',
        productId: 'prod-1',
        batchNumber: 'LIP-001',
        batchSize: 5,
      });
      mockPrisma.productUnit.createMany.mockResolvedValue({ count: 5 });

      const result = await service.registerProduct('org-123', {
        name: 'Lipitor',
        batchNumber: 'LIP-001',
        batchSize: 5,
        manufacturer: 'Pfizer',
      });

      expect(result.product.id).toBe('prod-1');
      expect(result.batch.id).toBe('batch-1');
      expect(mockPrisma.productUnit.createMany).toHaveBeenCalledTimes(1);

      const createdUnits = mockPrisma.productUnit.createMany.mock.calls[0][0].data;
      expect(createdUnits).toHaveLength(5);
      expect(createdUnits[0].publicSerial).toMatch(/^KW[0-9A-F]{12}$/);
      expect(createdUnits[0].scratchPinHash).toHaveLength(64); // SHA-256
      expect(createdUnits[0].scratchPinEncrypted).toContain(':'); // AES-256-GCM iv:tag:data
      expect(createdUnits[0].status).toBe(UnitStatus.ISSUED);
    });
  });

  describe('exportBatchCsv', () => {
    it('should export batch units as CSV with decrypted scratch PINs', async () => {
      // First generate a unit through the service or helper to test decryption
      const registered = await service.registerProduct('org-123', {
        name: 'Lipitor',
        batchNumber: 'LIP-001',
        batchSize: 2,
        manufacturer: 'Pfizer',
      });

      const unitsData = mockPrisma.productUnit.createMany.mock.calls[0][0].data;

      mockPrisma.productBatch.findFirst.mockResolvedValue({
        id: 'batch-1',
        batchNumber: 'LIP-001',
        product: { name: 'Lipitor', sku: 'LIP-10' },
        units: unitsData.map((u: any, idx: number) => ({
          ...u,
          id: `unit-${idx}`,
          createdAt: new Date('2026-01-01T00:00:00Z'),
        })),
      });

      const exportResult = await service.exportBatchCsv('org-123', 'batch-1');

      expect(exportResult.filename).toBe('batch-LIP-001.csv');
      expect(exportResult.csvContent).toContain('Batch Number,Product Name,SKU,Public Serial,Verification URL,Scratch PIN,Status,Created At');
      expect(exportResult.csvContent).toContain('https://test.kweli.co/v/');
      // Scratch PIN should be decrypted 6 digits
      const lines = exportResult.csvContent.split('\r\n');
      expect(lines).toHaveLength(3); // header + 2 units
      const pinMatch = lines[1].match(/"(\d{6})"/);
      expect(pinMatch).toBeTruthy();
    });
  });

  describe('getProductStats', () => {
    it('should calculate accurate metrics and scan telemetry', async () => {
      mockPrisma.product.count.mockResolvedValue(10);
      mockPrisma.productUnit.count.mockResolvedValue(500);
      mockPrisma.scanEvent.count
        .mockResolvedValueOnce(120) // total scans
        .mockResolvedValueOnce(4);  // fraud attempts
      mockPrisma.scanEvent.findMany.mockResolvedValue([
        {
          id: 'scan-1',
          outcome: 'AUTHENTIC_FIRST_SCAN',
          maskedIp: '192.168.***.***',
          createdAt: new Date('2026-01-01T12:00:00Z'),
          unit: {
            publicSerial: 'KW123456789012',
            batch: {
              batchNumber: 'B001',
              product: { name: 'Amox' },
            },
          },
        },
      ]);

      const stats = await service.getProductStats('org-123');

      expect(stats.totalProducts).toBe(10);
      expect(stats.totalUnits).toBe(500);
      expect(stats.totalScans).toBe(120);
      expect(stats.fraudAttempts).toBe(4);
      expect(stats.scanRate).toBe(24);
      expect(stats.recentScans).toHaveLength(1);
      expect(stats.recentScans[0].productName).toBe('Amox');
    });
  });
});
