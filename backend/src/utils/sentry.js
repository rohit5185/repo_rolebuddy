import * as Sentry from "@sentry/node";

import { env } from "../config/env.js";
import { logger } from "./logger.js";

let enabled = false;

export function initSentry() {
  if (!env.sentryDsn) {
    logger.info("Sentry disabled (SENTRY_DSN not set)");
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.nodeEnv,
    tracesSampleRate: env.sentryTracesSampleRate,
    release: process.env.SENTRY_RELEASE || undefined
  });

  enabled = true;
  logger.info({ tracesSampleRate: env.sentryTracesSampleRate }, "Sentry initialized");
}

/**
 * @param {unknown} error
 * @param {{ requestId?: string }} [context]
 */
export function captureException(error, context = {}) {
  if (!enabled) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context.requestId) {
      scope.setTag("requestId", context.requestId);
    }
    Sentry.captureException(error);
  });
}
