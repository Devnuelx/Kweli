import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Submit a report for a suspected counterfeit product' })
  async submitReport(
    @CurrentUser() user: any,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.submitReport(user?.id || null, dto);
  }

  @Public()
  @Get('track/:ref')
  @ApiOperation({ summary: 'Track status of a counterfeit investigation by reference' })
  async trackReport(
    @Param('ref') ref: string,
    @Query('secret') secret?: string,
  ) {
    return this.reportsService.getReportByRef(ref, secret);
  }

  @Get('organization')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'List counterfeit reports affecting the authenticated brand organization' })
  async getOrganizationReports(
    @CurrentUser() user: any,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const orgId = user.memberships?.[0]?.organization?.id;
    if (!orgId) {
      throw new ForbiddenException('User is not associated with any organization');
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    return this.reportsService.getOrganizationReports(orgId, pageNum, limitNum);
  }
}
