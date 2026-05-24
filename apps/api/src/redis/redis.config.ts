import { registerAs } from '@nestjs/config';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  ttl: number;
  maxConnections: number;
  connectionTimeout: number;
}

export const redisConfig = registerAs<RedisConfig>('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
  maxConnections: parseInt(process.env.REDIS_MAX_CONNECTIONS || '10', 10),
  connectionTimeout: parseInt(
    process.env.REDIS_CONNECTION_TIMEOUT || '5000',
    10,
  ),
}));
