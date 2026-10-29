import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private inMemoryFallback = new Map<string, { value: string; expiresAt: number }>();
  private isRedisConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);

    try {
      this.client = new Redis({
        host: redisHost,
        port: redisPort,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn(`Redis connection failed after ${times} retries. Using in-memory fallback.`);
            return null; // Stop retrying
          }
          return Math.min(times * 100, 2000);
        },
      });

      this.client.on('connect', () => {
        this.isRedisConnected = true;
        this.logger.log(`Connected to Redis at ${redisHost}:${redisPort}`);
      });

      this.client.on('error', (err) => {
        this.isRedisConnected = false;
        this.logger.warn(`Redis error: ${err.message}. Falling back to in-memory store.`);
      });

      await this.client.connect().catch((err) => {
        this.logger.warn(`Could not connect to Redis (${err.message}). In-memory fallback enabled.`);
      });
    } catch (error) {
      this.logger.warn(`Redis initialization warning: ${(error as Error).message}. Using in-memory fallback.`);
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isRedisConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err) {
        this.logger.warn(`Redis set failed: ${(err as Error).message}. Fallback to in-memory.`);
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
    this.inMemoryFallback.set(key, { value, expiresAt });
  }

  async get(key: string): Promise<string | null> {
    if (this.isRedisConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch (err) {
        this.logger.warn(`Redis get failed: ${(err as Error).message}. Fallback to in-memory.`);
      }
    }

    const entry = this.inMemoryFallback.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.inMemoryFallback.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(key: string): Promise<void> {
    if (this.isRedisConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (err) {
        this.logger.warn(`Redis del failed: ${(err as Error).message}. Fallback to in-memory.`);
      }
    }

    this.inMemoryFallback.delete(key);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }
}
