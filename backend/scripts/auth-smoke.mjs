const API_BASE = "http://localhost:5000";

function summarizeBody(body) {
  if (body === null || body === undefined) {
    return null;
  }

  if (typeof body === "string") {
    return body.slice(0, 180);
  }

  return body;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const contentType = response.headers.get("content-type") || "";

  let body = null;
  if (contentType.includes("application/json")) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  return {
    status: response.status,
    headers: response.headers,
    body
  };
}

function getCookieHeaderFromResponse(result) {
  const setCookie = result.headers.get("set-cookie");
  if (!setCookie) {
    return null;
  }

  const firstCookieSegment = setCookie.split(",")[0];
  return firstCookieSegment.split(";")[0];
}

async function run() {
  const email = `apitest.rolebuddy+${Date.now()}@example.com`;
  const password = "TestPass123!";
  const failures = [];
  const checks = [];

  const addCheck = (name, pass, details) => {
    checks.push({ name, pass, details: summarizeBody(details) });
    if (!pass) {
      failures.push(name);
    }
  };

  try {
    const health = await request("/health");
    addCheck("GET /health returns 200", health.status === 200, health.body);

    const badEmailSignup = await request("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid-email", password })
    });
    addCheck("POST /api/auth/signup invalid email -> 400", badEmailSignup.status === 400, badEmailSignup.body);

    const shortPasswordSignup = await request("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "shortpass@example.com", password: "123" })
    });
    addCheck("POST /api/auth/signup short password -> 400", shortPasswordSignup.status === 400, shortPasswordSignup.body);

    const signup = await request("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    addCheck("POST /api/auth/signup valid -> 201", signup.status === 201, signup.body);
    // NOTE: token IS intentionally included in the response body for cross-domain PWA
    // session mirroring (mobile browsers block SameSite=None cookies cross-site).
    // The frontend reads data.token to mirror it as a same-origin Vercel cookie.
    addCheck(
      "signup response includes session token for cross-domain mirroring",
      typeof signup.body?.data?.token === "string",
      signup.body
    );
    addCheck(
      "signup response does not expose password",
      !JSON.stringify(signup.body || {}).includes("password"),
      signup.body
    );

    const signupCookie = getCookieHeaderFromResponse(signup);
    addCheck("signup sets auth cookie", Boolean(signupCookie), signup.headers.get("set-cookie"));

    const duplicateSignup = await request("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    addCheck("POST /api/auth/signup duplicate -> 409", duplicateSignup.status === 409, duplicateSignup.body);

    const profileNoAuth = await request("/api/user/profile");
    addCheck("GET /api/user/profile without auth -> 401", profileNoAuth.status === 401, profileNoAuth.body);

    const loginBadPassword = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "WrongPass123!" })
    });
    addCheck("POST /api/auth/login wrong password -> 401", loginBadPassword.status === 401, loginBadPassword.body);

    const login = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    addCheck("POST /api/auth/login valid -> 200", login.status === 200, login.body);
    // NOTE: token IS intentionally in the response body for cross-domain PWA mirroring.
    addCheck(
      "login response includes session token for cross-domain mirroring",
      typeof login.body?.data?.token === "string",
      login.body
    );

    const loginCookie = getCookieHeaderFromResponse(login);
    addCheck("login sets auth cookie", Boolean(loginCookie), login.headers.get("set-cookie"));

    const profileWithCookie = await request("/api/user/profile", {
      headers: loginCookie ? { Cookie: loginCookie } : {}
    });
    addCheck("GET /api/user/profile with cookie -> 200", profileWithCookie.status === 200, profileWithCookie.body);

    console.log("\nAuth API smoke test results:");
    for (const check of checks) {
      console.log(`${check.pass ? "PASS" : "FAIL"} - ${check.name}`);
    }

    console.log(`\nTest email: ${email}`);

    if (failures.length > 0) {
      console.error(`\nFailed checks (${failures.length}):`);
      for (const item of failures) {
        console.error(`- ${item}`);
      }
      process.exit(1);
    }

    console.log("\nAll auth smoke checks passed.");
    process.exit(0);
  } catch (error) {
    console.error("Auth smoke test crashed:", error);
    process.exit(1);
  }
}

run();
