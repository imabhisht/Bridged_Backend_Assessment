import { Test, TestingModule } from "@nestjs/testing";
import { LinkService } from "../../src/application/services/link.service";
import { LinkRepository } from "../../src/domain/interfaces/link-repository.interface";
import { CacheService } from "../../src/domain/interfaces/cache-service.interface";
import { RedisService } from "../../src/infrastructure/cache/redis.service";
import { BadRequestException } from "@nestjs/common";
import { Link } from "../../src/domain/entities/link.entity";

describe("LinkService", () => {
  let service: LinkService;
  let linkRepository: LinkRepository;
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkService,
        {
          provide: "LinkRepository",
          useValue: {
            create: jest.fn(),
            findByShortCode: jest.fn(),
            findByUserId: jest.fn(),
            findAll: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: "CacheService",
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LinkService>(LinkService);
    linkRepository = module.get<LinkRepository>("LinkRepository");
    cacheService = module.get<CacheService>("CacheService");
  });

  describe("createLink", () => {
    it("should create a link", async () => {
      const dto = { longUrl: "https://example.com" };
      const mockLink = new Link("abc123", dto.longUrl, undefined, undefined);
      
      jest.spyOn(linkRepository, "findByShortCode").mockResolvedValue(null);
      jest.spyOn(linkRepository, "create").mockResolvedValue(mockLink);
      jest.spyOn(cacheService, "set").mockResolvedValue();

      const result = await service.createLink(dto);
      expect(result.shortCode).toBeDefined();
      expect(result.longUrl).toBe(dto.longUrl);
    });

    it("should create a link with expiration date", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      const dto = { 
        longUrl: "https://example.com", 
        expiresAt: futureDate.toISOString() 
      };
      const mockLink = new Link("abc123", dto.longUrl, undefined, futureDate);
      
      jest.spyOn(linkRepository, "findByShortCode").mockResolvedValue(null);
      jest.spyOn(linkRepository, "create").mockResolvedValue(mockLink);
      jest.spyOn(cacheService, "set").mockResolvedValue();

      const result = await service.createLink(dto);
      expect(result.expiresAt).toEqual(futureDate);
    });

    it("should throw error for past expiration date", async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const dto = { 
        longUrl: "https://example.com", 
        expiresAt: pastDate.toISOString() 
      };
      
      jest.spyOn(linkRepository, "findByShortCode").mockResolvedValue(null);

      await expect(service.createLink(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("deleteLink", () => {
    it("should delete a link", async () => {
      const shortCode = "abc123";
      const mockLink = new Link(shortCode, "https://example.com", "user1");
      
      jest.spyOn(linkRepository, "findByShortCode").mockResolvedValue(mockLink);
      jest.spyOn(linkRepository, "delete").mockResolvedValue();
      jest.spyOn(cacheService, "delete").mockResolvedValue();

      await service.deleteLink(shortCode, "user1");
      
      expect(linkRepository.delete).toHaveBeenCalledWith(shortCode);
      expect(cacheService.delete).toHaveBeenCalledWith(`link:${shortCode}`);
    });

    it("should throw error when user tries to delete another user's link", async () => {
      const shortCode = "abc123";
      const mockLink = new Link(shortCode, "https://example.com", "user1");
      
      jest.spyOn(linkRepository, "findByShortCode").mockResolvedValue(mockLink);

      await expect(service.deleteLink(shortCode, "user2")).rejects.toThrow(BadRequestException);
    });

    it("should allow admin to delete any link", async () => {
      const shortCode = "abc123";
      const mockLink = new Link(shortCode, "https://example.com", "user1");
      
      jest.spyOn(linkRepository, "findByShortCode").mockResolvedValue(mockLink);
      jest.spyOn(linkRepository, "delete").mockResolvedValue();
      jest.spyOn(cacheService, "delete").mockResolvedValue();

      // Admin call without userId restriction
      await service.deleteLink(shortCode);
      
      expect(linkRepository.delete).toHaveBeenCalledWith(shortCode);
    });
  });

  describe("getLongUrl", () => {
    it("should throw error for expired link", async () => {
      const shortCode = "abc123";
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const mockLink = new Link(shortCode, "https://example.com", undefined, expiredDate);
      
      jest.spyOn(cacheService, "get").mockResolvedValue(null);
      jest.spyOn(linkRepository, "findByShortCode").mockResolvedValue(mockLink);

      await expect(service.getLongUrl(shortCode)).rejects.toThrow(BadRequestException);
    });
  });
});
