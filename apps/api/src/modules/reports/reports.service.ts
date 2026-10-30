import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import {
  ReportStatus,
  ReportSubmissionMode,
  PointTransactionType,
} from '@prisma/client';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit a counterfeit report. Supports both anonymous and authenticated submissions.
   */
  async submitReport(userId: string | null, dto: CreateReportDto) {
    try {
      const year = new Date().getFullYear();
      const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const reportRef = `KW-${year}-${randomSuffix}`;
      const accessSecret = crypto.randomBytes(16).toString('hex');

      let unitId: string | null = null;
      if (dto.publicSerial) {
        const unit = await this.prisma.productUnit.findFirst({
          where: { publicSerial: dto.publicSerial.trim() },
        });
        if (unit) unitId = unit.id;
      }

      const report = await this.prisma.report.create({
        data: {
          reportRef,
          accessSecret,
          userId: userId || null,
          unitId,
          productName: dto.productName.trim(),
          brandName: dto.brandName?.trim() || null,
          description: dto.description.trim(),
          purchaseLocation: dto.purchaseLocation?.trim() || null,
          mode: userId
            ? ReportSubmissionMode.AUTHENTICATED
            : ReportSubmissionMode.ANONYMOUS,
          status: ReportStatus.RECEIVED,
        },
      });

      this.logger.log(
        `Report received: ${report.reportRef} (User: ${userId || 'Anonymous'})`,
      );

      return {
        reportRef: report.reportRef,
        accessSecret: report.accessSecret,
        status: report.status,
        productName: report.productName,
        createdAt: report.createdAt,
        message:
          'Your report has been logged in the Kweli investigation registry. Keep your reference code for tracking updates.',
      };
    } catch (error: any) {
      this.logger.error('Failed to submit counterfeit report', error.stack);
      throw new InternalServerErrorException('Failed to submit counterfeit report');
    }
  }

  /**
   * Look up report by reference code and access secret (allows anonymous tracking).
   */
  async getReportByRef(reportRef: string, accessSecret?: string) {
    const report = await this.prisma.report.findUnique({
      where: { reportRef },
      include: {
        evidence: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Report reference not found');
    }

    if (accessSecret && report.accessSecret !== accessSecret) {
      throw new NotFoundException('Invalid access secret for this report');
    }

    return {
      reportRef: report.reportRef,
      status: report.status,
      productName: report.productName,
      brandName: report.brandName,
      purchaseLocation: report.purchaseLocation,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      evidenceCount: report.evidence.length,
    };
  }

  /**
   * List reports matching brands owned by an organization.
   */
  async getOrganizationReports(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const brands = await this.prisma.brand.findMany({
      where: { organizationId },
      select: { name: true },
    });

    const brandNames = brands.map((b) => b.name);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        where: {
          brandName: { in: brandNames, mode: 'insensitive' },
        },
        include: {
          evidence: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.report.count({
        where: {
          brandName: { in: brandNames, mode: 'insensitive' },
        },
      }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Moderator: Substantiate report and credit points safely via the PointLedger.
   */
  async substantiateReport(reportId: string, bonusPoints: number = 25) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { user: true },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status === ReportStatus.SUBSTANTIATED && report.pointsAwarded) {
      return { message: 'Report is already substantiated and points credited' };
    }

    return this.prisma.$transaction(async (tx) => {
      // Update report status
      const updatedReport = await tx.report.update({
        where: { id: reportId },
        data: {
          status: ReportStatus.SUBSTANTIATED,
          pointsAwarded: true,
        },
      });

      // If submitted by authenticated user, credit their point account
      if (report.userId) {
        let account = await tx.pointAccount.findUnique({
          where: { userId: report.userId },
        });

        if (!account) {
          account = await tx.pointAccount.create({
            data: {
              userId: report.userId,
              balance: 0,
              lifetimeEarned: 0,
            },
          });
        }

        const newBalance = account.balance + bonusPoints;
        const newLifetime = account.lifetimeEarned + bonusPoints;

        await tx.pointAccount.update({
          where: { id: account.id },
          data: {
            balance: newBalance,
            lifetimeEarned: newLifetime,
          },
        });

        await tx.pointLedgerEntry.create({
          data: {
            accountId: account.id,
            reportId: report.id,
            idempotencyKey: `substantiate-${report.id}`,
            type: PointTransactionType.REPORT_SUBSTANTIATED_BONUS,
            amount: bonusPoints,
            balanceAfter: newBalance,
            reason: `Substantiated counterfeit report: ${report.reportRef}`,
          },
        });
      }

      return updatedReport;
    });
  }
}
