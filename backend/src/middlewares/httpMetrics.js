import { httpRequestDuration, httpRequestsTotal } from "../utils/metrics.js";

function normalizeRoute(req) {
  if (req.route?.path) {
    const base = req.baseUrl ?? "";
    return `${base}${req.route.path}`;
  }

  const path = req.path ?? req.url ?? "unknown";
  if (path === "/health" || path === "/metrics") {
    return path;
  }

  return "unmatched";
}

export function httpMetricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationSeconds = durationNs / 1e9;
    const route = normalizeRoute(req);
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode)
    };

    httpRequestDuration.observe(labels, durationSeconds);
    httpRequestsTotal.inc(labels);
  });

  next();
}
