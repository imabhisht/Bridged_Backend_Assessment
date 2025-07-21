import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "../../application/services/analytics.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(":shortCode/stats")
  @UseGuards(JwtAuthGuard)
  async getStats(@Param("shortCode") shortCode: string) {
    return this.analyticsService.getStats(shortCode);
  }
}
