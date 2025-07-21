import { Injectable, Inject } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { AnalyticsRepository } from '../../domain/interfaces/analytics-repository.interface';

@Injectable()
export class AnalyticsProcessor {
  private worker: Worker;

  constructor(
    @Inject('AnalyticsRepository') private readonly analyticsRepository: AnalyticsRepository
  ) {
    this.worker = new Worker(
      'analytics',
      async (job: Job) => {
        await this.analyticsRepository.logHit(job.data);
      },
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD,
        },
      }
    );
  }
} 