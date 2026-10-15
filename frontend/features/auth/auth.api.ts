import { apiRequest, storeToken, clearStoredToken } from "../../services/api";

import type { AuthPayload, AuthResponse, ProfileResponse } from "./types";

/**
 * After every successful auth response:
 * 1. Mirror the token as a same-origin Vercel cookie (middleware can read it).
 * 2. Store it in localStorage so every API call can send it as Bearer header
 *    (mobile browsers often block cross-site SameSite=None cookies).
 */
async function mirrorSession(token: string | undefined) {
  if (!token) return;
  // Store for mobile Bearer fallback (cross-domain cookie workaround)
  storeToken(token);
  try {
    await fetch("/api/auth/set-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch {
    // Non-fatal — the Bearer header fallback still works for API calls.
  }
}

export async function signup(payload: AuthPayload) {
  const result = await apiRequest<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
    credentials: "include",
  });
  await mirrorSession(result.data?.token);
  return result;
}

export async function login(payload: AuthPayload) {
  const result = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    credentials: "include",
  });
  await mirrorSession(result.data?.token);
  return result;
}

export function getProfile() {
  return apiRequest<ProfileResponse>("/user/profile", {
    method: "GET",
    credentials: "include",
  });
}

export async function logout() {
  // Clear stored Bearer token immediately
  clearStoredToken();
  // Clear backend cookie (Render domain)
  await apiRequest("/auth/logout", {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
  // Clear Vercel-domain cookie so middleware stops allowing access
  await fetch("/api/auth/clear-session", { method: "POST" }).catch(() => {});
  // Clear SW page caches so stale app pages aren't served post-logout on mobile
  if (typeof window !== "undefined" && "caches" in window) {
    await Promise.allSettled([
      caches.delete("app-pages"),
      caches.delete("auth-pages"),
    ]);
  }
}


export async function sendOtp(email: string) {
  return apiRequest<{ message: string; data: null }>("/auth/otp/send", {
    method: "POST",
    body: JSON.stringify({ email }),
    credentials: "include",
  });
}

export async function verifyOtp(email: string, code: string) {
  const result = await apiRequest<AuthResponse>("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
    credentials: "include",
  });
  await mirrorSession(result.data?.token);
  return result;
}
