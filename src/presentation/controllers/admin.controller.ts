import { Controller, Get, UseGuards, Delete, Param, Query } from "@nestjs/common";
import { LinkService } from "../../application/services/link.service";
import { AnalyticsService } from "../../application/services/analytics.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { MongoHealthService } from "../../infrastructure/database/mongo-health.service";

@Controller("admin")
export class AdminController {
  constructor(
    private readonly linkService: LinkService,
    private readonly analyticsService: AnalyticsService,
    private readonly mongoHealthService: MongoHealthService
  ) {}

  @Get("links")
  @UseGuards(JwtAuthGuard)
  async getAllLinksWithStats(@Query("limit") limit?: string, @Query("page") page?: string) {
    const links = await this.linkService.findAll();
    
    // Apply pagination if requested
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 50;
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedLinks = links.slice(startIndex, endIndex);
    
    const results = await Promise.all(
      paginatedLinks.map(async (link) => {
        const stats = await this.analyticsService.getStats(link.shortCode);
        return { 
          ...link, 
          stats,
          isExpired: link.expiresAt ? link.expiresAt < new Date() : false
        };
      })
    );
    
    return {
      links: results,
      total: links.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(links.length / limitNum)
    };
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard)
  async getOverallStats() {
    const links = await this.linkService.findAll();
    const totalLinks = links.length;
    const activeLinks = links.filter(link => !link.expiresAt || link.expiresAt > new Date()).length;
    const expiredLinks = totalLinks - activeLinks;
    
    // Get total clicks across all links
    let totalClicks = 0;
    for (const link of links) {
      const stats = await this.analyticsService.getStats(link.shortCode);
      totalClicks += stats.totalClicks || 0;
    }
    
    return {
      totalLinks,
      activeLinks,
      expiredLinks,
      totalClicks,
      averageClicksPerLink: totalLinks > 0 ? (totalClicks / totalLinks).toFixed(2) : 0
    };
  }

  @Delete("links/:shortCode")
  @UseGuards(JwtAuthGuard)
  async deleteLink(@Param("shortCode") shortCode: string) {
    await this.linkService.deleteLink(shortCode); // Admin can delete any link
    return { message: "Link deleted successfully" };
  }

  @Get("mongodb-stats")
  @UseGuards(JwtAuthGuard)
  async getMongoDbStats() {
    const healthStatus = await this.mongoHealthService.getHealthStatus();
    const performanceMetrics = await this.mongoHealthService.getPerformanceMetrics();
    
    return {
      health: healthStatus,
      performance: performanceMetrics
    };
  }
}
