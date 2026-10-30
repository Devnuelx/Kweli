import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a new API key for an organization.
   * Format: kw_live_<48 hex chars>
   * Only the SHA-256 hash and prefix are persisted.
   */
  async createApiKey(organizationId: string, dto: CreateApiKeyDto) {
    const rawKey = 'kw_live_' + crypto.randomBytes(24).toString('hex');
    const keyPrefix = rawKey.slice(0, 12); // "kw_live_xxxx"
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const record = await this.prisma.apiKey.create({
      data: {
        organizationId,
        keyPrefix,
        keyHash,
        name: dto.name,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
      },
    });

    return {
      ...record,
      apiKey: rawKey, // Returned ONLY once upon creation
    };
  }

  /**
   * List all active API keys for an organization.
   */
  async listApiKeys(organizationId: string) {
    return this.prisma.apiKey.findMany({
      where: {
        organizationId,
        isRevoked: false,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Revoke an API key.
   */
  async revokeApiKey(organizationId: string, keyId: string) {
    const existing = await this.prisma.apiKey.findFirst({
      where: {
        id: keyId,
        organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundException(`API key ${keyId} not found`);
    }

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isRevoked: true },
    });

    return { success: true, message: 'API key revoked successfully' };
  }

  /**
   * Authenticate a request using an API key.
   * Called by ApiKeyGuard.
   */
  async validateApiKey(rawKey: string) {
    if (!rawKey.startsWith('kw_live_') && !rawKey.startsWith('kw_test_')) {
      return null;
    }

    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const keyRecord = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        organization: {
          include: {
            brands: true,
          },
        },
      },
    });

    if (!keyRecord || keyRecord.isRevoked) {
      return null;
    }

    // Update lastUsedAt asynchronously without blocking
    this.prisma.apiKey
      .update({
        where: { id: keyRecord.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((err) => this.logger.error(`Failed to update lastUsedAt: ${err.message}`));

    return {
      organization: keyRecord.organization,
      keyId: keyRecord.id,
      name: keyRecord.name,
    };
  }
}
