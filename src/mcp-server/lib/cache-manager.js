/**
 * Cache Manager with 30-day retention
 * Uses Redis with in-memory fallback for health data caching
 */

const redis = require('redis');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class CacheManager {
  constructor() {
    this.redisClient = null;
    this.inMemoryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    
    this.initializeRedis();
    this.startCleanupInterval();
  }

  /**
   * Initialize Redis connection with fallback to in-memory cache
   */
  async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || '<REDACTED_CREDENTIAL>';
      
      this.redisClient = redis.createClient({
        url: redisUrl,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.warn('Redis connection refused, falling back to in-memory cache');
            return undefined; // Stop retrying
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.redisClient.on('error', (err) => {
        logger.warn('Redis error, using in-memory cache:', err.message);
        this.redisClient = null;
      });

      this.redisClient.on('connect', () => {
        logger.info('Connected to Redis cache');
      });

      await this.redisClient.connect();
      
    } catch (error) {
      logger.warn('Failed to connect to Redis, using in-memory cache:', error.message);
      this.redisClient = null;
    }
  }

  /**
   * Get cached data
   */
  async get(key) {
    try {
      let value = null;

      if (this.redisClient && this.redisClient.isOpen) {
        // Try Redis first
        const redisValue = await this.redisClient.get(key);
        if (redisValue) {
          value = JSON.parse(redisValue);
          logger.debug(`Cache hit (Redis): ${key}`);
        }
      } else {
        // Fallback to in-memory cache
        const memoryItem = this.inMemoryCache.get(key);
        if (memoryItem && memoryItem.expiry > Date.now()) {
          value = memoryItem.data;
          logger.debug(`Cache hit (Memory): ${key}`);
        } else if (memoryItem) {
          // Expired item
          this.inMemoryCache.delete(key);
        }
      }

      if (value) {
        this.cacheStats.hits++;
        return value;
      } else {
        this.cacheStats.misses++;
        return null;
      }

    } catch (error) {
      logger.error('Error getting cached data:', error);
      this.cacheStats.misses++;
      return null;
    }
  }

  /**
   * Set cached data with TTL in hours
   */
  async set(key, data, ttlHours = 720) { // Default 30 days
    try {
      const serializedData = JSON.stringify(data);
      const ttlSeconds = ttlHours * 3600;

      if (this.redisClient && this.redisClient.isOpen) {
        // Use Redis
        await this.redisClient.setEx(key, ttlSeconds, serializedData);
        logger.debug(`Cache set (Redis): ${key}, TTL: ${ttlHours}h`);
      } else {
        // Use in-memory cache
        const expiry = Date.now() + (ttlHours * 3600 * 1000);
        this.inMemoryCache.set(key, {
          data: data,
          expiry: expiry
        });
        logger.debug(`Cache set (Memory): ${key}, TTL: ${ttlHours}h`);
      }

      this.cacheStats.sets++;
      return true;

    } catch (error) {
      logger.error('Error setting cached data:', error);
      return false;
    }
  }

  /**
   * Delete cached data
   */
  async delete(key) {
    try {
      if (this.redisClient && this.redisClient.isOpen) {
        await this.redisClient.del(key);
      } else {
        this.inMemoryCache.delete(key);
      }

      this.cacheStats.deletes++;
      logger.debug(`Cache delete: ${key}`);
      return true;

    } catch (error) {
      logger.error('Error deleting cached data:', error);
      return false;
    }
  }

  /**
   * Clear all cached data
   */
  async clear() {
    try {
      if (this.redisClient && this.redisClient.isOpen) {
        await this.redisClient.flushAll();
      } else {
        this.inMemoryCache.clear();
      }

      logger.info('Cache cleared');
      return true;

    } catch (error) {
      logger.error('Error clearing cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const stats = {
      ...this.cacheStats,
      cache_type: this.redisClient && this.redisClient.isOpen ? 'Redis' : 'In-Memory',
      memory_cache_size: this.inMemoryCache.size,
      hit_rate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0
    };

    return stats;
  }

  /**
   * Get cached data with pattern matching
   */
  async getByPattern(pattern) {
    try {
      const results = [];

      if (this.redisClient && this.redisClient.isOpen) {
        // Redis pattern matching
        const keys = await this.redisClient.keys(pattern);
        for (const key of keys) {
          const value = await this.get(key);
          if (value) {
            results.push({ key, value });
          }
        }
      } else {
        // In-memory pattern matching
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        for (const [key, item] of this.inMemoryCache.entries()) {
          if (regex.test(key) && item.expiry > Date.now()) {
            results.push({ key, value: item.data });
          }
        }
      }

      return results;

    } catch (error) {
      logger.error('Error getting cached data by pattern:', error);
      return [];
    }
  }

  /**
   * Set multiple cache entries at once
   */
  async setMultiple(entries, ttlHours = 720) {
    try {
      const promises = entries.map(({ key, data }) => 
        this.set(key, data, ttlHours)
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => result.status === 'fulfilled').length;
      
      logger.info(`Bulk cache set: ${successful}/${entries.length} successful`);
      return successful === entries.length;

    } catch (error) {
      logger.error('Error setting multiple cache entries:', error);
      return false;
    }
  }

  /**
   * Get cache health status
   */
  async getHealthStatus() {
    const status = {
      cache_type: this.redisClient && this.redisClient.isOpen ? 'Redis' : 'In-Memory',
      is_connected: this.redisClient ? this.redisClient.isOpen : true,
      stats: this.getStats(),
      memory_usage: process.memoryUsage(),
      uptime: process.uptime()
    };

    if (this.redisClient && this.redisClient.isOpen) {
      try {
        const info = await this.redisClient.info('memory');
        status.redis_memory = this.parseRedisInfo(info);
      } catch (error) {
        logger.warn('Could not get Redis memory info:', error.message);
      }
    }

    return status;
  }

  /**
   * Parse Redis INFO command output
   */
  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const memoryInfo = {};

    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (key.includes('memory')) {
          memoryInfo[key] = value;
        }
      }
    });

    return memoryInfo;
  }

  /**
   * Start periodic cleanup for in-memory cache
   */
  startCleanupInterval() {
    // Clean up expired in-memory cache entries every 5 minutes
    setInterval(() => {
      if (!this.redisClient || !this.redisClient.isOpen) {
        const now = Date.now();
        let expiredCount = 0;

        for (const [key, item] of this.inMemoryCache.entries()) {
          if (item.expiry <= now) {
            this.inMemoryCache.delete(key);
            expiredCount++;
          }
        }

        if (expiredCount > 0) {
          logger.debug(`Cleaned up ${expiredCount} expired cache entries`);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Gracefully close cache connections
   */
  async close() {
    try {
      if (this.redisClient && this.redisClient.isOpen) {
        await this.redisClient.quit();
        logger.info('Redis connection closed');
      }
      
      this.inMemoryCache.clear();
      logger.info('Cache manager closed');

    } catch (error) {
      logger.error('Error closing cache manager:', error);
    }
  }

  /**
   * Cache health data with automatic key generation
   */
  async cacheHealthData(userId, dataType, data, ttlHours = 720) {
    const key = `health:${userId}:${dataType}:${Date.now()}`;
    return await this.set(key, data, ttlHours);
  }

  /**
   * Get cached health data for user
   */
  async getHealthData(userId, dataType) {
    const pattern = `health:${userId}:${dataType}:*`;
    return await this.getByPattern(pattern);
  }

  /**
   * Cache family health summary
   */
  async cacheFamilyData(familyId, data, ttlHours = 24) {
    const key = `family:${familyId}:summary`;
    return await this.set(key, data, ttlHours);
  }

  /**
   * Get cached family health data
   */
  async getFamilyData(familyId) {
    const key = `family:${familyId}:summary`;
    return await this.get(key);
  }
}

module.exports = CacheManager;
