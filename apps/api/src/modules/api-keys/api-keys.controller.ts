import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('API Keys')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new developer API key for external integrations' })
  async createApiKey(
    @CurrentUser() user: any,
    @Body() dto: CreateApiKeyDto,
  ) {
    const orgId = user.memberships?.[0]?.organization?.id;
    if (!orgId) {
      throw new ForbiddenException('User is not associated with any organization');
    }
    return this.apiKeysService.createApiKey(orgId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List active developer API keys for the current organization' })
  async listApiKeys(@CurrentUser() user: any) {
    const orgId = user.memberships?.[0]?.organization?.id;
    if (!orgId) {
      throw new ForbiddenException('User is not associated with any organization');
    }
    return this.apiKeysService.listApiKeys(orgId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API key' })
  async revokeApiKey(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const orgId = user.memberships?.[0]?.organization?.id;
    if (!orgId) {
      throw new ForbiddenException('User is not associated with any organization');
    }
    return this.apiKeysService.revokeApiKey(orgId, id);
  }
}
