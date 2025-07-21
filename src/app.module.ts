import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { LinkController } from "./presentation/controllers/link.controller";
import { AnalyticsController } from "./presentation/controllers/analytics.controller";
import { AuthController } from "./presentation/controllers/auth.controller";
import { LinkService } from "./application/services/link.service";
import { AnalyticsService } from "./application/services/analytics.service";
import { LinkMongoRepository } from "./infrastructure/repositories/link-mongo.repository";
import { AnalyticsMongoRepository } from "./infrastructure/repositories/analytics-mongo.repository";
import { RedisService } from "./infrastructure/cache/redis.service";
import { LinkSchema } from "./infrastructure/database/schemas/link.schema";
import { AnalyticsSchema } from "./infrastructure/database/schemas/analytics.schema";
import { RateLimiterMiddleware } from "./infrastructure/middleware/rate-limiter.middleware";
import { JwtStrategy } from "./common/strategies/jwt.strategy";
import { UserSchema } from "./infrastructure/database/schemas/user.schema";
import { UserMongoRepository } from "./infrastructure/repositories/user-mongo.repository";
import { AuthService } from "./application/services/auth.service";
import { AdminController } from "./presentation/controllers/admin.controller";
import { AnalyticsQueue } from "./infrastructure/queue/analytics.queue";
import { AnalyticsProcessor } from "./infrastructure/queue/analytics.processor";
import { MongooseDatabaseModule } from "./infrastructure/database/mongoose.module";
import { MongoHealthService } from "./infrastructure/database/mongo-health.service";

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseDatabaseModule,
    MongooseModule.forFeature([
      { name: "Link", schema: LinkSchema },
      { name: "Analytics", schema: AnalyticsSchema },
      { name: "User", schema: UserSchema },
    ]),
  ],
  controllers: [LinkController, AnalyticsController, AuthController, AdminController],
  providers: [
    LinkService,
    AnalyticsService,
    AuthService,
    { provide: "LinkRepository", useClass: LinkMongoRepository },
    { provide: "AnalyticsRepository", useClass: AnalyticsMongoRepository },
    { provide: "CacheService", useClass: RedisService },
    { provide: "UserRepository", useClass: UserMongoRepository },
    JwtStrategy,
    AnalyticsQueue,
    AnalyticsProcessor,
    MongoHealthService,
  ],
})
export class AppModule {}
