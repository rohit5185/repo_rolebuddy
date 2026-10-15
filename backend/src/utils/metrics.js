import client from "prom-client";

export const metricsRegister = new client.Registry();

client.collectDefaultMetrics({
  register: metricsRegister,
  prefix: "rolebuddy_"
});

export const httpRequestDuration = new client.Histogram({
  name: "rolebuddy_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegister]
});

export const httpRequestsTotal = new client.Counter({
  name: "rolebuddy_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [metricsRegister]
});
