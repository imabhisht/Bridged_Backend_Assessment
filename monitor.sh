#!/bin/bash

# Monitor the health of all services
echo "Monitoring service health..."

while true; do
    clear
    echo "=== Docker Compose Services Status ==="
    docker compose ps
    
    echo ""
    echo "=== Load Balancer Test ==="
    for i in {1..3}; do
        echo "Request $i:"
        response=$(curl -s http://localhost/health 2>/dev/null)
        if [ $? -eq 0 ]; then
            echo $response | jq -r '.instance // "unknown"' 2>/dev/null || echo "Response: $response"
        else
            echo "Failed to connect"
        fi
        sleep 0.5
    done
    
    echo ""
    echo "=== Individual Service Health ==="
    
    # Check each NestJS instance
    for container in nestjs-app-1 nestjs-app-2 nestjs-app-3; do
        health=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null)
        echo "$container: $health"
    done
    
    # Check nginx
    nginx_health=$(docker inspect --format='{{.State.Health.Status}}' nginx-lb 2>/dev/null)
    echo "nginx-lb: $nginx_health"
    
    # Check MongoDB
    mongo_health=$(docker inspect --format='{{.State.Health.Status}}' mongodb 2>/dev/null)
    echo "mongodb: $mongo_health"
    
    # Check Redis
    redis_health=$(docker inspect --format='{{.State.Health.Status}}' redis 2>/dev/null)
    echo "redis: $redis_health"
    
    echo ""
    echo "Press Ctrl+C to exit..."
    sleep 10
done
