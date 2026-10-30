import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  Res,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ProductsService } from './products.service';
import { RegisterProductDto } from './dto/register-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LabelTemplateType } from '../../core/pdf/label-sheet.service';

@ApiTags('Products')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new product batch' })
  async registerProduct(
    @CurrentUser() user: any,
    @Body() dto: RegisterProductDto,
  ) {
    const orgId = user.memberships?.[0]?.organization?.id;
    if (!orgId) {
      throw new ForbiddenException(
        'User is not associated with any organization',
      );
    }
    return this.productsService.registerProduct(orgId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all products' })
  async getProducts(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const orgId = user.memberships?.[0]?.organization?.id;
    if (!orgId) {
      throw new ForbiddenException(
        'User is not associated with any organization',
      );
    }
    const pageNum = parseInt(page || '1', 10) || 1;
    const limitNum = parseInt(limit || '20', 10) || 20;
    return this.productsService.getProducts(orgId, pageNum, limitNum);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get product statistics' })
  async getStats(@CurrentUser() user: any) {
    const orgId = user.memberships?.[0]?.organization?.id;
    if (!orgId) {
      throw new ForbiddenException(
        'User is not associated with any organization',
      );
    }
    return this.productsService.getProductStats(orgId);
  }

  @Get('batches/:batchId')
  @ApiOperation({ summary: 'Get batch details by ID' })
  async getBatch(
    @CurrentUser() user: any,
    @Param('batchId') batchId: string,
  ) {
    const orgId = user.memberships?.[0]?.organization?.id;
    if (!orgId) {
      throw new ForbiddenException(
        'User is not associated with any organization',
      );
    }
    return this.productsService.getBatch(orgId, batchId);
  }

  @Get('batches/:batchId/export')
  @ApiOperation({
    summary:
      'Export batch as CSV, ZIP containing QR codes, or Avery/Industrial print-ready PDF label sheets',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['csv', 'zip', 'pdf'],
    description: 'Export format (csv, zip, or pdf)',
  })
  @ApiQuery({
    name: 'template',
    required: false,
    enum: ['a4-2x5', 'a4-3x8', 'avery5160'],
    description: 'Label template layout for PDF exports (default: a4-2x5)',
  })
  async exportBatch(
    @CurrentUser() user: any,
    @Param('batchId') batchId: string,
    @Query('format') format: string = 'csv',
    @Query('template') template: string = 'a4-2x5',
    @Res() res: Response,
  ) {
    const orgId = user.memberships?.[0]?.organization?.id;
    if (!orgId) {
      throw new ForbiddenException(
        'User is not associated with any organization',
      );
    }

    if (format === 'zip') {
      const { filename, archiveStream } = await this.productsService.exportBatchZip(
        orgId,
        batchId,
      );
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      archiveStream.pipe(res);
    } else if (format === 'pdf') {
      const validTemplate: LabelTemplateType = [
        'a4-2x5',
        'a4-3x8',
        'avery5160',
      ].includes(template)
        ? (template as LabelTemplateType)
        : 'a4-2x5';

      const { filename, pdfBuffer } = await this.productsService.exportBatchPdf(
        orgId,
        batchId,
        validTemplate,
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      res.status(200).send(pdfBuffer);
    } else {
      const { filename, csvContent } = await this.productsService.exportBatchCsv(
        orgId,
        batchId,
      );
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    }
  }
}
