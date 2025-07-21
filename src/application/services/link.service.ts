import { Injectable, Inject } from "@nestjs/common";
import { LinkRepository } from "../../domain/interfaces/link-repository.interface";
import { CacheService } from "../../domain/interfaces/cache-service.interface";
import { Link } from "../../domain/entities/link.entity";
import { CreateLinkDto } from "../dtos/create-link.dto";
import { ShortCodeUtil } from "../../common/utils/short-code.util";
import { BadRequestException } from "@nestjs/common";

@Injectable()
export class LinkService {
  constructor(
    @Inject("LinkRepository") private readonly linkRepository: LinkRepository,
    @Inject("CacheService") private readonly cacheService: CacheService
  ) {}

  async createLink(dto: CreateLinkDto, userId?: string): Promise<Link> {
    const shortCode = dto.customShortCode || ShortCodeUtil.generate();
    const existingLink = await this.linkRepository.findByShortCode(shortCode);
    if (existingLink) {
      throw new BadRequestException("Short code already exists");
    }

    // Validate expiration date if provided
    let expiresAt: Date | undefined;
    if (dto.expiresAt) {
      expiresAt = new Date(dto.expiresAt);
      if (expiresAt <= new Date()) {
        throw new BadRequestException("Expiration date must be in the future");
      }
    }

    const link = new Link(
      shortCode,
      dto.longUrl,
      userId,
      expiresAt
    );
    await this.linkRepository.create(link);
    await this.cacheService.set(`link:${shortCode}`, dto.longUrl, 3600); // Cache for 1 hour
    return link;
  }

  async getLongUrl(shortCode: string): Promise<string> {
    const cachedUrl = await this.cacheService.get(`link:${shortCode}`);
    if (cachedUrl) return cachedUrl;

    const link = await this.linkRepository.findByShortCode(shortCode);
    if (!link || (link.expiresAt && link.expiresAt < new Date())) {
      throw new BadRequestException("Link not found or expired");
    }

    await this.cacheService.set(`link:${shortCode}`, link.longUrl, 3600);
    return link.longUrl;
  }

  async getUserLinks(userId: string): Promise<Link[]> {
    return this.linkRepository.findByUserId(userId);
  }

  async findAll(): Promise<Link[]> {
    return this.linkRepository.findAll();
  }

  async deleteLink(shortCode: string, userId?: string): Promise<void> {
    const link = await this.linkRepository.findByShortCode(shortCode);
    if (!link) {
      throw new BadRequestException("Link not found");
    }

    // If userId is provided, ensure the user owns the link
    if (userId && link.userId !== userId) {
      throw new BadRequestException("You can only delete your own links");
    }

    await this.linkRepository.delete(shortCode);
    await this.cacheService.delete(`link:${shortCode}`);
  }
}
