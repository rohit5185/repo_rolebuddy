import { randomUUID } from "node:crypto";

import { createRequestLogger } from "../utils/logger.js";

export function requestIdMiddleware(req, res, next) {
  const incoming = req.headers["x-request-id"];
  const requestId =
    typeof incoming === "string" && incoming.trim() ? incoming.trim() : randomUUID();

  req.requestId = requestId;
  req.log = createRequestLogger(requestId);
  res.setHeader("X-Request-Id", requestId);
  next();
}
