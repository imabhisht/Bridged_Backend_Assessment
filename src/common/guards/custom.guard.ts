import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class BearerAuthGuard implements CanActivate {
  private readonly jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  private readonly requiredRoles: string[];

  constructor(...roles: string[]) {
    this.requiredRoles = roles;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Bearer token not found');
    }

    try {
      const payload = jwt.verify(token, this.jwtSecret) as any;
      
      // Check if roles are required and validate
      if (this.requiredRoles.length > 0) {
        const userRoles = payload.roles || [];
        const hasRequiredRole = this.requiredRoles.some(role => 
          userRoles.includes(role)
        );
        
        if (!hasRequiredRole) {
          throw new ForbiddenException('Insufficient permissions');
        }
      }
      
      // Attach user payload to request object for use in controllers
      request['user'] = payload;
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    
    if (type !== 'Bearer' || !token) {
      return undefined;
    }

    return token;
  }
}