import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from '../../modules/api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check X-API-Key header or Bearer token starting with kw_live_
    let rawKey = request.headers['x-api-key'] as string;

    if (!rawKey) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer kw_')) {
        rawKey = authHeader.substring(7);
      }
    }

    if (!rawKey) {
      throw new UnauthorizedException('API key is missing');
    }

    const validated = await this.apiKeysService.validateApiKey(rawKey);
    if (!validated) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    request.organization = validated.organization;
    request.apiKeyId = validated.keyId;

    return true;
  }
}
