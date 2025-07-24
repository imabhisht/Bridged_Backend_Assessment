import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (user && user.is_admin === true) {
      return true;
    }
    
    throw new ForbiddenException('Access denied: Admin privileges required');
  }
}
