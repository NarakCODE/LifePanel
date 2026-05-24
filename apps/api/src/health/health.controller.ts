import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { RedisCacheService } from '../redis';

/**
 * Health check endpoint (micro-use-health-checks).
 * GET /api/v1/health — liveness + readiness probe.
 * Add more indicators (TypeOrmHealthIndicator, etc.) as features grow.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private redisCache: RedisCacheService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check' })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Check heap stays under 300 MB
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      // Check RSS stays under 512 MB
      () => this.memory.checkRSS('memory_rss', 512 * 1024 * 1024),
      // Check Redis connectivity
      async () => {
        const isHealthy = await this.redisCache.isHealthy();
        if (isHealthy) {
          return { redis: { status: 'up' } };
        }
        throw new Error('Redis is not healthy');
      },
    ]);
  }
}
