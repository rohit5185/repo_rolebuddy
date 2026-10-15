import { logger } from "../utils/logger.js";
import { captureException } from "../utils/sentry.js";

export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed.";
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = "Resource already exists.";
  }

  const requestId = req.requestId ?? "unknown";
  const log = req.log ?? logger.child({ requestId });

  if (statusCode >= 500) {
    log.error({ err, statusCode }, message);
    captureException(err, { requestId });
  } else {
    log.warn({ err, statusCode }, message);
  }

  if (req.requestId) {
    res.setHeader("X-Request-Id", requestId);
  }

  res.status(statusCode).json({
    message,
    data: null,
    requestId,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {})
  });
}
