#!/bin/bash

# Root directory
PROJECT_ROOT="."
mkdir -p "$PROJECT_ROOT"

# Create src structure
mkdir -p "$PROJECT_ROOT/src/domain/entities"
mkdir -p "$PROJECT_ROOT/src/domain/interfaces"
mkdir -p "$PROJECT_ROOT/src/application/services"
mkdir -p "$PROJECT_ROOT/src/application/dtos"
mkdir -p "$PROJECT_ROOT/src/infrastructure/database/schemas"
mkdir -p "$PROJECT_ROOT/src/infrastructure/cache"
mkdir -p "$PROJECT_ROOT/src/infrastructure/middleware"
mkdir -p "$PROJECT_ROOT/src/infrastructure/repositories"
mkdir -p "$PROJECT_ROOT/src/presentation/controllers"
mkdir -p "$PROJECT_ROOT/src/common/guards"
mkdir -p "$PROJECT_ROOT/src/common/utils"

# Create test structure
mkdir -p "$PROJECT_ROOT/tests/unit"
mkdir -p "$PROJECT_ROOT/tests/e2e"

# Create k6 structure
mkdir -p "$PROJECT_ROOT/k6"

# Create files in domain/entities
touch "$PROJECT_ROOT/src/domain/entities/link.entity.ts"
touch "$PROJECT_ROOT/src/domain/entities/analytics.entity.ts"
touch "$PROJECT_ROOT/src/domain/entities/user.entity.ts"

# Create files in domain/interfaces
touch "$PROJECT_ROOT/src/domain/interfaces/link-repository.interface.ts"
touch "$PROJECT_ROOT/src/domain/interfaces/analytics-repository.interface.ts"
touch "$PROJECT_ROOT/src/domain/interfaces/cache-service.interface.ts"

# Create files in application/services
touch "$PROJECT_ROOT/src/application/services/link.service.ts"
touch "$PROJECT_ROOT/src/application/services/analytics.service.ts"
touch "$PROJECT_ROOT/src/application/services/auth.service.ts"

# Create files in application/dtos
touch "$PROJECT_ROOT/src/application/dtos/create-link.dto.ts"
touch "$PROJECT_ROOT/src/application/dtos/analytics.dto.ts"

# Create files in infrastructure/database/schemas
touch "$PROJECT_ROOT/src/infrastructure/database/schemas/link.schema.ts"
touch "$PROJECT_ROOT/src/infrastructure/database/schemas/analytics.schema.ts"
touch "$PROJECT_ROOT/src/infrastructure/database/schemas/user.schema.ts"
touch "$PROJECT_ROOT/src/infrastructure/database/mongoose.module.ts"

# Create files in infrastructure/cache
touch "$PROJECT_ROOT/src/infrastructure/cache/redis.service.ts"

# Create files in infrastructure/middleware
touch "$PROJECT_ROOT/src/infrastructure/middleware/rate-limiter.middleware.ts"

# Create files in infrastructure/repositories
touch "$PROJECT_ROOT/src/infrastructure/repositories/link-mongo.repository.ts"
touch "$PROJECT_ROOT/src/infrastructure/repositories/analytics-mongo.repository.ts"

# Create files in presentation/controllers
touch "$PROJECT_ROOT/src/presentation/controllers/link.controller.ts"
touch "$PROJECT_ROOT/src/presentation/controllers/analytics.controller.ts"
touch "$PROJECT_ROOT/src/presentation/controllers/auth.controller.ts"
touch "$PROJECT_ROOT/src/presentation/controllers/admin.controller.ts"

# Create files in common/guards
touch "$PROJECT_ROOT/src/common/guards/jwt-auth.guard.ts"

# Create files in common/utils
touch "$PROJECT_ROOT/src/common/utils/short-code.util.ts"

# Create files in src root
touch "$PROJECT_ROOT/src/app.module.ts"
touch "$PROJECT_ROOT/src/main.ts"

# Create test files
touch "$PROJECT_ROOT/tests/unit/link.service.spec.ts"
touch "$PROJECT_ROOT/tests/unit/analytics.service.spec.ts"
touch "$PROJECT_ROOT/tests/e2e/link.e2e-spec.ts"

# Create k6 test
touch "$PROJECT_ROOT/k6/stress-test.js"

# Create root files
touch "$PROJECT_ROOT/.env"
touch "$PROJECT_ROOT/README.md"
touch "$PROJECT_ROOT/package.json"
touch "$PROJECT_ROOT/tsconfig.json"

echo "✅ Project structure created successfully under '$PROJECT_ROOT'"