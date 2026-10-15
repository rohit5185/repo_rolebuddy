import { env } from "../../config/env.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createAccessToken,
  loginUser,
  signupUser,
  sendOtp,
  verifyOtp,
  getGoogleOAuthUrl,
  handleGoogleCallback
} from "./auth.service.js";

function buildCookieOptions() {
  const isProduction = env.nodeEnv === "production";
  
  let sameSite = isProduction ? "none" : "lax";
  if (env.cookieSameSite) {
    sameSite = env.cookieSameSite.toLowerCase();
  }

  let secure = isProduction;
  if (env.cookieSecure === "true") {
    secure = true;
  } else if (env.cookieSecure === "false") {
    secure = false;
  }

  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: env.jwtCookieMaxAgeMs
  };
}

// ── Password auth ─────────────────────────────────────────────────────────────

export const signup = asyncHandler(async (req, res) => {
  const result = await signupUser(req.body);
  const token = createAccessToken(result.user.id);

  res.cookie("accessToken", token, buildCookieOptions());

  res.status(201).json({
    message: "Signup successful.",
    data: { user: result.user, token }
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);
  const token = createAccessToken(result.user.id);

  res.cookie("accessToken", token, buildCookieOptions());

  res.status(200).json({
    message: "Login successful.",
    data: { user: result.user, token }
  });
});

export const logout = asyncHandler(async (_req, res) => {
  const cookieOptions = buildCookieOptions();
  delete cookieOptions.maxAge;
  res.clearCookie("accessToken", cookieOptions);

  res.status(200).json({ message: "Logged out successfully.", data: null });
});

// ── OTP auth ──────────────────────────────────────────────────────────────────

export const sendOtpHandler = asyncHandler(async (req, res) => {
  const result = await sendOtp(req.body);
  res.status(200).json({ message: result.message, data: null });
});

export const verifyOtpHandler = asyncHandler(async (req, res) => {
  const result = await verifyOtp(req.body);
  const token = createAccessToken(result.user.id);

  res.cookie("accessToken", token, buildCookieOptions());

  res.status(200).json({
    message: "OTP verified. Login successful.",
    data: { user: result.user, token }
  });
});

// ── Google OAuth ──────────────────────────────────────────────────────────────

export const googleRedirect = asyncHandler(async (_req, res) => {
  const url = getGoogleOAuthUrl();
  res.redirect(url);
});

export const googleCallback = asyncHandler(async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    const frontendUrl = env.frontendUrl;
    return res.redirect(`${frontendUrl}/login?google_error=access_denied`);
  }

  const result = await handleGoogleCallback(String(code));
  const token = createAccessToken(result.user.id);

  res.cookie("accessToken", token, buildCookieOptions());

  const redirectPath = result.user.onboardingCompleted ? "/dashboard" : "/onboarding";
  // Pass token in redirect so the frontend (on Vercel domain) can mirror it
  // via /api/auth/set-session — required because the HttpOnly cookie set above
  // lives on the Render domain and is invisible to the Next.js middleware on Vercel.
  res.redirect(`${env.frontendUrl}/auth/callback?next=${redirectPath}&token=${token}`);
});
