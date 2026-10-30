import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb, grayscale, PDFPage, PDFFont } from 'pdf-lib';
import { QrGeneratorService } from '../qr/qr-generator.service';

export type LabelTemplateType = 'a4-2x5' | 'a4-3x8' | 'avery5160';

export interface LabelTemplateConfig {
  name: string;
  pageWidth: number;   // in points (72 points = 1 inch)
  pageHeight: number;
  columns: number;
  rows: number;
  labelWidth: number;
  labelHeight: number;
  leftMargin: number;
  topMargin: number;
  horizGap: number;
  vertGap: number;
}

export interface UnitLabelItem {
  publicSerial: string;
  scratchPin?: string | null;
}

export interface GenerateLabelSheetOptions {
  brandName: string;
  productName: string;
  sku?: string | null;
  batchNumber: string;
  mfgDate?: Date | string | null;
  expDate?: Date | string | null;
  units: UnitLabelItem[];
  frontendUrl?: string;
  template?: LabelTemplateType;
  includeCutMarks?: boolean;
}

export const TEMPLATE_CONFIGS: Record<LabelTemplateType, LabelTemplateConfig> = {
  // A4 Page: 595.28 x 841.89 pt (210 x 297 mm)
  // Avery L7173 (10 labels: 2 cols x 5 rows, 99.1 x 57 mm = 280.9 x 161.6 pt)
  'a4-2x5': {
    name: 'A4 2x5 (Avery L7173 - 10 Labels)',
    pageWidth: 595.28,
    pageHeight: 841.89,
    columns: 2,
    rows: 5,
    labelWidth: 280.9,
    labelHeight: 161.6,
    leftMargin: 13.2,
    topMargin: 17.0,
    horizGap: 7.1,
    vertGap: 0,
  },
  // A4 Page: 595.28 x 841.89 pt
  // Avery L7159 (24 labels: 3 cols x 8 rows, 63.5 x 33.9 mm = 180.0 x 96.1 pt)
  'a4-3x8': {
    name: 'A4 3x8 (Avery L7159 - 24 Labels)',
    pageWidth: 595.28,
    pageHeight: 841.89,
    columns: 3,
    rows: 8,
    labelWidth: 180.0,
    labelHeight: 96.1,
    leftMargin: 20.4,
    topMargin: 36.8,
    horizGap: 7.1,
    vertGap: 0,
  },
  // US Letter: 612 x 792 pt (8.5 x 11 in)
  // Avery 5160 / 5260 (30 labels: 3 cols x 10 rows, 2.625 x 1.0 in = 189.0 x 72.0 pt)
  avery5160: {
    name: 'US Letter 3x10 (Avery 5160 - 30 Labels)',
    pageWidth: 612.0,
    pageHeight: 792.0,
    columns: 3,
    rows: 10,
    labelWidth: 189.0,
    labelHeight: 72.0,
    leftMargin: 13.5,
    topMargin: 36.0,
    horizGap: 9.0,
    vertGap: 0,
  },
};

@Injectable()
export class LabelSheetService {
  private readonly logger = new Logger(LabelSheetService.name);

  constructor(private readonly qrGenerator: QrGeneratorService) {}

  /**
   * Generates a multi-page PDF label sheet for industrial printing.
   */
  async generateLabelSheetPdf(options: GenerateLabelSheetOptions): Promise<Buffer> {
    const templateType = options.template || 'a4-2x5';
    const config = TEMPLATE_CONFIGS[templateType] || TEMPLATE_CONFIGS['a4-2x5'];
    const baseUrl = options.frontendUrl || 'https://kweli.co';

    try {
      const pdfDoc = await PDFDocument.create();

      // Standard fonts built into all PDF viewers
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

      const labelsPerPage = config.columns * config.rows;
      const totalPages = Math.ceil(options.units.length / labelsPerPage) || 1;

      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        const page = pdfDoc.addPage([config.pageWidth, config.pageHeight]);
        const startIdx = pageIdx * labelsPerPage;
        const pageUnits = options.units.slice(startIdx, startIdx + labelsPerPage);

        // Header / Footer metadata outside label areas
        this.renderSheetHeaderFooter(
          page,
          config,
          options,
          pageIdx + 1,
          totalPages,
          fontRegular,
          fontBold,
        );

        // Render each label on the grid
        for (let i = 0; i < pageUnits.length; i++) {
          const unit = pageUnits[i];
          const col = i % config.columns;
          const row = Math.floor(i / config.columns);

          const x = config.leftMargin + col * (config.labelWidth + config.horizGap);
          // In PDF, Y=0 is bottom, so subtract from top
          const y =
            config.pageHeight -
            config.topMargin -
            (row + 1) * config.labelHeight -
            row * config.vertGap;

          await this.renderLabel(
            pdfDoc,
            page,
            unit,
            x,
            y,
            config,
            options,
            baseUrl,
            templateType,
            fontRegular,
            fontBold,
            fontMono,
          );
        }
      }

      pdfDoc.setTitle(`${options.productName} - Batch ${options.batchNumber} Labels`);
      pdfDoc.setAuthor('Kweli Product Authentication Platform');
      pdfDoc.setSubject(`Avery/Industrial Label Sheets - ${config.name}`);
      pdfDoc.setCreationDate(new Date());

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (err: any) {
      this.logger.error(`Failed to generate label sheet PDF: ${err.message}`, err.stack);
      throw new InternalServerErrorException(`Failed to generate label sheet PDF: ${err.message}`);
    }
  }

  /**
   * Renders sheet header & footer metadata.
   */
  private renderSheetHeaderFooter(
    page: PDFPage,
    config: LabelTemplateConfig,
    options: GenerateLabelSheetOptions,
    currentPage: number,
    totalPages: number,
    fontRegular: PDFFont,
    fontBold: PDFFont,
  ) {
    const headerText = `KWELI SECURITY LABELS • ${options.brandName} • Batch #${options.batchNumber}`;
    const pageText = `Page ${currentPage} of ${totalPages} (${config.name})`;

    // Top margin header text
    if (config.topMargin >= 20) {
      page.drawText(headerText, {
        x: config.leftMargin,
        y: config.pageHeight - 14,
        size: 7,
        font: fontBold,
        color: rgb(0.3, 0.4, 0.5),
      });

      const pageTextWidth = fontRegular.widthOfTextAtSize(pageText, 7);
      page.drawText(pageText, {
        x: config.pageWidth - config.leftMargin - pageTextWidth,
        y: config.pageHeight - 14,
        size: 7,
        font: fontRegular,
        color: rgb(0.4, 0.4, 0.4),
      });
    }

    // Bottom margin footer text
    page.drawText(
      'GS1 Digital Link + Dual-Layer Physical Scratch PIN • Verify at kweli.co',
      {
        x: config.leftMargin,
        y: 6,
        size: 6,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5),
      },
    );
  }

  /**
   * Renders a single security label item.
   */
  private async renderLabel(
    pdfDoc: PDFDocument,
    page: PDFPage,
    unit: UnitLabelItem,
    x: number,
    y: number,
    config: LabelTemplateConfig,
    options: GenerateLabelSheetOptions,
    baseUrl: string,
    templateType: LabelTemplateType,
    fontRegular: PDFFont,
    fontBold: PDFFont,
    fontMono: PDFFont,
  ) {
    const w = config.labelWidth;
    const h = config.labelHeight;

    // 1. Label border / cutting outline (light dashed or subtle solid border)
    page.drawRectangle({
      x,
      y,
      width: w,
      height: h,
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 0.5,
      color: rgb(1, 1, 1),
    });

    // 2. Generate QR code for this unit's GS1 Digital Link
    const verificationUrl = `${baseUrl}/v/${unit.publicSerial}`;
    const qrBuffer = await this.qrGenerator.generateBuffer(verificationUrl, 250);
    const qrImage = await pdfDoc.embedPng(qrBuffer);

    if (templateType === 'a4-2x5') {
      // Large format (99.1 x 57 mm = 280.9 x 161.6 pt)
      await this.renderLarge2x5Label(
        page,
        qrImage,
        unit,
        x,
        y,
        w,
        h,
        options,
        fontRegular,
        fontBold,
        fontMono,
      );
    } else if (templateType === 'a4-3x8') {
      // Medium format (63.5 x 33.9 mm = 180.0 x 96.1 pt)
      await this.renderMedium3x8Label(
        page,
        qrImage,
        unit,
        x,
        y,
        w,
        h,
        options,
        fontRegular,
        fontBold,
        fontMono,
      );
    } else {
      // Avery 5160 compact format (2.625 x 1.0 in = 189 x 72 pt)
      await this.renderCompact5160Label(
        page,
        qrImage,
        unit,
        x,
        y,
        w,
        h,
        options,
        fontRegular,
        fontBold,
        fontMono,
      );
    }
  }

  /**
   * Render Large 2x5 Label (Avery L7173 - 99.1 x 57 mm).
   * Generates maximum security layout with separate QR, Brand, Serial, and Scratch Box.
   */
  private async renderLarge2x5Label(
    page: PDFPage,
    qrImage: any,
    unit: UnitLabelItem,
    x: number,
    y: number,
    w: number,
    h: number,
    options: GenerateLabelSheetOptions,
    fontRegular: PDFFont,
    fontBold: PDFFont,
    fontMono: PDFFont,
  ) {
    const pad = 8;
    const qrSize = h - pad * 2 - 10; // ~135 pt QR

    // Left Column: QR Code + Scan Instruction
    page.drawImage(qrImage, {
      x: x + pad,
      y: y + pad + 12,
      width: qrSize,
      height: qrSize,
    });

    page.drawText('SCAN WITH CAMERA', {
      x: x + pad + (qrSize - fontBold.widthOfTextAtSize('SCAN WITH CAMERA', 6)) / 2,
      y: y + pad + 3,
      size: 6,
      font: fontBold,
      color: rgb(0.1, 0.4, 0.8),
    });

    // Right Column: Information & Dual-Layer PIN Box
    const textX = x + pad + qrSize + 10;
    const textWidth = w - (pad * 2 + qrSize + 10);
    let curY = y + h - pad - 10;

    // Security Badge
    page.drawRectangle({
      x: textX,
      y: curY - 2,
      width: textWidth,
      height: 14,
      color: rgb(0.93, 0.96, 1.0),
      borderColor: rgb(0.7, 0.8, 0.95),
      borderWidth: 0.5,
    });
    page.drawText('AUTHENTIC PRODUCT SEAL', {
      x: textX + 6,
      y: curY + 2,
      size: 7,
      font: fontBold,
      color: rgb(0.08, 0.35, 0.75),
    });
    curY -= 18;

    // Product Name (truncated to fit)
    const truncatedProductName = this.truncateText(options.productName, fontBold, 11, textWidth);
    page.drawText(truncatedProductName, {
      x: textX,
      y: curY,
      size: 11,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    curY -= 13;

    // Brand / Manufacturer
    const brandLine = `Brand: ${this.truncateText(options.brandName, fontRegular, 8, textWidth - 30)}`;
    page.drawText(brandLine, {
      x: textX,
      y: curY,
      size: 8,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });
    curY -= 12;

    // Batch & Expiry
    const expText = options.expDate ? `Exp: ${this.formatDateShort(options.expDate)}` : '';
    const batchLine = `Batch: ${options.batchNumber}  ${expText}`.trim();
    page.drawText(batchLine, {
      x: textX,
      y: curY,
      size: 8,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });
    curY -= 15;

    // Public Serial Number
    page.drawText(`Serial: ${unit.publicSerial}`, {
      x: textX,
      y: curY,
      size: 9,
      font: fontMono,
      color: rgb(0.1, 0.1, 0.1),
    });
    curY -= 36;

    // Dual-Layer Scratch-off Box
    const boxHeight = 32;
    page.drawRectangle({
      x: textX,
      y: curY,
      width: textWidth,
      height: boxHeight,
      color: rgb(0.97, 0.97, 0.98),
      borderColor: rgb(0.75, 0.78, 0.85),
      borderWidth: 0.75,
    });

    // Scratch instructions header
    page.drawText('SCRATCH FOIL FOR SECURITY PIN', {
      x: textX + 5,
      y: curY + boxHeight - 9,
      size: 5.5,
      font: fontBold,
      color: rgb(0.4, 0.45, 0.55),
    });

    // Plaintext PIN (printed under scratch foil in factory)
    const pinDisplay = unit.scratchPin ? `PIN: ${unit.scratchPin}` : 'PIN: [ PROTECTED ]';
    page.drawText(pinDisplay, {
      x: textX + 5,
      y: curY + 9,
      size: 11,
      font: fontMono,
      color: rgb(0.05, 0.05, 0.05),
    });
  }

  /**
   * Render Medium 3x8 Label (Avery L7159 - 63.5 x 33.9 mm).
   */
  private async renderMedium3x8Label(
    page: PDFPage,
    qrImage: any,
    unit: UnitLabelItem,
    x: number,
    y: number,
    w: number,
    h: number,
    options: GenerateLabelSheetOptions,
    fontRegular: PDFFont,
    fontBold: PDFFont,
    fontMono: PDFFont,
  ) {
    const pad = 5;
    const qrSize = h - pad * 2; // ~86 pt

    // Left: QR Code
    page.drawImage(qrImage, {
      x: x + pad,
      y: y + pad,
      width: qrSize,
      height: qrSize,
    });

    // Right: Text info
    const textX = x + pad + qrSize + 6;
    const textWidth = w - (pad * 2 + qrSize + 6);
    let curY = y + h - pad - 8;

    // Product Name
    const truncatedName = this.truncateText(options.productName, fontBold, 8.5, textWidth);
    page.drawText(truncatedName, {
      x: textX,
      y: curY,
      size: 8.5,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    curY -= 10;

    // Batch & Exp
    const expText = options.expDate ? `• Exp: ${this.formatDateShort(options.expDate)}` : '';
    const batchLine = `B# ${options.batchNumber} ${expText}`;
    page.drawText(this.truncateText(batchLine, fontRegular, 6.5, textWidth), {
      x: textX,
      y: curY,
      size: 6.5,
      font: fontRegular,
      color: rgb(0.35, 0.35, 0.35),
    });
    curY -= 10;

    // Serial
    page.drawText(unit.publicSerial, {
      x: textX,
      y: curY,
      size: 7.5,
      font: fontMono,
      color: rgb(0.1, 0.35, 0.75),
    });
    curY -= 18;

    // Scratch Box
    const boxHeight = 16;
    page.drawRectangle({
      x: textX,
      y: curY,
      width: textWidth,
      height: boxHeight,
      color: rgb(0.96, 0.96, 0.96),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 0.5,
    });

    const pinDisplay = unit.scratchPin ? `PIN: ${unit.scratchPin}` : 'SCRATCH FOIL';
    page.drawText(pinDisplay, {
      x: textX + 4,
      y: curY + 4.5,
      size: 7.5,
      font: fontMono,
      color: rgb(0.1, 0.1, 0.1),
    });
  }

  /**
   * Render Compact 3x10 Label (Avery 5160 - 2.625 x 1.0 in = 189 x 72 pt).
   */
  private async renderCompact5160Label(
    page: PDFPage,
    qrImage: any,
    unit: UnitLabelItem,
    x: number,
    y: number,
    w: number,
    h: number,
    options: GenerateLabelSheetOptions,
    fontRegular: PDFFont,
    fontBold: PDFFont,
    fontMono: PDFFont,
  ) {
    const pad = 4;
    const qrSize = h - pad * 2; // ~64 pt

    // Left: QR Code
    page.drawImage(qrImage, {
      x: x + pad,
      y: y + pad,
      width: qrSize,
      height: qrSize,
    });

    // Right: Content
    const textX = x + pad + qrSize + 5;
    const textWidth = w - (pad * 2 + qrSize + 5);
    let curY = y + h - pad - 7;

    // Product Name
    const truncatedName = this.truncateText(options.productName, fontBold, 8, textWidth);
    page.drawText(truncatedName, {
      x: textX,
      y: curY,
      size: 8,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    curY -= 9;

    // Batch & Serial
    page.drawText(`Batch: ${options.batchNumber}`, {
      x: textX,
      y: curY,
      size: 6.5,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });
    curY -= 9;

    page.drawText(`SN: ${unit.publicSerial}`, {
      x: textX,
      y: curY,
      size: 7,
      font: fontMono,
      color: rgb(0.1, 0.35, 0.75),
    });
    curY -= 15;

    // Scratch Box
    const boxHeight = 13;
    page.drawRectangle({
      x: textX,
      y: curY,
      width: textWidth,
      height: boxHeight,
      color: rgb(0.96, 0.96, 0.96),
      borderColor: rgb(0.75, 0.75, 0.75),
      borderWidth: 0.5,
    });

    const pinDisplay = unit.scratchPin ? `PIN: ${unit.scratchPin}` : 'SCRATCH FOIL';
    page.drawText(pinDisplay, {
      x: textX + 4,
      y: curY + 3.5,
      size: 6.5,
      font: fontMono,
      color: rgb(0.1, 0.1, 0.1),
    });
  }

  /**
   * Helper: Truncates text with ellipsis if it exceeds the maximum width in points.
   */
  private truncateText(text: string, font: PDFFont, size: number, maxWidth: number): string {
    if (!text) return '';
    let current = text;
    if (font.widthOfTextAtSize(current, size) <= maxWidth) {
      return current;
    }
    while (current.length > 3 && font.widthOfTextAtSize(current + '...', size) > maxWidth) {
      current = current.slice(0, -1);
    }
    return current + '...';
  }

  /**
   * Helper: Formats date to MM/YY.
   */
  private formatDateShort(date: Date | string): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${month}/${year}`;
  }
}
