#!/bin/bash

# Build and start all services
echo "Building and starting all services..."

# Stop any existing containers
docker compose down

# Build the application image
echo "Building NestJS application..."
docker compose build nestjs-app-1

# Start all services
echo "Starting all services..."
docker compose up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 30

# Check health of all services
echo "Checking service health..."
docker compose ps

# Test the load balancer
echo "Testing load balancer..."
for i in {1..5}; do
    echo "Request $i:"
    curl -s http://localhost/health | jq .
    sleep 1
done

echo "Deployment completed!"
echo "Application is available at: http://localhost"
echo "Health check endpoint: http://localhost/health"
echo "Nginx health check: http://localhost/nginx-health"
