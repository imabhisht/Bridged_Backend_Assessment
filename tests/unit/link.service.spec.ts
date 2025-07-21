import { Test, TestingModule } from "@nestjs/testing";
import { LinkService } from "../../src/application/services/link.service";
import { LinkRepository } from "../../src/domain/interfaces/link-repository.interface";
import { CacheService } from "../../src/domain/interfaces/cache-service.interface";

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
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LinkService>(LinkService);
    linkRepository = module.get<LinkRepository>("LinkRepository");
    cacheService = module.get<CacheService>(RedisService);
  });

  it("should create a link", async () => {
    const dto = { longUrl: "https://example.com" };
    jest.spyOn(linkRepository, "findByShortCode").mockResolvedValue(null);
    jest.spyOn(linkRepository, "create").mockResolvedValue({
      shortCode: "abc123",
      longUrl: dto.longUrl,
      createdAt: new Date(),
    });

    const result = await service.createLink(dto);
    expect(result.shortCode).toBeDefined();
    expect(result.longUrl).toBe(dto.longUrl);
  });
});
