# Docker Deployment Guide

This guide explains how to deploy the NestJS URL Shortener application using Docker with load balancing.

## Architecture

The deployment consists of:
- **3 NestJS application instances** (nestjs-app-1, nestjs-app-2, nestjs-app-3)
- **Nginx load balancer** (distributes traffic across the 3 instances)
- **MongoDB database** (shared data storage)
- **Redis cache** (shared caching and session storage)

## Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)
- jq (for JSON parsing in scripts) - optional

## Quick Start

1. **Deploy the entire stack:**
   ```bash
   ./deploy.sh
   ```

2. **Or step by step:**
   ```bash
   # Build the application
   docker compose build

   # Start all services
   docker compose up -d

   # Check status
   docker compose ps
   ```

## Available Services

- **Application**: http://localhost (load-balanced across 3 instances)
- **Health Check**: http://localhost:3500/health
- **Nginx Health**: http://localhost:3500/nginx-health
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## Management Commands

```bash
# Start services
npm run docker:up

# Stop services
npm run docker:down

# View logs
npm run docker:logs

# Monitor health
npm run docker:monitor

# Full deployment
npm run docker:deploy
```

## Load Balancing

Nginx uses round-robin load balancing by default. Each request is distributed to the next available NestJS instance:

- Request 1 → nestjs-app-1
- Request 2 → nestjs-app-2  
- Request 3 → nestjs-app-3
- Request 4 → nestjs-app-1 (cycle repeats)

## Health Monitoring

All services include health checks:

- **NestJS apps**: Monitored via `/health` endpoint
- **MongoDB**: Ping command
- **Redis**: Ping command  
- **Nginx**: Internal health check

Use the monitoring script to watch real-time status:
```bash
./monitor.sh
```

## Environment Variables

Key environment variables (see `.env.example`):

- `MONGODB_URI`: MongoDB connection string
- `REDIS_HOST/PORT`: Redis configuration
- `JWT_SECRET`: JWT signing secret
- `NODE_ENV`: Environment (production/development)

## Scaling

To add more NestJS instances:

1. Add new service in `docker compose.yml`:
   ```yaml
   nestjs-app-4:
     build: .
     container_name: nestjs-app-4
     # ... same config as other instances
   ```

2. Update Nginx upstream in `nginx/nginx.conf`:
   ```nginx
   upstream nestjs_backend {
       server nestjs-app-1:3005;
       server nestjs-app-2:3005;
       server nestjs-app-3:3005;
       server nestjs-app-4:3005;  # Add new instance
   }
   ```

3. Restart services:
   ```bash
   docker compose down
   docker compose up -d
   ```

## Testing Load Balancing

Test that requests are distributed across instances:

```bash
# Make multiple requests and observe different instance IDs
for i in {1..10}; do
    curl -s http://localhost:3500/health | jq -r '.instance'
done
```

## Troubleshooting

1. **Check service status:**
   ```bash
   docker compose ps
   ```

2. **View logs:**
   ```bash
   docker compose logs [service-name]
   ```

3. **Check individual container health:**
   ```bash
   docker inspect --format='{{.State.Health.Status}}' [container-name]
   ```

4. **Restart specific service:**
   ```bash
   docker compose restart [service-name]
   ```

## Production Considerations

- Change default passwords in `docker compose.yml`
- Use environment files for sensitive data
- Enable SSL/TLS in Nginx
- Set up log rotation
- Configure monitoring and alerting
- Use Docker secrets for sensitive data
- Consider using Docker Swarm or Kubernetes for production
