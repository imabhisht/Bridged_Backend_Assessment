import { Injectable } from "@nestjs/common";
import { createClient } from "redis";
import { CacheService } from "../../domain/interfaces/cache-service.interface";

@Injectable()
export class RedisService implements CacheService {
  private client: ReturnType<typeof createClient>;

  constructor() {
    const url = this.buildRedisUrl();
    this.client = createClient({ url });
    this.client.connect();
  }

  private buildRedisUrl(): string {
    const host = process.env.REDIS_HOST || "localhost";
    const port = process.env.REDIS_PORT || "6379";
    const username = process.env.REDIS_USERNAME || undefined;
    const password = process.env.REDIS_PASSWORD || undefined;
    const db = process.env.REDIS_DB || "0";
    let auth = "";
    if (username && password) {
      auth = `${username}:${password}@`;
    } else if (password) {
      auth = `:${password}@`;
    }
    return `redis://${auth}${host}:${port}/${db}`;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }
}
