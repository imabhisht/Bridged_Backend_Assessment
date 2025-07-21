import { Controller, Get, UseGuards } from "@nestjs/common";
import { LinkService } from "../../application/services/link.service";
import { AnalyticsService } from "../../application/services/analytics.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("admin")
export class AdminController {
  constructor(
    private readonly linkService: LinkService,
    private readonly analyticsService: AnalyticsService
  ) {}

  @Get("links")
  @UseGuards(JwtAuthGuard)
  async getAllLinksWithStats() {
    const links = await this.linkService.findAll();
    const results = await Promise.all(
      links.map(async (link) => {
        const stats = await this.analyticsService.getStats(link.shortCode);
        return { ...link, stats };
      })
    );
    return results;
  }
}
