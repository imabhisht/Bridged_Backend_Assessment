import { Queue } from 'bullmq';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsQueue {
  public queue: Queue;

  constructor() {
    this.queue = new Queue('analytics', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
      },
    });
  }
} 