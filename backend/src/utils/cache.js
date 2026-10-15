import Redis from "ioredis";

import { env } from "../config/env.js";
import { logger } from "./logger.js";

export const CACHE_DEFAULT_TTL_SECONDS = 60;

/** @type {Redis | null} */
let redisClient = null;

function isCacheEnabled() {
  return Boolean(env.redisUrl?.trim());
}

function getRedis() {
  if (!isCacheEnabled()) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true
    });

    redisClient.on("error", (error) => {
      logger.warn({ err: error }, "Redis cache client error");
    });
  }

  return redisClient;
}

/**
 * @param {string} key
 * @returns {Promise<unknown | null>}
 */
export async function get(key) {
  const redis = getRedis();
  if (!redis) {
    return null;
  }

  try {
    if (redis.status !== "ready") {
      await redis.connect();
    }

    const raw = await redis.get(key);
    if (raw === null) {
      return null;
    }

    return JSON.parse(raw);
  } catch (error) {
    logger.warn({ err: error, key }, "Cache get failed");
    return null;
  }
}

/**
 * @param {string} key
 * @param {unknown} value
 * @param {number} [ttlSeconds]
 */
export async function set(key, value, ttlSeconds = CACHE_DEFAULT_TTL_SECONDS) {
  const redis = getRedis();
  if (!redis) {
    return false;
  }

  try {
    if (redis.status !== "ready") {
      await redis.connect();
    }

    const payload = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await redis.set(key, payload, "EX", ttlSeconds);
    } else {
      await redis.set(key, payload);
    }
    return true;
  } catch (error) {
    logger.warn({ err: error, key }, "Cache set failed");
    return false;
  }
}

/**
 * @param {string | string[]} keys
 */
export async function del(keys) {
  const redis = getRedis();
  if (!redis) {
    return 0;
  }

  const keyList = Array.isArray(keys) ? keys.filter(Boolean) : [keys].filter(Boolean);
  if (keyList.length === 0) {
    return 0;
  }

  try {
    if (redis.status !== "ready") {
      await redis.connect();
    }

    return await redis.del(...keyList);
  } catch (error) {
    logger.warn({ err: error, keys: keyList }, "Cache del failed");
    return 0;
  }
}

/**
 * @param {string} prefix
 */
export async function delByPrefix(prefix) {
  const redis = getRedis();
  if (!redis || !prefix) {
    return 0;
  }

  try {
    if (redis.status !== "ready") {
      await redis.connect();
    }

    let cursor = "0";
    let removed = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        removed += await redis.del(...keys);
      }
    } while (cursor !== "0");

    return removed;
  } catch (error) {
    logger.warn({ err: error, prefix }, "Cache delByPrefix failed");
    return 0;
  }
}

/**
 * @param {{ userIds?: string[], role?: string | null }} [options]
 */
export async function invalidateDiscoveryAndMatchCaches(options = {}) {
  const userIds = (options.userIds ?? []).map((id) => String(id)).filter(Boolean);

  await delByPrefix("discovery:");

  if (userIds.length > 0) {
    await del(userIds.map((userId) => `match:candidates:${userId}`));
  }

  if (options.role) {
    const roleKey = String(options.role).trim().toLowerCase();
    if (roleKey) {
      await delByPrefix(`discovery:role:${roleKey}:`);
      await del(`discovery:role:${roleKey}`);
    }
  }
}

export async function closeCacheRedis() {
  if (!redisClient) {
    return;
  }

  const client = redisClient;
  redisClient = null;

  try {
    if (client.status === "ready" || client.status === "connecting") {
      await client.quit();
    }
  } catch (error) {
    logger.warn({ err: error }, "Failed to close Redis cache client");
  }
}
