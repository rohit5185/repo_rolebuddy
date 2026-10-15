const API_BASE = process.env.DISCOVERY_SMOKE_API_BASE ?? "http://localhost:5000";

function summarizeBody(body) {
  if (body === null || body === undefined) {
    return null;
  }

  if (typeof body === "string") {
    return body.slice(0, 240);
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

async function signupAndOnboard({ email, password, onboarding }) {
  const signup = await request("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const authCookie = getCookieHeaderFromResponse(signup);
  if (signup.status !== 201 || !authCookie) {
    throw new Error(`Signup failed for ${email}: ${JSON.stringify(summarizeBody(signup.body))}`);
  }

  const onboard = await request("/api/user/onboarding", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie
    },
    body: JSON.stringify(onboarding)
  });

  if (onboard.status !== 200) {
    throw new Error(`Onboarding failed for ${email}: ${JSON.stringify(summarizeBody(onboard.body))}`);
  }

  return {
    authCookie,
    userId: onboard?.body?.data?.user?.id
  };
}

async function run() {
  const checks = [];
  const failures = [];
  const addCheck = (name, pass, details) => {
    checks.push({ name, pass, details: summarizeBody(details) });
    if (!pass) {
      failures.push(name);
    }
  };

  const suffix = Date.now();
  const password = "TestPass123!";
  const role = `DiscoverySmoke-${suffix}`;

  const users = await Promise.all([
    signupAndOnboard({
      email: `discovery.a+${suffix}@example.com`,
      password,
      onboarding: { role, experience: "experienced", dailyGoal: 2, availability: "morning" }
    }),
    signupAndOnboard({
      email: `discovery.b+${suffix}@example.com`,
      password,
      onboarding: { role, experience: "fresher", dailyGoal: 1, availability: "night" }
    }),
    signupAndOnboard({
      email: `discovery.c+${suffix}@example.com`,
      password,
      onboarding: { role, experience: "experienced", dailyGoal: 3, availability: "afternoon" }
    })
  ]);

  await request("/api/user/dashboard", {
    headers: { Cookie: users[0].authCookie }
  });

  const searchResponse = await request(`/api/discovery/roles?q=${encodeURIComponent(role)}`, {
    headers: { Cookie: users[0].authCookie }
  });

  const searchCached = await request(`/api/discovery/roles?q=${encodeURIComponent(role)}`, {
    headers: { Cookie: users[0].authCookie }
  });

  const roleItem = searchResponse?.body?.data?.find?.((item) => typeof item.role === "string" && item.role.toLowerCase() === role.toLowerCase());

  addCheck("search returns target role", searchResponse.status === 200 && Boolean(roleItem), searchResponse.body);
  addCheck("cached search returns target role", searchCached.status === 200 && Boolean(roleItem), searchCached.body);
  addCheck(
    "aggregated counts are accurate",
    roleItem?.totalUsers === 3 && roleItem?.waitingUsers === 3,
    roleItem
  );
  addCheck("active users calculation is correct", roleItem?.activeUsers === 1, roleItem);

  const roleDetail = await request(`/api/discovery/role/${encodeURIComponent(role)}`, {
    headers: { Cookie: users[0].authCookie }
  });

  const sampleUsers = roleDetail?.body?.data?.users;
  const sampleCountPass = Array.isArray(sampleUsers) && sampleUsers.length <= 10;
  addCheck("role detail returns limited users", roleDetail.status === 200 && sampleCountPass, roleDetail.body);

  const noSensitiveFields =
    Array.isArray(sampleUsers) &&
    sampleUsers.every(
      (item) =>
        !Object.prototype.hasOwnProperty.call(item, "email") &&
        !Object.prototype.hasOwnProperty.call(item, "id") &&
        !Object.prototype.hasOwnProperty.call(item, "_id") &&
        !Object.prototype.hasOwnProperty.call(item, "matchedUserId")
    );

  addCheck("role detail does not leak sensitive fields", noSensitiveFields, sampleUsers);

  const injectionAttempt = await request("/api/discovery/roles?q=$where", {
    headers: { Cookie: users[0].authCookie }
  });

  addCheck("unsafe query input is rejected", injectionAttempt.status === 400, injectionAttempt.body);

  console.log("\nDiscovery API smoke test results:");
  for (const check of checks) {
    console.log(`${check.pass ? "PASS" : "FAIL"} - ${check.name}`);
  }

  if (failures.length > 0) {
    console.error(`\nFailed checks (${failures.length}):`);
    for (const item of failures) {
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  console.log("\nAll discovery smoke checks passed.");
  process.exit(0);
}

run().catch((error) => {
  console.error("Discovery smoke test crashed:", error);
  process.exit(1);
});
