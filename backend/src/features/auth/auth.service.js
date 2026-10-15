import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/appError.js";
import { sendOtpEmail } from "../../utils/email.service.js";
import { assignAnonUsername } from "../../utils/anonUsername.js";
import { User } from "./auth.model.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 3;

// ── Helpers ───────────────────────────────────────────────────────────────────

function validateEmail(email) {
  const normalized = String(email ?? "").trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalized)) {
    throw new AppError("Please provide a valid email address.", 400);
  }
  return normalized;
}

function validateCredentials(email, password) {
  const normalizedEmail = validateEmail(email);
  const normalizedPassword = String(password ?? "");

  if (normalizedPassword.length < 8) {
    throw new AppError("Password must be at least 8 characters long.", 400);
  }

  return { email: normalizedEmail, password: normalizedPassword };
}

export function createAccessToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

function serializeAuthUser(user) {
  return {
    id: user._id,
    email: user.email,
    anonUsername: user.anonUsername ?? null,
    createdAt: user.createdAt,
    authProvider: user.authProvider ?? "local",
    domain: user.domain ?? null,
    domainArea: user.domainArea ?? "Unassigned",
    primaryArea: user.primaryArea ?? null,
    area: user.area ?? null,
    specialization: user.specialization ?? null,
    role: user.role ?? null,
    experience: user.experience ?? null,
    skills: user.skills ?? [],
    intent: user.intent ?? null,
    goal: user.goal ?? null,
    dailyGoal: user.dailyGoal ?? null,
    availabilityFrequency: user.availabilityFrequency ?? null,
    availabilityTime: user.availabilityTime ?? null,
    availability: user.availability ?? null,
    preferences: user.preferences ?? [],
    status: user.status ?? "waiting",
    matchedUserId: user.matchedUserId ?? null,
    onboardingCompleted: Boolean(user.onboardingCompleted)
  };
}

// ── Password Auth (existing) ──────────────────────────────────────────────────

export async function signupUser(payload) {
  const { email, password } = validateCredentials(payload.email, payload.password);

  const existingUser = await User.findOne({ email }).select("_id authProvider").lean();
  if (existingUser) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({ email, password: hashedPassword, authProvider: "local" });
  await assignAnonUsername(user._id, null);
  const freshUser = await User.findById(user._id).lean();
  return { user: serializeAuthUser(freshUser) };
}

export async function loginUser(payload) {
  const { email, password } = validateCredentials(payload.email, payload.password);

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (!user.password) {
    throw new AppError("This account uses Google or OTP sign-in. Please use the appropriate method.", 400);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password.", 401);
  }

  return { user: serializeAuthUser(user) };
}

// ── OTP Auth ──────────────────────────────────────────────────────────────────

export async function sendOtp(payload) {
  const email = validateEmail(payload.email);

  // Find or create the user
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email, authProvider: "otp" });
    await assignAnonUsername(user._id, null);
  }

  // Rate-limit: if existing OTP hasn't expired yet, allow resend after 1 min
  if (user.otp?.expiresAt && new Date(user.otp.expiresAt) > new Date()) {
    const timeSinceIssued = OTP_TTL_MS - (new Date(user.otp.expiresAt).getTime() - Date.now());
    if (timeSinceIssued < 60 * 1000) {
      throw new AppError("OTP was just sent. Please wait 1 minute before requesting a new one.", 429);
    }
  }

  const otp = generateOtp();
  const hashedOtp = await hashOtp(otp);

  await User.updateOne({ _id: user._id }, {
    $set: {
      "otp.code": hashedOtp,
      "otp.expiresAt": new Date(Date.now() + OTP_TTL_MS),
      "otp.attempts": 0
    }
  });

  await sendOtpEmail(email, otp);

  return { message: "OTP sent successfully." };
}

export async function verifyOtp(payload) {
  const email = validateEmail(payload.email);
  const code = String(payload.code ?? "").trim();

  if (!code || code.length !== 6) {
    throw new AppError("Please enter a valid 6-digit OTP.", 400);
  }

  const user = await User.findOne({ email });
  if (!user || !user.otp?.code) {
    throw new AppError("No OTP was requested for this email. Please request a new one.", 400);
  }

  if (!user.otp.expiresAt || new Date(user.otp.expiresAt) < new Date()) {
    throw new AppError("OTP has expired. Please request a new one.", 400);
  }

  if ((user.otp.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
    throw new AppError("Too many incorrect attempts. Please request a new OTP.", 429);
  }

  const isValid = await bcrypt.compare(code, user.otp.code);

  if (!isValid) {
    await User.updateOne({ _id: user._id }, { $inc: { "otp.attempts": 1 } });
    const remaining = OTP_MAX_ATTEMPTS - ((user.otp.attempts ?? 0) + 1);
    throw new AppError(`Incorrect OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`, 400);
  }

  // Clear OTP on success
  await User.updateOne({ _id: user._id }, {
    $set: { "otp.code": null, "otp.expiresAt": null, "otp.attempts": 0, authProvider: "otp" }
  });

  return { user: serializeAuthUser(user) };
}

// ── Google OAuth ───────────────────────────────────────────────────────────────

export function getGoogleOAuthUrl() {
  const clientId = env.googleSigninClientId;
  if (!clientId) {
    throw new AppError("Google Sign-In is not configured on this server.", 503);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: env.googleSigninRedirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account"
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function handleGoogleCallback(code) {
  const clientId = env.googleSigninClientId;
  const clientSecret = env.googleSigninClientSecret;

  if (!clientId || !clientSecret) {
    throw new AppError("Google Sign-In is not configured on this server.", 503);
  }

  // Exchange authorization code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: env.googleSigninRedirectUri,
      grant_type: "authorization_code"
    }).toString()
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new AppError(`Google token exchange failed: ${err}`, 400);
  }

  const { access_token } = await tokenRes.json();

  // Fetch user info from Google
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` }
  });

  if (!userInfoRes.ok) {
    throw new AppError("Failed to fetch user info from Google.", 400);
  }

  const googleUser = await userInfoRes.json();
  const email = String(googleUser.email ?? "").toLowerCase().trim();

  if (!email || !EMAIL_REGEX.test(email)) {
    throw new AppError("Google account did not provide a valid email.", 400);
  }

  // Find or create user
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email, authProvider: "google" });
    await assignAnonUsername(user._id, null);
  } else if (user.authProvider === "local" && !user.password) {
    // Edge case: set to google if they had no password
    await User.updateOne({ _id: user._id }, { $set: { authProvider: "google" } });
  }

  return { user: serializeAuthUser(user) };
}
