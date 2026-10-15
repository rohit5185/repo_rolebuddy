import Redis from "ioredis";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";

import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

// ---------------------------------------------------------------------------
// Real IP extraction
// ---------------------------------------------------------------------------

function getRealIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = String(forwarded).split(",")[0].trim();
    if (first) return first;
  }
  const realIp = req.headers["x-real-ip"];
  if (realIp) return String(realIp).trim();
  return req.ip ?? req.socket?.remoteAddress ?? "unknown";
}

// ---------------------------------------------------------------------------
// Redis store factory — PROBE FIRST, only create store if Redis is actually up
// ---------------------------------------------------------------------------
//
// Root cause of server hang:
//   enableOfflineQueue: true  → ioredis queued rate-limit commands when Redis
//   was unreachable, causing every HTTP request to block indefinitely.
//
// Fix:
//   - Attempt a quick PING to verify Redis is reachable before creating
//     a RedisStore. If Redis is down, return undefined → express-rate-limit
//     uses built-in in-memory store which never blocks.
//   - The probe has a 2-second timeout so startup isn't slowed down.
//   - enableOfflineQueue: false on both probe and store client so commands
//     always reject fast if connectivity is lost later.
// ---------------------------------------------------------------------------

async function makeRedisStore(prefix) {
  if (!env.redisUrl?.trim()) {
    logger.warn(`Rate-limiter [${prefix}]: No REDIS_URL — using in-memory store.`);
    return undefined;
  }

  // Quick ping to verify Redis is reachable before creating the store.
  // If this fails, we fall back to in-memory — no requests are blocked.
  const probe = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    enableOfflineQueue: false,
    connectTimeout: 2000,
    lazyConnect: true,
    retryStrategy: () => null, // no retries for probe
  });

  try {
    await probe.connect();
    await probe.ping();
    logger.info(`Rate-limiter [${prefix}]: Redis reachable — using Redis store.`);
  } catch (err) {
    logger.warn({ err }, `Rate-limiter [${prefix}]: Redis not reachable — using in-memory store.`);
    probe.disconnect(false);
    return undefined;
  } finally {
    probe.disconnect(false);
  }

  // Redis is confirmed up — create the real persistent client for the store.
  const client = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    enableOfflineQueue: false, // reject immediately if Redis drops mid-flight
    connectTimeout: 3000,
    retryStrategy: (times) => {
      if (times > 5) return null;
      return Math.min(times * 500, 3000);
    },
  });

  client.on("error", (err) => {
    if (err.code === "ECONNREFUSED" || err.code === "ECONNRESET" || err.code === "ENOTFOUND") {
      logger.debug({ err }, `Rate-limiter Redis [${prefix}]: connection lost`);
    } else {
      logger.warn({ err }, `Rate-limiter Redis client error [${prefix}]`);
    }
  });

  return new RedisStore({
    sendCommand: (...args) => client.call(...args),
    prefix,
  });
}

// ---------------------------------------------------------------------------
// Build limiters — async because we probe Redis before creating the store.
// Express middleware is synchronous, so we build the limiter asynchronously
// then swap it in once ready. Until it's ready, a fast in-memory fallback
// is used so the app never blocks on startup.
// ---------------------------------------------------------------------------

function buildLimiter(options) {
  // Immediate in-memory fallback (used until async Redis probe completes)
  let activeLimiter = rateLimit({ ...options, store: undefined });

  // Kick off Redis probe and upgrade the limiter if Redis is available.
  makeRedisStore(options._prefix)
    .then((store) => {
      if (store) {
        activeLimiter = rateLimit({ ...options, store });
        logger.info(`Rate-limiter [${options._prefix}]: upgraded to Redis store.`);
      }
    })
    .catch((err) => {
      logger.warn({ err }, `Rate-limiter [${options._prefix}]: probe failed, keeping in-memory.`);
    });

  // Return a middleware that always delegates to the current activeLimiter.
  // This way swapping activeLimiter above takes effect immediately.
  return (req, res, next) => activeLimiter(req, res, next);
}

// ---------------------------------------------------------------------------
// General API rate limiter
// ---------------------------------------------------------------------------

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const max = Number(process.env.RATE_LIMIT_MAX) || 500;

export const apiRateLimiter = buildLimiter({
  _prefix: "rl:api:",
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getRealIp(req),
  validate: false,
  skip: (req) =>
    req.originalUrl === "/health" ||
    req.originalUrl === "/metrics" ||
    req.originalUrl.startsWith("/api/auth"),
  handler(_req, res) {
    res.status(429).json({ message: "Too many requests. Please try again later.", data: null });
  },
});

// ---------------------------------------------------------------------------
// Auth-specific rate limiter (stricter — protects OTP / login / signup)
// ---------------------------------------------------------------------------

const authWindowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const authMax = Number(process.env.AUTH_RATE_LIMIT_MAX) || 30;

export const authRateLimiter = buildLimiter({
  _prefix: "rl:auth:",
  windowMs: authWindowMs,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getRealIp(req),
  validate: false,
  handler(_req, res) {
    res.status(429).json({ message: "Too many requests. Please try again later.", data: null });
  },
});
