import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../core/database/prisma.service';
import { ProductVerifierService } from '../../core/ai/product-verifier.service';
import { VerifyProductAiDto, ScanProductDto } from './dto/verify-product.dto';
import { VerificationOutcome, UnitStatus } from '@prisma/client';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiVerifier: ProductVerifierService,
  ) {}

  /**
   * AI Packaging Inspection (Assistive Visual Check - Not Definitive Authenticity Proof).
   */
  async verifyWithAi(userId: string | null, dto: VerifyProductAiDto) {
    const result = await this.aiVerifier.verifyProduct(dto.imageBase64);

    return {
      visualAnalysis: result,
      disclaimer:
        'Visual AI inspection checks packaging appearance against typical genuine markers. It does not certify physical chemical authenticity.',
    };
  }

  /**
   * Dual-layer Verification: Public Serial + Scratch-off PIN.
   */
  async scanQrCode(
    userId: string | null,
    dto: ScanProductDto,
  ) {
    const rawCode = (dto.code || '').trim();

    // 1. Look up unit by public serial code
    const unit = await this.prisma.productUnit.findFirst({
      where: { publicSerial: rawCode },
      include: {
        batch: {
          include: {
            product: {
              include: {
                brand: true,
              },
            },
          },
        },
      },
    });

    const maskedIp = dto.ipAddress ? dto.ipAddress.split('.').slice(0, 3).join('.') + '.xxx' : null;

    // Unknown code outcome
    if (!unit) {
      await this.prisma.scanEvent.create({
        data: {
          rawCodeInput: rawCode,
          outcome: VerificationOutcome.INVALID_OR_UNKNOWN_CODE,
          maskedIp,
          userAgent: dto.userAgent || null,
        },
      });

      return {
        isAuthentic: false,
        outcome: VerificationOutcome.INVALID_OR_UNKNOWN_CODE,
        message: 'Unrecognized product code. This item is not registered in the Kweli registry.',
        product: null,
      };
    }

    // Recalled batch outcome
    if (unit.batch.isRecalled) {
      await this.prisma.scanEvent.create({
        data: {
          unitId: unit.id,
          rawCodeInput: rawCode,
          outcome: VerificationOutcome.PRODUCT_RECALLED,
          maskedIp,
          userAgent: dto.userAgent || null,
        },
      });

      return {
        isAuthentic: false,
        outcome: VerificationOutcome.PRODUCT_RECALLED,
        message: 'CRITICAL ALERT: This product batch has been officially recalled by the manufacturer.',
        product: this.formatProductPayload(unit),
      };
    }

    // Verify scratch PIN if provided
    let scratchPinValid: boolean | null = null;
    if (dto.scratchPin) {
      const pinHash = crypto.createHash('sha256').update(dto.scratchPin.trim()).digest('hex');
      scratchPinValid = unit.scratchPinHash === pinHash;

      if (!scratchPinValid) {
        return {
          isAuthentic: false,
          outcome: VerificationOutcome.SUSPICIOUS_REPETITION,
          message: 'The scratch-off security PIN provided is incorrect for this serial number.',
          product: this.formatProductPayload(unit),
        };
      }
    }

    // Determine verification outcome based on unit history
    let outcome: VerificationOutcome;
    let nextStatus: UnitStatus = unit.status;

    if (unit.scanCount === 0) {
      outcome = VerificationOutcome.AUTHENTIC_FIRST_SCAN;
      nextStatus = UnitStatus.ACTIVATED;
    } else if (unit.scanCount <= 3) {
      outcome = VerificationOutcome.ALREADY_ACTIVATED_WARNING;
    } else {
      outcome = VerificationOutcome.SUSPICIOUS_REPETITION;
      nextStatus = UnitStatus.FLAGGED_SUSPICIOUS;
    }

    const nextScanCount = unit.scanCount + 1;

    // Update unit status & counter
    await this.prisma.productUnit.update({
      where: { id: unit.id },
      data: {
        scanCount: nextScanCount,
        status: nextStatus,
        firstScannedAt: unit.firstScannedAt || new Date(),
      },
    });

    // Record audit telemetry scan event
    await this.prisma.scanEvent.create({
      data: {
        unitId: unit.id,
        rawCodeInput: rawCode,
        outcome,
        maskedIp,
        userAgent: dto.userAgent || null,
      },
    });

    return {
      isAuthentic: outcome === VerificationOutcome.AUTHENTIC_FIRST_SCAN,
      outcome,
      scanCount: nextScanCount,
      firstScannedAt: unit.firstScannedAt || new Date(),
      scratchPinVerified: scratchPinValid,
      message: this.getOutcomeMessage(outcome, nextScanCount),
      product: this.formatProductPayload(unit),
    };
  }

  private formatProductPayload(unit: any) {
    const { batch } = unit;
    const { product } = batch;
    const { brand } = product;

    return {
      name: product.name,
      brand: brand.name,
      sku: product.sku,
      category: product.category,
      batchNumber: batch.batchNumber,
      mfgDate: batch.mfgDate,
      expDate: batch.expDate,
      unitSerial: unit.publicSerial,
    };
  }

  private getOutcomeMessage(outcome: VerificationOutcome, count: number): string {
    switch (outcome) {
      case VerificationOutcome.AUTHENTIC_FIRST_SCAN:
        return 'Authentic product verified! This is the first recorded scan for this unique serialized item.';
      case VerificationOutcome.ALREADY_ACTIVATED_WARNING:
        return `Notice: This code has already been scanned ${count} times. Verify that you previously scanned it or unsealed the box yourself.`;
      case VerificationOutcome.SUSPICIOUS_REPETITION:
        return `High Suspicion Warning: This security code has been scanned ${count} times across multiple sessions. Potential copied identifier.`;
      default:
        return 'Verification complete.';
    }
  }
}
