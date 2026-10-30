import { Test, TestingModule } from '@nestjs/testing';
import { LabelSheetService } from './label-sheet.service';
import { QrGeneratorService } from '../qr/qr-generator.service';

describe('LabelSheetService', () => {
  let service: LabelSheetService;
  let qrService: QrGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LabelSheetService,
        {
          provide: QrGeneratorService,
          useValue: {
            generateBuffer: jest.fn().mockImplementation(async (text: string) => {
              // Create a tiny 1x1 valid PNG buffer for embedding in PDF
              // 1x1 8-bit RGBA PNG
              return Buffer.from([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
                0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
                0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
                0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb0, 0x00, 0x00, 0x00,
                0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
              ]);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<LabelSheetService>(LabelSheetService);
    qrService = module.get<QrGeneratorService>(QrGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate a valid PDF buffer for a4-2x5 template (Avery L7173)', async () => {
    const units = [
      { publicSerial: 'KW001122334455', scratchPin: '123456' },
      { publicSerial: 'KW667788990011', scratchPin: null },
    ];

    const buffer = await service.generateLabelSheetPdf({
      brandName: 'Acme Pharma',
      productName: 'Amoxicillin 500mg',
      sku: 'AMX-500',
      batchNumber: 'AMX-2026-001',
      mfgDate: new Date('2026-01-15'),
      expDate: new Date('2028-01-15'),
      units,
      template: 'a4-2x5',
      includeCutMarks: true,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
    expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
    expect(qrService.generateBuffer).toHaveBeenCalledTimes(2);
  });

  it('should generate a valid PDF buffer for a4-3x8 template (Avery L7159)', async () => {
    const units = Array.from({ length: 5 }, (_, i) => ({
      publicSerial: `KW${i.toString().padStart(12, '0')}`,
      scratchPin: `${100000 + i}`,
    }));

    const buffer = await service.generateLabelSheetPdf({
      brandName: 'Global Agro',
      productName: 'Premium Seeds',
      batchNumber: 'AGR-999',
      units,
      template: 'a4-3x8',
      includeCutMarks: false,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
    expect(qrService.generateBuffer).toHaveBeenCalledTimes(5);
  });

  it('should generate a valid PDF buffer for avery5160 template (US Letter)', async () => {
    const units = [
      { publicSerial: 'KWUS0000000001', scratchPin: '998877' },
    ];

    const buffer = await service.generateLabelSheetPdf({
      brandName: 'US Brand Co',
      productName: 'Consumer Good',
      batchNumber: 'USB-100',
      units,
      template: 'avery5160',
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
  });

  it('should handle multi-page generation when units exceed one sheet capacity', async () => {
    // a4-2x5 has 10 labels per page. Providing 15 units should generate 2 pages.
    const units = Array.from({ length: 15 }, (_, i) => ({
      publicSerial: `KWMULTI${i.toString().padStart(7, '0')}`,
      scratchPin: `${200000 + i}`,
    }));

    const buffer = await service.generateLabelSheetPdf({
      brandName: 'MultiPage Labs',
      productName: 'Multi-Batch Test Product',
      batchNumber: 'MP-01',
      units,
      template: 'a4-2x5',
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
    expect(qrService.generateBuffer).toHaveBeenCalledTimes(15);
  });
});
