import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Campaigns')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new marketing/promotional campaign (Staging)' })
  async createCampaign(
    @CurrentUser() user: any,
    @Body() dto: CreateCampaignDto,
  ) {
    const orgId = user.memberships?.[0]?.organization?.id;
    if (!orgId) {
      throw new ForbiddenException('User is not associated with any organization');
    }
    return this.campaignsService.createCampaign(orgId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all campaigns for the organization' })
  async getCampaigns(@CurrentUser() user: any) {
    const orgId = user.memberships?.[0]?.organization?.id;
    if (!orgId) {
      throw new ForbiddenException('User is not associated with any organization');
    }
    return this.campaignsService.getCampaigns(orgId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get statistics for a specific campaign' })
  async getCampaignStats(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const orgId = user.memberships?.[0]?.organization?.id;
    if (!orgId) {
      throw new ForbiddenException('User is not associated with any organization');
    }
    return this.campaignsService.getCampaignStats(orgId, id);
  }
}
