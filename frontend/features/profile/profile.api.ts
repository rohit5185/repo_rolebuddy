import { apiRequest, clearStoredToken } from "@/services/api";

import type { MatchHistoryResponse, ProfileResponse, UpdateProfilePayload, UpdateProfileResponse } from "./types";

export function getProfile() {
  return apiRequest<ProfileResponse>("/user/profile", {
    method: "GET",
    credentials: "include"
  });
}

export function updateProfile(payload: UpdateProfilePayload) {
  return apiRequest<UpdateProfileResponse>("/user/onboarding", {
    method: "PUT",
    body: JSON.stringify(payload),
    credentials: "include"
  });
}

export function getMatchHistory() {
  return apiRequest<MatchHistoryResponse>("/user/match-history", {
    method: "GET",
    credentials: "include"
  });
}

export async function logout() {
  // Clear stored Bearer token immediately (mobile auth fix)
  clearStoredToken();
  // Clear backend cookie (Render domain)
  await apiRequest<{ message: string; data: null }>("/auth/logout", {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
  // Clear Vercel-domain cookie so the middleware stops allowing access
  await fetch("/api/auth/clear-session", { method: "POST" }).catch(() => {});
  // Clear SW page caches so stale app pages aren't served post-logout on mobile
  if (typeof window !== "undefined" && "caches" in window) {
    await Promise.allSettled([
      caches.delete("app-pages"),
      caches.delete("auth-pages"),
    ]);
  }
}

