import { env } from "../config/env.js";
import { createClient, type RedisClientType } from 'redis';
import { logger } from "../utils/log.js";

const REDIS_CONFIG = {
  maxMemory: '512mb',
  prefix: 'AUTH',
  policy: 'allkeys-lru', 
};

export enum CACHE_TYPES {
    LIST = 'list',
    SESSION = 'session'
}

let client: RedisClientType;

export const connectRedis = async (): Promise<RedisClientType> => {
  if (!client) {
    client = createClient({
      url: env.REDIS_URL
    });

    client.on('error', (err) => logger.error('Redis Client Error:', err));

    await client.connect();

    await client.configSet('maxmemory', REDIS_CONFIG.maxMemory);
    await client.configSet('maxmemory-policy', REDIS_CONFIG.policy);

    logger.info(`Redis ready: ${REDIS_CONFIG.maxMemory} limit, ${REDIS_CONFIG.policy} policy.`);
  }


  return client;
};


export const cache = {
  set: async (type: string, id: string, data: any, ttlSeconds = 3600) => {
    const key = `${REDIS_CONFIG.prefix}:${type}:${id}`;

    const value = JSON.stringify(data); 
    return client.set(key, value, { EX: ttlSeconds });
  },

  get: async <T>(type: string, id: string): Promise<T | null> => {
    const key = `${REDIS_CONFIG.prefix}:${type}:${id}`;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  },

  del: async (type: string, id: string) => {
    const key = `${REDIS_CONFIG.prefix}:${type}:${id}`;
    return client.del(key);
  },

  clearByType: async (type: string) => {
    const pattern = `${REDIS_CONFIG.prefix}:${type}:*`;
    const keys = await client.keys(pattern);

    if (keys.length > 0) {
      await client.del(keys);
    }
  }
};