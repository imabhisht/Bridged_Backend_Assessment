# Link Tracker API

A scalable URL shortening service built with NestJS, MongoDB, and Redis, designed to handle high traffic and provide analytics.

## Features
- **Short Link Creation**: POST `/shorten` to create short links with optional custom codes and expiration dates.
- **Redirect Handler**: GET `/:shortCode` to redirect to the original URL and log analytics.
- **Analytics Endpoint**: GET `/:shortCode/stats` for total clicks, daily clicks (last 30 days), and referrer breakdown.
- **Bonus Features**:
  - JWT-based user authentication.
  - Rate limiting per IP (100 requests/minute).
  - Link expiration.
  - Admin endpoint for viewing all links and stats.
- **Performance**:
  - MongoDB indexes for fast queries.
  - Redis caching for redirects.
  - Connection pooling for MongoDB and Redis.
  - Stress tested with k6 for 10,000+ requests.

## Tech Stack
- **NestJS**: REST API framework.
- **MongoDB**: Database with Mongoose for schema management.
- **Redis**: Caching and rate limiting.
- **k6**: Stress testing.
- **Jest**: Unit and integration testing.

## Setup
1. **Prerequisites**:
   - Node.js v16+
   - MongoDB
   - Redis
   - k6 (for stress testing)

2. **Installation**:
   ```bash
   git clone <repository-url>
   cd link-tracker-api
   npm install