import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Res,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Response, Request } from "express";
import { LinkService } from "../../application/services/link.service";
import { AnalyticsService } from "../../application/services/analytics.service";
import { CreateLinkDto } from "../../application/dtos/create-link.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller()
export class LinkController {
  constructor(
    private readonly linkService: LinkService,
    private readonly analyticsService: AnalyticsService
  ) {}

  @Post("shorten")
  @UseGuards(JwtAuthGuard)
  async shorten(@Body() dto: CreateLinkDto, @Req() req: any) {
    const userId = req.user?.userId;
    const link = await this.linkService.createLink(dto, userId);
    return { shortCode: link.shortCode, longUrl: link.longUrl };
  }

  @Get(":shortCode")
  async redirect(@Param("shortCode") shortCode: string, @Res() res: any, @Req() req: any) {
    const longUrl = await this.linkService.getLongUrl(shortCode);
    const referrer = req.get("Referrer") || "direct";
    const ipAddress = req.ip;
    const userAgent = req.get("User-Agent") || "";
    await this.analyticsService.logHit(shortCode, referrer, ipAddress, userAgent);
    return res.redirect(longUrl);
  }
}
