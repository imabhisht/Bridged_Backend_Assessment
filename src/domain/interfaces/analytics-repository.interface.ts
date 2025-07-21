import { Analytics } from "../entities/analytics.entity";

export interface AnalyticsRepository {
  logHit(analytics: Analytics): Promise<void>;
  getStats(shortCode: string): Promise<{
    totalClicks: number;
    dailyClicks: { date: string; count: number }[];
    referrers: { referrer: string; count: number }[];
    countries?: { country: string; count: number }[];
  }>;
}
