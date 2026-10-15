import dotenv from "dotenv";

dotenv.config();

function requireEnv(name, fallback = "") {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseNumber(value, fallback) {
  const parsed = Number(value ?? fallback);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseNumber(process.env.PORT, 5000),
  mongoUri: requireEnv("MONGO_URI"),
  redisUrl: process.env.REDIS_URL ?? "",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  jwtSecret: requireEnv("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  jwtCookieMaxAgeMs: parseNumber(process.env.JWT_COOKIE_MAX_AGE_MS, 7 * 24 * 60 * 60 * 1000),
  cookieSameSite: process.env.COOKIE_SAME_SITE ?? "",
  cookieSecure: process.env.COOKIE_SECURE ?? "",
  // Google Calendar OAuth (existing — do NOT change)
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleOAuthRedirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "",
  // Google Sign-In OAuth (separate from Calendar)
  googleSigninClientId: process.env.GOOGLE_SIGNIN_CLIENT_ID ?? (process.env.GOOGLE_CLIENT_ID ?? ""),
  googleSigninClientSecret: process.env.GOOGLE_SIGNIN_CLIENT_SECRET ?? (process.env.GOOGLE_CLIENT_SECRET ?? ""),
  googleSigninRedirectUri: process.env.GOOGLE_SIGNIN_REDIRECT_URI ?? "http://localhost:5000/api/auth/google/callback",
  // Email — Nodemailer SMTP (local dev fallback only; SMTP is blocked on Render)
  emailHost: process.env.EMAIL_HOST ?? "",
  emailPort: parseNumber(process.env.EMAIL_PORT, 587),
  emailUser: process.env.EMAIL_USER ?? "",
  emailPass: process.env.EMAIL_PASS ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "",
  // Email — Resend HTTPS API (production; works on Render and all cloud hosts)
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "",
  // Web Push / VAPID
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  vapidEmail: process.env.VAPID_EMAIL ?? "mailto:admin@rolebuddy.app",
  logLevel:
    process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === "production" ? "info" : "debug"),
  sentryDsn: process.env.SENTRY_DSN ?? "",
  sentryTracesSampleRate: parseNumber(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.1)
};
