/**
 * BrainCacheService
 * Camada de cache Redis para resultados de busca e embeddings
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  ttl: number; // segundos
}

@Injectable()
export class BrainCacheService {
  private readonly logger = new Logger('BrainCacheService');
  private redis: Redis;
  private config: CacheConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      ttl: this.configService.get<number>('CACHE_TTL', 86400), // 24h default
    };

    this.initializeRedis();
  }

  /**
   * Inicializar conexão Redis
   */
  private initializeRedis(): void {
    try {
      this.redis = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.redis.on('connect', () => {
        this.logger.log('Redis cache connected');
      });

      this.redis.on('error', (err) => {
        this.logger.error(`Redis connection error: ${err.message}`);
      });
    } catch (error) {
      this.logger.error(`Failed to initialize Redis: ${error.message}`);
      // Continue without cache if Redis fails
      this.redis = null;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const data = await this.redis.get(key);
      if (data) {
        this.logger.debug(`Cache HIT: ${key}`);
        return JSON.parse(data) as T;
      }
      this.logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Cache get failed for ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Set value in cache com TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.redis) return;

    try {
      const cacheTtl = ttl || this.config.ttl;
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, cacheTtl, serialized);
      this.logger.debug(`Cache SET: ${key} (TTL: ${cacheTtl}s)`);
    } catch (error) {
      this.logger.error(`Cache set failed for ${key}: ${error.message}`);
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.del(key);
      this.logger.debug(`Cache DELETE: ${key}`);
    } catch (error) {
      this.logger.error(`Cache delete failed for ${key}: ${error.message}`);
    }
  }

  /**
   * Invalidar todo cache de uma obra
   * Pattern: brain:search:*:obra_id:*
   */
  async invalidateObraCache(obra_id: string): Promise<void> {
    if (!this.redis) return;

    try {
      const pattern = `brain:search:*${obra_id}*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.log(`Invalidated ${keys.length} cache keys for obra: ${obra_id}`);
      }
    } catch (error) {
      this.logger.error(`Cache invalidation failed: ${error.message}`);
    }
  }

  /**
   * Invalidar todo cache (ex: ao fazer deploy)
   */
  async flushAll(): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.flushdb();
      this.logger.log('Cache flushed completely');
    } catch (error) {
      this.logger.error(`Cache flush failed: ${error.message}`);
    }
  }

  /**
   * Estatísticas de cache
   */
  async getStats(): Promise<{
    connected: boolean;
    memory_usage: string;
    keys_count: number;
  }> {
    if (!this.redis) {
      return {
        connected: false,
        memory_usage: '0B',
        keys_count: 0,
      };
    }

    try {
      const info = await this.redis.info('memory');
      const keyCount = await this.redis.dbsize();

      return {
        connected: true,
        memory_usage: this.parseMemory(info),
        keys_count: keyCount,
      };
    } catch (error) {
      this.logger.error(`Failed to get cache stats: ${error.message}`);
      return {
        connected: false,
        memory_usage: '0B',
        keys_count: 0,
      };
    }
  }

  /**
   * Cache warming: carregar dados quentes em memória
   * Chamado no startup da aplicação
   */
  async warmCache(keys: string[], dataLoader: (key: string) => Promise<any>): Promise<void> {
    this.logger.log(`Warming cache with ${keys.length} keys...`);

    let loaded = 0;
    for (const key of keys) {
      try {
        const data = await dataLoader(key);
        await this.set(key, data);
        loaded++;
      } catch (error) {
        this.logger.error(`Failed to warm key ${key}: ${error.message}`);
      }
    }

    this.logger.log(`Cache warming complete: ${loaded}/${keys.length} keys loaded`);
  }

  /**
   * Watch command (para operações transacionais)
   */
  async watch(keys: string[]): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.watch(keys);
    } catch (error) {
      this.logger.error(`Failed to watch keys: ${error.message}`);
    }
  }

  /**
   * Unwatch command
   */
  async unwatch(): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.unwatch();
    } catch (error) {
      this.logger.error(`Failed to unwatch: ${error.message}`);
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    } catch (error) {
      this.logger.error(`Failed to close Redis: ${error.message}`);
    }
  }

  /**
   * Helper: Parsear informações de memória
   */
  private parseMemory(info: string): string {
    const match = info.match(/used_memory_human:(.+)\r/);
    return match ? match[1] : '0B';
  }
}
