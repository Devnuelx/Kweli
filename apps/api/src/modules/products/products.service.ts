import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { PrismaService } from '../../core/database/prisma.service';
import { QrGeneratorService } from '../../core/qr/qr-generator.service';
import { LabelSheetService, LabelTemplateType } from '../../core/pdf/label-sheet.service';
import { RegisterProductDto } from './dto/register-product.dto';
import { encryptText, decryptText } from '../../common/utils/crypto.utils';
import { UnitStatus } from '@prisma/client';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly secretKey: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly qrGenerator: QrGeneratorService,
    private readonly labelSheetService: LabelSheetService,
  ) {
    this.secretKey =
      this.configService.get<string>('JWT_SECRET') ||
      this.configService.get<string>('NEXTAUTH_SECRET') ||
      'kweli-secure-default-key-32bytes-min';
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'https://kweli.co';
  }

  /**
   * Register a product and create a batch of serialized units.
   */
  async registerProduct(organizationId: string, dto: RegisterProductDto) {
    // 1. Find or create the default brand for this organization
    let brand = await this.prisma.brand.findFirst({
      where: { organizationId },
    });

    if (!brand) {
      brand = await this.prisma.brand.create({
        data: {
          organizationId,
          name: dto.manufacturer || 'Default Brand',
        },
      });
    }

    try {
      // 2. Find or create the Product definition
      let product = dto.productId
        ? await this.prisma.product.findFirst({
            where: { id: dto.productId, brandId: brand.id },
          })
        : null;

      if (!product) {
        product = await this.prisma.product.findFirst({
          where: {
            brandId: brand.id,
            name: dto.name,
          },
        });
      }

      if (!product) {
        product = await this.prisma.product.create({
          data: {
            brandId: brand.id,
            name: dto.name,
            sku: dto.sku || null,
            category: dto.category || null,
            description: dto.description || null,
          },
        });
      }

      // 3. Create the ProductBatch
      const batch = await this.prisma.productBatch.create({
        data: {
          productId: product.id,
          batchNumber: dto.batchNumber,
          batchSize: dto.batchSize,
          mfgDate: dto.manufacturingDate ? new Date(dto.manufacturingDate) : null,
          expDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        },
      });

      // 4. Generate serialized units with dual-layer security (Public Serial + Scratch PIN)
      await this.generateUnits(batch.id, dto.batchSize);

      return {
        product,
        batch,
      };
    } catch (error: any) {
      this.logger.error('Failed to register product batch', error.stack);
      throw new InternalServerErrorException(
        `Failed to register product: ${error.message}`,
      );
    }
  }

  /**
   * Generates serialized units with hashed scratch PINs in chunks.
   * Stores both cryptographic SHA-256 hash (for zero-knowledge verification)
   * and AES-256-GCM encrypted PIN (for brand packaging printing export).
   */
  private async generateUnits(batchId: string, count: number) {
    const CHUNK_SIZE = 500;

    for (let i = 0; i < count; i += CHUNK_SIZE) {
      const currentBatchSize = Math.min(CHUNK_SIZE, count - i);
      const unitsData = Array.from({ length: currentBatchSize }).map(() => {
        const publicSerial = 'KW' + crypto.randomBytes(6).toString('hex').toUpperCase();
        // 6-digit numeric scratch-off PIN
        const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
        const scratchPinHash = crypto.createHash('sha256').update(rawPin).digest('hex');
        const scratchPinEncrypted = encryptText(rawPin, this.secretKey);

        return {
          batchId,
          publicSerial,
          scratchPinHash,
          scratchPinEncrypted,
          status: UnitStatus.ISSUED,
          scanCount: 0,
        };
      });

      await this.prisma.productUnit.createMany({ data: unitsData });
    }
  }

  /**
   * List all products belonging to an organization.
   */
  async getProducts(organizationId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { brand: { organizationId } },
        include: {
          brand: true,
          batches: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({
        where: { brand: { organizationId } },
      }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Product statistics for an organization.
   */
  async getProductStats(organizationId: string) {
    const [totalProducts, totalUnits, scannedUnits, fraudAttempts, recentScans] =
      await Promise.all([
        this.prisma.product.count({
          where: { brand: { organizationId } },
        }),
        this.prisma.productUnit.count({
          where: { batch: { product: { brand: { organizationId } } } },
        }),
        this.prisma.scanEvent.count({
          where: {
            unit: { batch: { product: { brand: { organizationId } } } },
          },
        }),
        this.prisma.scanEvent.count({
          where: {
            unit: { batch: { product: { brand: { organizationId } } } },
            outcome: {
              in: ['SUSPICIOUS_REPETITION', 'ALREADY_ACTIVATED_WARNING'],
            },
          },
        }),
        this.prisma.scanEvent.findMany({
          where: {
            unit: { batch: { product: { brand: { organizationId } } } },
          },
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: {
            unit: {
              include: {
                batch: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        }),
      ]);

    return {
      totalProducts,
      totalUnits,
      totalScans: scannedUnits,
      fraudAttempts,
      scanRate: totalUnits > 0 ? (scannedUnits / totalUnits) * 100 : 0,
      recentScans: recentScans.map((s) => ({
        id: s.id,
        publicSerial: s.unit?.publicSerial || s.rawCodeInput || 'UNKNOWN',
        productName: s.unit?.batch?.product?.name || 'Unidentified Item',
        batchNumber: s.unit?.batch?.batchNumber || 'N/A',
        outcome: s.outcome,
        maskedIp: s.maskedIp,
        scannedAt: s.createdAt,
      })),
    };
  }

  /**
   * Get single batch details.
   */
  async getBatch(organizationId: string, batchId: string) {
    const batch = await this.prisma.productBatch.findFirst({
      where: {
        id: batchId,
        product: { brand: { organizationId } },
      },
      include: {
        product: true,
        _count: {
          select: { units: true },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch ${batchId} not found`);
    }

    return batch;
  }

  /**
   * Export batch as CSV string for industrial packaging printing.
   */
  async exportBatchCsv(organizationId: string, batchId: string) {
    const batch = await this.prisma.productBatch.findFirst({
      where: {
        id: batchId,
        product: { brand: { organizationId } },
      },
      include: {
        product: true,
        units: true,
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch ${batchId} not found`);
    }

    const headers = [
      'Batch Number',
      'Product Name',
      'SKU',
      'Public Serial',
      'Verification URL',
      'Scratch PIN',
      'Status',
      'Created At',
    ];

    const rows = batch.units.map((unit) => {
      let pin = '[ENCRYPTED]';
      if (unit.scratchPinEncrypted) {
        try {
          pin = decryptText(unit.scratchPinEncrypted, this.secretKey);
        } catch {
          pin = 'N/A';
        }
      }
      const verificationUrl = `${this.frontendUrl}/v/${unit.publicSerial}`;

      return [
        `"${batch.batchNumber}"`,
        `"${batch.product.name}"`,
        `"${batch.product.sku || ''}"`,
        `"${unit.publicSerial}"`,
        `"${verificationUrl}"`,
        `"${pin}"`,
        `"${unit.status}"`,
        `"${unit.createdAt.toISOString()}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    return {
      filename: `batch-${batch.batchNumber}.csv`,
      csvContent,
      batchNumber: batch.batchNumber,
    };
  }

  /**
   * Export batch as ZIP archive containing manifest.csv + print-ready QR PNGs.
   */
  async exportBatchZip(
    organizationId: string,
    batchId: string,
  ): Promise<{ filename: string; archiveStream: PassThrough }> {
    const batch = await this.prisma.productBatch.findFirst({
      where: {
        id: batchId,
        product: { brand: { organizationId } },
      },
      include: {
        product: true,
        units: true,
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch ${batchId} not found`);
    }

    const passThrough = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(passThrough);

    // 1. Generate Manifest CSV
    const headers = [
      'Batch Number',
      'Product Name',
      'SKU',
      'Public Serial',
      'Verification URL',
      'Scratch PIN',
      'Status',
    ];

    const rows = batch.units.map((unit) => {
      let pin = '[ENCRYPTED]';
      if (unit.scratchPinEncrypted) {
        try {
          pin = decryptText(unit.scratchPinEncrypted, this.secretKey);
        } catch {
          pin = 'N/A';
        }
      }
      const verificationUrl = `${this.frontendUrl}/v/${unit.publicSerial}`;

      return [
        `"${batch.batchNumber}"`,
        `"${batch.product.name}"`,
        `"${batch.product.sku || ''}"`,
        `"${unit.publicSerial}"`,
        `"${verificationUrl}"`,
        `"${pin}"`,
        `"${unit.status}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    archive.append(csvContent, { name: 'manifest.csv' });

    // 2. Generate QR PNG images in qr_codes/ folder
    for (const unit of batch.units) {
      const verificationUrl = `${this.frontendUrl}/v/${unit.publicSerial}`;
      try {
        const qrBuffer = await this.qrGenerator.generateBuffer(verificationUrl, 400);
        archive.append(qrBuffer, {
          name: `qr_codes/${unit.publicSerial}.png`,
        });
      } catch (err: any) {
        this.logger.warn(`Failed to generate QR for unit ${unit.publicSerial}: ${err.message}`);
      }
    }

    archive.finalize();

    return {
      filename: `batch-${batch.batchNumber}.zip`,
      archiveStream: passThrough,
    };
  }

  /**
   * Export batch as a high-resolution, print-ready PDF label sheet (Avery / Industrial template).
   */
  async exportBatchPdf(
    organizationId: string,
    batchId: string,
    template: LabelTemplateType = 'a4-2x5',
  ): Promise<{ filename: string; pdfBuffer: Buffer; batchNumber: string }> {
    const batch = await this.prisma.productBatch.findFirst({
      where: {
        id: batchId,
        product: { brand: { organizationId } },
      },
      include: {
        product: {
          include: { brand: true },
        },
        units: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch ${batchId} not found`);
    }

    const unitItems = batch.units.map((unit) => {
      let pin: string | null = null;
      if (unit.scratchPinEncrypted) {
        try {
          pin = decryptText(unit.scratchPinEncrypted, this.secretKey);
        } catch {
          pin = null;
        }
      }

      return {
        publicSerial: unit.publicSerial,
        scratchPin: pin,
      };
    });

    const pdfBuffer = await this.labelSheetService.generateLabelSheetPdf({
      brandName: batch.product.brand.name,
      productName: batch.product.name,
      sku: batch.product.sku,
      batchNumber: batch.batchNumber,
      mfgDate: batch.mfgDate,
      expDate: batch.expDate,
      units: unitItems,
      frontendUrl: this.frontendUrl,
      template,
      includeCutMarks: true,
    });

    return {
      filename: `labels-${batch.batchNumber}-${template}.pdf`,
      pdfBuffer,
      batchNumber: batch.batchNumber,
    };
  }
}
