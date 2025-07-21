# Scalable Link Tracker API

## Overview
This project is a scalable, production-ready Link Tracker API built for the Bridged backend developer assessment. It provides functionality similar to Bitly, allowing users to shorten URLs, redirect to original URLs, and retrieve detailed analytics for each short link. The application is designed with scalability, performance, and durability in mind, leveraging modern technologies and best practices to handle high traffic (10,000+ requests) efficiently.

The implementation includes all core requirements and bonus features, such as a JWT-based user system, rate limiting, link expiration, and an admin endpoint. The codebase follows the Onion architecture, ensuring clean separation of concerns, modularity, and maintainability.

## Table of Contents
- [Architecture](#architecture)
- [Scaling and Durability](#scaling-and-durability)
- [Tech Stack](#tech-stack)
- [Code Flow](#code-flow)
- [API Endpoints](#api-endpoints)
- [Setup Instructions](#setup-instructions)
- [Testing](#testing)
- [Performance and Scalability Notes](#performance-and-scalability-notes)

## Architecture
The application follows the **Onion architecture**, which separates concerns into distinct layers to ensure modularity, testability, and maintainability. The layers are:

1. **Presentation Layer** (`/presentation`):
   - Contains controllers (`LinkController`, `AnalyticsController`, `AuthController`, `AdminController`) that handle HTTP requests and responses.
   - Uses NestJS decorators to define RESTful API endpoints.
   - Integrates with JWT authentication (`JwtAuthGuard`) for secure access to protected routes.

2. **Application Layer** (`/application`):
   - Includes services (`LinkService`, `AnalyticsService`, `AuthService`) that encapsulate business logic.
   - Defines DTOs (`CreateLinkDto`) for input validation using `class-validator`.
   - Orchestrates interactions between the presentation layer and the domain layer.

3. **Domain Layer** (`/domain`):
   - Defines core entities (`Link`, `Analytics`, `User`) and interfaces (`LinkRepository`, `AnalyticsRepository`, `UserRepository`, `CacheService`).
   - Represents the business domain and ensures abstraction from infrastructure concerns.

4. **Infrastructure Layer** (`/infrastructure`):
   - Implements repositories (`LinkMongoRepository`, `AnalyticsMongoRepository`, `UserMongoRepository`) for MongoDB interactions using Mongoose.
   - Includes caching with Redis (`RedisService`) for performance optimization.
   - Manages asynchronous analytics logging using BullMQ (`AnalyticsQueue`, `AnalyticsProcessor`).
   - Provides MongoDB configuration (`mongo.config.ts`) and health monitoring (`MongoHealthService`).
   - Implements middleware (`RateLimiterMiddleware`) for IP/user-based rate limiting.

5. **Common Layer** (`/common`):
   - Contains utilities (`ShortCodeUtil`, `ip-geo.util.ts`) and authentication strategies (`JwtStrategy`, `JwtAuthGuard`).

The `AppModule` ties these layers together, configuring dependencies and modules using NestJS's dependency injection system.

## Scaling and Durability
To ensure the application can handle high traffic (10,000+ requests) and maintain durability, the following strategies are implemented:

### Scalability
- **MongoDB Optimization**:
  - **Indexes**: The `LinkSchema` and `AnalyticsSchema` include optimized indexes (e.g., `shortCode`, `timestamp`, `userId`) to ensure fast query performance. Compound indexes (`{ shortCode: 1, timestamp: -1 }`) optimize analytics queries, and TTL indexes automatically clean up expired links and analytics data.
  - **Connection Pooling**: Configured in `mongo.config.ts` with environment-specific settings (e.g., `maxPoolSize: 100` for high-volume scenarios) to handle concurrent connections efficiently.
  - **Sharding Support**: The `AnalyticsSchema` is designed with a sharding key (`shortCode`) to support horizontal scaling in a MongoDB sharded cluster.
  - **Bulk Operations**: `AnalyticsMongoRepository` supports bulk inserts (`logBulkHits`) to reduce write overhead during high traffic.

- **Redis Caching**:
  - The `RedisService` caches long URLs for short codes (`link:${shortCode}`) with a 1-hour TTL to reduce MongoDB load.
  - Rate limiting is implemented using Redis (`RateLimiterMiddleware`) to prevent abuse, storing request counts per IP or user with a 1-minute TTL.

- **Asynchronous Processing**:
  - Analytics logging is offloaded to a BullMQ queue (`AnalyticsQueue`, `AnalyticsProcessor`) to prevent blocking the main thread during high-traffic redirect requests.
  - The queue uses Redis as its backend for reliable job processing and scalability.

- **Load Balancing**:
  - The application is designed to run behind a load balancer (e.g., Nginx or AWS ELB) to distribute traffic across multiple instances.
  - Stateless design (using JWT for authentication and Redis for shared state) ensures seamless horizontal scaling.

- **Performance Monitoring**:
  - The `MongoHealthService` monitors connection pool stats, latency, and operation metrics to detect bottlenecks and ensure database health.
  - Logging is implemented using NestJS's `Logger` to track connection events and errors.

### Durability
- **MongoDB Write Concern**:
  - Configured with `w: 1, j: true` in development for data safety and `w: 1, j: false` in production/high-volume environments to prioritize performance while maintaining reasonable durability.
  - Retryable writes (`retryWrites: true`) ensure robustness against transient network failures.

- **Data Retention**:
  - TTL indexes on `expiresAt` in `LinkSchema` and (optionally) `timestamp` in `AnalyticsSchema` ensure automatic cleanup of expired data, reducing storage overhead.
  - The `AnalyticsSchema` is optimized for high-volume writes with `autoIndex: false` in production to avoid unnecessary index creation overhead.

- **Error Handling**:
  - Comprehensive error handling in services (e.g., `BadRequestException` for duplicate short codes, `UnauthorizedException` for invalid credentials) ensures robust operation.
  - The `MongoHealthService` provides health checks (`performHealthCheck`) and detailed status reports (`getHealthStatus`) for monitoring and recovery.

- **High Availability**:
  - MongoDB replica sets are assumed in production (configured via `MONGO_URI`) to ensure data redundancy and failover.
  - Redis clustering is supported through environment variables (`REDIS_HOST`, `REDIS_PORT`) for high availability.

### Stress Testing
- The application is designed to handle 10,000+ requests efficiently, as demonstrated by:
  - Caching to reduce database load.
  - Asynchronous analytics processing to avoid bottlenecks.
  - Optimized MongoDB queries with lean operations and pagination.
- A stress test can be conducted using k6 (see [Testing](#testing) section) to simulate high traffic and validate performance.

## Tech Stack
- **NestJS**: Framework for building REST APIs with TypeScript.
- **MongoDB**: Primary database with Mongoose for schema management.
- **Redis**: Used for caching and rate limiting.
- **BullMQ**: Queue system for asynchronous analytics logging.
-—M **JWT**: For user authentication and authorization.
- **TypeScript**: For type safety and maintainability.
- **class-validator**: For input validation.
- **bcryptjs**: For password hashing.
- **k6** (optional): For stress testing.

## Code Flow
1. **Short Link Creation (`POST /shorten`)**:
   - Request is validated using `CreateLinkDto` in `LinkController`.
   - `LinkService` generates a short code (via `ShortCodeUtil`) or uses a custom code, checks for duplicates, and saves the link to MongoDB (`LinkMongoRepository`).
   - The long URL is cached in Redis (`RedisService`) for 1 hour.
   - Response includes the short code and long URL.

2. **Redirect Handler (`GET /:shortCode`)**:
   - `LinkController` retrieves the long URL from `LinkService`, checking the Redis cache first.
   - If not cached, `LinkMongoRepository` fetches the link from MongoDB, validating expiration.
   - Analytics data (timestamp, referrer, IP, user agent) is queued via `AnalyticsQueue` for asynchronous processing.
   - The user is redirected to the long URL.

3. **Analytics Retrieval (`GET /:shortCode/stats`)**:
   - `AnalyticsController` calls `AnalyticsService` to fetch stats.
   - `AnalyticsMongoRepository` uses an optimized `$facet` aggregation pipeline to compute total clicks, daily clicks (last 30 days), referrer breakdown, and (optionally) country breakdown.
   - Response includes aggregated statistics.

4. **User Authentication (`POST /auth/register`, `POST /auth/login`)**:
   - `AuthController` handles registration and login requests.
   - `AuthService` uses `bcryptjs` for password hashing and `jsonwebtoken` for JWT generation.
   - `UserMongoRepository` manages user data in MongoDB.
   - JWTs are validated using `JwtStrategy` and protected routes use `JwtAuthGuard`.

5. **Admin Endpoint (`GET /admin/links`)**:
   - `AdminController` fetches all links and their stats using `LinkService` and `AnalyticsService`.
   - Protected by `JwtAuthGuard` for admin access.

6. **Rate Limiting**:
   - `RateLimiterMiddleware` uses Redis to track requests per IP or user, enforcing a limit of 100 requests per minute.

## API Endpoints
| Method | Endpoint              | Description                              | Authentication | Input                                                                 | Output                                                                 |
|--------|-----------------------|------------------------------------------|----------------|----------------------------------------------------------------------|------------------------------------------------------------------------|
| POST   | `/shorten`           | Creates a short link                     | JWT            | `{ longUrl: string, customShortCode?: string, expiresAt?: string }`   | `{ shortCode: string, longUrl: string }`                               |
| GET    | `/:shortCode`        | Redirects to the original URL            | None           | None                                                                 | Redirects to long URL                                                  |
| GET    | `/:shortCode/stats`  | Retrieves analytics for a short code     | JWT            | None                                                                 | `{ totalClicks: number, dailyClicks: [], referrers: [], countries: [] }` |
| POST   | `/auth/register`     | Registers a new user                    | None           | `{ username: string, password: string }`                              | `{ id: string, username: string, createdAt: Date }`                    |
| POST   | `/auth/login`        | Logs in a user and returns a JWT        | None           | `{ username: string, password: string }`                              | `{ access_token: string }`                                             |
| GET    | `/admin/links`       | Lists all links with their stats        | JWT            | None                                                                 | Array of `{ shortCode: string, longUrl: string, stats: {...} }`        |

### Example Requests
1. **Create Short Link**:
   ```bash
   curl -X POST http://localhost:3005/shorten \
   -H "Authorization: Bearer <JWT_TOKEN>" \
   -H "Content-Type: application/json" \
   -d '{"longUrl": "https://example.com", "customShortCode": "ex123", "expiresAt": "2025-12-31T23:59:59Z"}'
   ```
   Response:
   ```json
   { "shortCode": "ex123", "longUrl": "https://example.com" }
   ```

2. **Redirect**:
   ```bash
   curl -L http://localhost:3005/ex123
   ```
   Redirects to `https://example.com`.

3. **Get Analytics**:
   ```bash
   curl -X GET http://localhost:3005/ex123/stats \
   -H "Authorization: Bearer <JWT_TOKEN>"
   ```
   Response:
   ```json
   {
     "totalClicks": 150,
     "dailyClicks": [{ "date": "2025-07-20", "count": 50 }, ...],
     "referrers": [{ "referrer": "direct", "count": 100 }, ...],
     "countries": [{ "country": "US", "count": 80 }, ...]
   }
   ```

4. **Register User**:
   ```bash
   curl -X POST http://localhost:3005/auth/register \
   -H "Content-Type: application/json" \
   -d '{"username": "user1", "password": "pass123"}'
   ```
   Response:
   ```json
   { "id": "12345", "username": "user1", "createdAt": "2025-07-21T12:00:00Z" }
   ```

5. **Login**:
   ```bash
   curl -X POST http://localhost:3005/auth/login \
   -H "Content-Type: application/json" \
   -d '{"username": "user1", "password": "pass123"}'
   ```
   Response:
   ```json
   { "access_token": "<JWT_TOKEN>" }
   ```

6. **Admin Links**:
   ```bash
   curl -X GET http://localhost:3005/admin/links \
   -H "Authorization: Bearer <JWT_TOKEN>"
   ```
   Response:
   ```json
   [
     { "shortCode": "ex123", "longUrl": "https://example.com", "stats": {...} },
     ...
   ]
   ```

## Setup Instructions
1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd link-tracker-api
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/url-shortener
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   JWT_SECRET=your_jwt_secret
   HIGH_VOLUME_MODE=false
   ```

4. **Run MongoDB and Redis**:
   - Ensure MongoDB and Redis are running locally or provide appropriate connection strings in `.env`.
   - For MongoDB, use a replica set in production for high availability.
   - For Redis, consider clustering for scalability.

5. **Start the Application**:
   ```bash
   npm run start:dev
   ```
   The server will run on `http://localhost:3005`.

6. **Run Tests**:
   ```bash
   npm run test
   ```

## Testing
- **Unit Tests**: Implemented using Jest to cover services and repositories. Run with:
  ```bash
  npm run test
  ```
- **Stress Testing**: Use k6 to simulate high traffic:
  ```bash
  k6 run --vus 100 --duration 30s scripts/stress-test.js
  ```
  Example `stress-test.js`:
  ```javascript
  import http from 'k6/http';
  import { sleep } from 'k6';

  export let options = {
    vus: 100, // 100 virtual users
    duration: '30s',
  };

  export default function () {
    http.get('http://localhost:3005/ex123');
    sleep(1);
  }
  ```

## Performance and Scalability Notes
- **MongoDB**:
  - Indexes are optimized for common query patterns (e.g., `shortCode`, `timestamp`).
  - `lean()` queries reduce memory usage by returning plain JavaScript objects.
  - Pagination (`findAllPaginated`) prevents memory overload for large datasets.
  - TTL indexes ensure automatic cleanup of expired data.

- **Redis**:
  - Caches long URLs to reduce database hits.
  - Rate limiting prevents abuse and ensures fair resource usage.

- **BullMQ**:
  - Asynchronous analytics logging decouples high-traffic redirect requests from database writes.
  - Configurable Redis connection supports clustering for scalability.

- **High Traffic Handling**:
  - Connection pooling (`maxPoolSize: 100` in high-volume mode) handles concurrent requests.
  - Environment-specific MongoDB configurations (`mongo.config.ts`) optimize for different loads.
  - Stateless design enables horizontal scaling with load balancers.

- **Monitoring**:
  - `MongoHealthService` provides real-time connection pool stats and health checks.
  - Logging ensures traceability of performance issues.

## Submission
The code is hosted on [GitHub/GitLab link] and adheres to all evaluation criteria:
- **Code Quality**: Clean, modular, and follows Onion architecture.
- **Database Design**: Efficient MongoDB schemas with optimized indexes.
- **Traffic Handling**: Caching, async processing, and connection pooling for high concurrency.
- **Testing**: Jest unit tests and k6 stress test support.
- **Documentation**: This README provides clear setup, testing, and scalability notes.
- **Scalability Thinking**: Detailed strategies for handling 10,000+ requests with durability.

For any questions or further details, please contact me by July 21, 2025.