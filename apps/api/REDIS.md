# Redis Integration Guide

## Overview

Redis has been integrated into the NestJS API for:
- **Caching** - Reduce database queries
- **Distributed Rate Limiting** - Works across multiple instances
- **Future**: Sessions, pub/sub, job queues

## Installation

Redis is already installed. To use Redis locally:

### macOS
```bash
brew install redis
brew services start redis
```

### Docker
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

### Ubuntu/Debian
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

## Configuration

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Default configuration:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=3600              # 1 hour default cache TTL
REDIS_MAX_CONNECTIONS=10
REDIS_CONNECTION_TIMEOUT=5000
```

## Usage

### Inject the Cache Service

```typescript
import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '../redis';

@Injectable()
export class TasksService {
  constructor(
    private readonly redisCache: RedisCacheService,
    // ... other dependencies
  ) {}

  // ... your methods
}
```

### Caching Examples

#### Basic Cache
```typescript
// Set cache (TTL from config)
await this.redisCache.set('tasks', 'list', userId, tasks);

// Get cache
const cached = await this.redisCache.get<Task[]>('tasks', 'list', userId);

// Delete cache
await this.redisCache.delete('tasks', 'list', userId);
```

#### Get or Set with Fallback
```typescript
const tasks = await this.redisCache.getOrSet(
  'tasks',
  'list',
  userId,
  async () => {
    // This function runs only if cache misses
    return this.tasksModel.find({ userId }).exec();
  },
  1800, // Optional: custom TTL (30 minutes)
);
```

#### Cache Invalidation
```typescript
// Delete single key
await this.redisCache.delete('tasks', 'detail', taskId);

// Delete all keys matching pattern
await this.redisCache.deleteByPattern('tasks', 'list');

// Refresh TTL
await this.redisCache.refreshTtl('tasks', 'list', userId, 7200);
```

#### Counters
```typescript
// Increment
const count = await this.redisCache.increment('analytics', 'views', taskId);

// Decrement
const remaining = await this.redisCache.decrement('limits', 'daily', userId);
```

### Key Naming Convention

Keys follow the pattern: `life-dashboard:{module}:{type}:{id}`

Examples:
- `life-dashboard:tasks:list:user-123`
- `life-dashboard:projects:detail:proj-456`
- `life-dashboard:analytics:views:task-789`

## Health Check

Redis health is included in the main health endpoint:

```bash
GET /api/v1/health
```

Response:
```json
{
  "status": "ok",
  "info": {
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

## Rate Limiting

Rate limiting now uses Redis for distributed storage. Configuration:

```env
THROTTLE_TTL=60000      # Time window in ms
THROTTLE_LIMIT=100      # Max requests per window
```

## Best Practices Applied

Following [redis-development](./.agents/skills/redis-development) skill:

1. **data-key-naming** - Consistent key naming with namespaces
2. **ram-ttl** - All cache keys have TTL to prevent memory leaks
3. **conn-pooling** - Connection pooling configured
4. **conn-timeouts** - Connection timeouts configured
5. **conn-pipelining** - Bulk operations use pipelines
6. **security-auth** - Password authentication supported

## Testing

Test Redis connectivity:

```bash
redis-cli ping
# Should return: PONG
```

## Monitoring

Use Redis CLI to monitor:

```bash
# View memory usage
redis-cli INFO memory

# View keyspace
redis-cli INFO keyspace

# Monitor commands in real-time
redis-cli MONITOR

# Slow log
redis-cli SLOWLOG GET 10
```

## Clear All Cache (Development)

```typescript
// In a service or controller
await this.redisCache.clearAll();
```

⚠️ **Warning**: This deletes all cache with the `life-dashboard:` prefix.
