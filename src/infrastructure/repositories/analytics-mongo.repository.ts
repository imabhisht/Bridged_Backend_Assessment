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

  async logHit(analytics: Analytics | any): Promise<void> {
    // If not an instance of Analytics, convert
    if (!(analytics instanceof Analytics)) {
      analytics = new Analytics(
        analytics.shortCode,
        analytics.timestamp ? new Date(analytics.timestamp) : new Date(),
        analytics.referrer,
        analytics.ipAddress,
        analytics.country,
        analytics.userAgent
      );
    }
    
    // Use create for single document with lean option for better performance
    await this.analyticsModel.create(analytics);
  }

  async logBulkHits(analyticsArray: (Analytics | any)[]): Promise<void> {
    // Bulk insert for high-volume scenarios
    const docs = analyticsArray.map(analytics => {
      if (!(analytics instanceof Analytics)) {
        return new Analytics(
          analytics.shortCode,
          analytics.timestamp ? new Date(analytics.timestamp) : new Date(),
          analytics.referrer,
          analytics.ipAddress,
          analytics.country,
          analytics.userAgent
        );
      }
      return analytics;
    });

    // Use insertMany for bulk operations with ordered: false for better performance
    await this.analyticsModel.insertMany(docs, { 
      ordered: false
    });
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

    // Use aggregation pipeline with $facet for better performance
    // This allows multiple aggregations in a single query
    const pipeline: any[] = [
      { $match: { shortCode } },
      {
        $facet: {
          totalClicks: [{ $count: "count" }],
          dailyClicks: [
            { $match: { timestamp: { $gte: startDate } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          referrers: [
            {
              $group: {
                _id: "$referrer",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 20 }, // Limit top referrers for performance
          ],
          countries: [
            { $match: { country: { $exists: true, $ne: null } } },
            {
              $group: {
                _id: "$country",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 20 }, // Limit top countries for performance
          ],
        },
      },
    ];

    const [result] = await this.analyticsModel.aggregate(pipeline, {
      allowDiskUse: true, // Allow using disk for large datasets
      maxTimeMS: 30000, // 30 second timeout
    });

    const totalClicks = result.totalClicks[0]?.count || 0;
    const dailyClicks = result.dailyClicks.map((d: any) => ({ 
      date: d._id, 
      count: d.count 
    }));
    const referrers = result.referrers.map((r: any) => ({ 
      referrer: r._id || "direct", 
      count: r.count 
    }));
    const countries = result.countries.map((c: any) => ({ 
      country: c._id, 
      count: c.count 
    }));

    return {
      totalClicks,
      dailyClicks,
      referrers,
      countries,
    };
  }
}
