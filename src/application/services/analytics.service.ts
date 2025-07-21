import { Injectable, Inject } from "@nestjs/common";
import { AnalyticsRepository } from "../../domain/interfaces/analytics-repository.interface";
import { Analytics } from "../../domain/entities/analytics.entity";
import { getCountryFromIp } from "../../common/utils/ip-geo.util";
import { AnalyticsQueue } from '../../infrastructure/queue/analytics.queue';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject("AnalyticsRepository") private readonly analyticsRepository: AnalyticsRepository,
    private readonly analyticsQueue: AnalyticsQueue
  ) {}

  async logHit(
    shortCode: string,
    referrer: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<void> {
    const country = await getCountryFromIp(ipAddress); // Optional: IP geolocation
    const analytics = {
      shortCode,
      timestamp: new Date(),
      referrer,
      ipAddress,
      country,
      userAgent,
    };
    await this.analyticsQueue.queue.add('log', analytics);
  }

  async getStats(shortCode: string) {
    return this.analyticsRepository.getStats(shortCode);
  }
}
