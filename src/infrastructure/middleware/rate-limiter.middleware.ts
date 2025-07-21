import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { RedisService } from "../cache/redis.service";

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  constructor(private readonly redisService: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    let key: string;
    // If authenticated, use userId for rate limiting, else use IP
    if ((req as any).user && (req as any).user.userId) {
      key = `rate-limit:user:${(req as any).user.userId}`;
    } else {
      const ip = req.ip;
      key = `rate-limit:ip:${ip}`;
    }
    const requests = await this.redisService.get(key);
    const count = requests ? parseInt(requests) : 0;

    if (count >= 100) {
      throw new HttpException(
        "Rate limit exceeded",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    await this.redisService.set(key, (count + 1).toString(), 60); // 1-minute TTL
    next();
  }
}
