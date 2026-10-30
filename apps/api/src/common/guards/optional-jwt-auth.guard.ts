import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    _err: any,
    user: TUser | false,
    _info: any,
    context: ExecutionContext,
  ): TUser | null {
    const request = context.switchToHttp().getRequest();

    if (user) {
      request.user = user;
      return user;
    }

    request.user = null;
    return null as any;
  }
}
