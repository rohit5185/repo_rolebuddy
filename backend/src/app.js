import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import authRouter from "./features/auth/auth.routes.js";
import chatRouter from "./features/chat/chat.routes.js";
import connectionRouter from "./features/connection/connection.routes.js";
import discoveryRouter from "./features/discovery/discovery.routes.js";
import exchangeRouter from "./features/exchange/exchange.routes.js";
import interviewRouter from "./features/interview/interview.routes.js";
import matchRouter from "./features/match/match.routes.js";
import userRouter from "./features/user/user.routes.js";
import notificationRouter from "./features/notification/notification.routes.js";
import { apiRateLimiter, authRateLimiter } from "./middlewares/apiRateLimiter.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { httpMetricsMiddleware } from "./middlewares/httpMetrics.js";
import { requestIdMiddleware } from "./middlewares/requestId.js";
import { metricsRegister } from "./utils/metrics.js";

const app = express();

// Trust the first proxy (Docker/Load Balancer) so rate limiters get the real IP
app.set("trust proxy", 1);

app.use(requestIdMiddleware);
app.use(httpMetricsMiddleware);

// Support multiple allowed origins (comma-separated CLIENT_ORIGIN env var).
// e.g. CLIENT_ORIGIN=https://rolebuddy.me,https://www.rolebuddy.me
const rawOrigins = env.clientOrigin.replace(/^["']|["']$/g, "").trim();
const allowedOrigins = rawOrigins.split(",").map((o) => o.trim()).filter(Boolean);

console.log(`[CORS] Allowed origins: ${allowedOrigins.join(", ")}`);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} is not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.status(200).json({
    message: "Service is healthy.",
    data: {
      status: "ok",
      service: "rolebuddy-backend",
      timestamp: new Date().toISOString()
    }
  });
});

app.get("/metrics", async (_req, res) => {
  res.setHeader("Content-Type", metricsRegister.contentType);
  res.status(200).end(await metricsRegister.metrics());
});

app.use("/api", apiRateLimiter);

app.use("/api/auth", authRateLimiter, authRouter);
app.use("/api/user", userRouter);
app.use("/api/match", matchRouter);
app.use("/api/matches", matchRouter);
app.use("/api/connection", connectionRouter);
app.use("/api/discovery", discoveryRouter);
app.use("/api/exchanges", exchangeRouter);
app.use("/api/interviews", interviewRouter);
app.use("/api", chatRouter);
app.use("/api/chats", chatRouter);
app.use("/api/notifications", notificationRouter);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found.", data: null });
});

app.use(errorHandler);

export default app;
