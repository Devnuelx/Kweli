import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly adminEmails: string[];

  constructor(private readonly configService: ConfigService) {
    const emails = this.configService.get<string>('ADMIN_EMAILS', '');
    this.adminEmails = emails
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as Record<string, any> | undefined;

    if (!user) {
      throw new ForbiddenException('Access denied: authentication required');
    }

    if (user.isAdmin === true) {
      return true;
    }

    if (
      user.email &&
      this.adminEmails.includes(String(user.email).toLowerCase())
    ) {
      return true;
    }

    throw new ForbiddenException('Access denied: admin privileges required');
  }
}
