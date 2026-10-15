import pino from "pino";

import { env } from "../config/env.js";

export const logger = pino({
  level: env.logLevel,
  base: {
    env: env.nodeEnv,
    service: "rolebuddy-backend"
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label })
  }
});

/**
 * @param {string} [requestId]
 * @returns {import('pino').Logger}
 */
export function createRequestLogger(requestId) {
  if (!requestId) {
    return logger;
  }
  return logger.child({ requestId });
}
