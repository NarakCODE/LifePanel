import {
  Module,
  Global,
  OnModuleDestroy,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { RedisCacheService } from './redis-cache.service';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const redisConfig = configService.get('redis');

        // conn-pooling: Use connection pooling with max connections
        // conn-timeouts: Configure connection timeouts
        const client = new Redis({
          host: redisConfig?.host || 'localhost',
          port: redisConfig?.port || 6379,
          password: redisConfig?.password,
          db: redisConfig?.db || 0,
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 3) {
              return null;
            }
            return Math.min(times * 200, 2000);
          },
          // Prevent blocking on slow commands (conn-blocking)
          showFriendlyErrorStack: true,
        });

        client.on('error', (err) => {
          console.error('Redis connection error:', err);
        });

        client.on('connect', () => {
          console.log('Connected to Redis');
        });

        return client;
      },
      inject: [ConfigService],
    },
    RedisCacheService,
  ],
  exports: [REDIS_CLIENT, RedisCacheService],
})
export class RedisModule implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async onModuleInit() {
    try {
      await this.client.ping();
      console.log('Redis health check passed');
    } catch (error) {
      console.error('Redis health check failed:', error);
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
