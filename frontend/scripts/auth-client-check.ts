/**
 * Frontend auth API client integration check.
 *
 * Runs against a live backend (NEXT_PUBLIC_API_BASE_URL).
 * Uses raw fetch with a manual cookie/token store because Node.js fetch
 * does NOT persist HttpOnly cookies across requests the way a browser does.
 * After login the accessToken is read from the set-cookie header and sent
 * as "Authorization: Bearer <token>" for protected endpoints.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

const checks: Array<{ name: string; pass: boolean; details?: unknown }> = [];
const failures: string[] = [];

function addCheck(name: string, pass: boolean, details?: unknown) {
  checks.push({ name, pass, details });
  if (!pass) {
    failures.push(name);
  }
}

/** Extract the value of a named cookie from a raw set-cookie header list. */
function extractCookieValue(
  setCookieHeaders: string[],
  cookieName: string
): string | null {
  for (const header of setCookieHeaders) {
    const pairs = header.split(";").map((s) => s.trim());
    const nameValue = pairs[0];
    const eqIdx = nameValue.indexOf("=");
    if (eqIdx === -1) continue;
    const name = nameValue.slice(0, eqIdx).trim();
    if (name === cookieName) {
      return nameValue.slice(eqIdx + 1).trim();
    }
  }
  return null;
}

interface ApiResult {
  body: unknown;
  token: string | null;
}

async function apiCall(
  path: string,
  init: RequestInit & { bearerToken?: string } = {}
): Promise<ApiResult> {
  const { bearerToken, ...fetchInit } = init;

  const headers = new Headers(fetchInit.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (bearerToken) {
    headers.set("Authorization", `Bearer ${bearerToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchInit,
    headers,
    // credentials: "include" has no effect in Node.js — we manage tokens manually
    credentials: "omit",
  });

  // Collect set-cookie headers to extract the accessToken for subsequent calls
  const rawSetCookie = response.headers.getSetCookie?.() ?? [];
  const token = extractCookieValue(rawSetCookie, "accessToken");

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body && typeof (body as Record<string, unknown>).message === "string"
        ? (body as Record<string, unknown>).message
        : `Request failed with status ${response.status}.`;
    throw new Error(message as string);
  }

  return { body, token };
}

async function run() {
  const email = `apitest.rolebuddy.client+${Date.now()}@example.com`;
  const password = "TestPass123!";

  try {
    // ── Signup ────────────────────────────────────────────────────────────────
    const signupResult = await apiCall("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const signupBody = signupResult.body as {
      message: string;
      data: { user: { email: string } };
    };
    addCheck(
      "signup via frontend auth.api returns user",
      Boolean(signupBody?.data?.user?.email),
      signupBody?.message
    );

    // ── Login (captures accessToken from set-cookie) ──────────────────────────
    const loginResult = await apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const loginBody = loginResult.body as {
      message: string;
      data: { user: { email: string } };
    };
    addCheck(
      "login via frontend auth.api returns user",
      Boolean(loginBody?.data?.user?.email),
      loginBody?.message
    );

    const accessToken = loginResult.token;
    addCheck(
      "login response sets accessToken cookie",
      Boolean(accessToken),
      accessToken ? "token present" : "token missing"
    );

    // ── Profile (sends token as Bearer header — same fallback the middleware supports) ──
    const profileResult = await apiCall("/user/profile", {
      method: "GET",
      bearerToken: accessToken ?? undefined,
    });

    const profileBody = profileResult.body as {
      message: string;
      data: { user: { email: string } };
    };
    addCheck(
      "profile via frontend auth.api returns matching user",
      profileBody?.data?.user?.email === email,
      profileBody?.data?.user?.email
    );

    // ── Results ───────────────────────────────────────────────────────────────
    console.log("\nFrontend API client integration results:");
    for (const check of checks) {
      console.log(`${check.pass ? "PASS" : "FAIL"} - ${check.name}`);
    }

    console.log(`\nTest email: ${email}`);

    if (failures.length > 0) {
      console.error("\nFailures:");
      for (const failure of failures) {
        console.error(`- ${failure}`);
      }
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error("Frontend API client integration check crashed:", error);
    process.exit(1);
  }
}

run();
