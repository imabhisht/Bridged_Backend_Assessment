import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Analytics } from "../../domain/entities/analytics.entity";
import { AnalyticsRepository } from "../../domain/interfaces/analytics-repository.interface";
import { AnalyticsDocument } from "../database/schemas/analytics.schema";

@Injectable()
export class AnalyticsMongoRepository implements AnalyticsRepository {
  constructor(
    @InjectModel("Analytics") private analyticsModel: Model<AnalyticsDocument>
  ) {}

  async logHit(analytics: Analytics): Promise<void> {
    await this.analyticsModel.create(analytics);
  }

  async getStats(shortCode: string): Promise<{
    totalClicks: number;
    dailyClicks: { date: string; count: number }[];
    referrers: { referrer: string; count: number }[];
    countries?: { country: string; count: number }[];
  }> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 29); // last 30 days

    // Total clicks
    const totalClicks = await this.analyticsModel.countDocuments({ shortCode });

    // Clicks per day (last 30 days)
    const dailyClicksAgg = await this.analyticsModel.aggregate([
      { $match: { shortCode, timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const dailyClicks = dailyClicksAgg.map((d) => ({ date: d._id, count: d.count }));

    // Referrer breakdown
    const referrersAgg = await this.analyticsModel.aggregate([
      { $match: { shortCode } },
      {
        $group: {
          _id: "$referrer",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);
    const referrers = referrersAgg.map((r) => ({ referrer: r._id || "direct", count: r.count }));

    // Country breakdown (optional)
    const countriesAgg = await this.analyticsModel.aggregate([
      { $match: { shortCode, country: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$country",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);
    const countries = countriesAgg.map((c) => ({ country: c._id, count: c.count }));

    return {
      totalClicks,
      dailyClicks,
      referrers,
      countries,
    };
  }
}
