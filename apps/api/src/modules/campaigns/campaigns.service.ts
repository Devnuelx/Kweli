import { Injectable, Logger } from '@nestjs/common';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  async createCampaign(organizationId: string, dto: CreateCampaignDto) {
    this.logger.log(`Campaign creation queued for Org ${organizationId}: ${dto.name}`);
    return {
      status: 'SCHEDULED_FOR_RELEASE',
      message:
        'Campaign module is in private beta staging. Promotional campaigns will be activated once product batch verification is initialized.',
      campaign: {
        name: dto.name,
        type: dto.type || 'instant_win',
        organizationId,
      },
    };
  }

  async getCampaigns(organizationId: string) {
    return {
      data: [],
      meta: { total: 0, organizationId, status: 'CAMPAIGNS_STAGING' },
    };
  }

  async getCampaignStats(organizationId: string, campaignId: string) {
    return {
      campaignId,
      organizationId,
      impressions: 0,
      scans: 0,
      rewardsClaimed: 0,
      status: 'STAGING',
    };
  }
}
