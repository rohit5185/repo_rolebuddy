const isServer = typeof window === "undefined";
const API_BASE_URL = isServer
  ? (process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api")
  : (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api");

// ── Mobile Bearer-token fallback ───────────────────────────────────────────────
// Mobile browsers (Safari iOS, Chrome Android) frequently block cross-site
// SameSite=None cookies (ITP / storage partitioning). We mirror the JWT in
// localStorage so every API call can send it as Authorization: Bearer,
// bypassing the cross-domain cookie restriction on mobile PWA.

const TOKEN_KEY = "rb_access_token";

export function storeToken(token: string): void {
  if (isServer) return;
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* private mode */ }
}

export function clearStoredToken(): void {
  if (isServer) return;
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* private mode */ }
}

function getStoredToken(): string | null {
  if (isServer) return null;
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  headers.set("Content-Type", "application/json");

  // Inject Bearer token for mobile where cross-site cookies are blocked
  const stored = getStoredToken();
  if (stored && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${stored}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers
  });

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      responseData && typeof responseData.message === "string"
        ? responseData.message
        : `Request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return responseData as T;
}
