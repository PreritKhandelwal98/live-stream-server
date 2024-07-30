import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard as NestAuthGuard } from '@nestjs/passport';

@Injectable()
export class AuthGuard extends NestAuthGuard('jwt') implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return super.canActivate(context) as boolean;
  }
}
