const API_BASE = "http://localhost:5000";

function summarize(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return value.slice(0, 250);
  }

  return value;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const contentType = response.headers.get("content-type") || "";

  let body;
  if (contentType.includes("application/json")) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  return { status: response.status, body, headers: response.headers };
}

function buildOnboardingPayload({ role, experience, specialization, domainArea, domain = "tech" }) {
  const normalizedDomain = String(domain || "tech").toLowerCase() === "non-tech" ? "non-tech" : "tech";

  return {
    domain: normalizedDomain,
    ...(normalizedDomain === "tech" ? { primaryArea: domainArea } : { area: domainArea }),
    specialization,
    role,
    experience,
    skills: [specialization],
    intent: "Job search",
    goal: "Job search",
    dailyGoal: 2,
    availabilityFrequency: "Few times a week",
    availabilityTime: "morning",
    preferences: []
  };
}

async function signupAndOnboard({ email, password, role, experience, specialization, domainArea, domain = "tech" }) {
  const signup = await request("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const token = signup?.body?.data?.token;
  if (signup.status !== 201 || typeof token !== "string") {
    throw new Error(`Signup failed for ${email}: ${JSON.stringify(summarize(signup.body))}`);
  }

  const onboard = await request("/api/user/onboarding", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(buildOnboardingPayload({ role, experience, specialization, domainArea, domain }))
  });

  if (onboard.status !== 200) {
    throw new Error(`Onboarding failed for ${email}: ${JSON.stringify(summarize(onboard.body))}`);
  }

  return {
    token,
    id: onboard?.body?.data?.user?.id,
    profile: onboard?.body?.data?.user,
    email
  };
}

async function touchActive(user) {
  const response = await request("/api/user/dashboard", {
    method: "GET",
    headers: { Authorization: `Bearer ${user.token}` }
  });

  if (response.status !== 200) {
    throw new Error(`Unable to touch activity for ${user.email}: ${JSON.stringify(summarize(response.body))}`);
  }
}

async function findMatch(user) {
  return request("/api/match/find", {
    method: "POST",
    headers: { Authorization: `Bearer ${user.token}` }
  });
}

async function rematch(user) {
  return request("/api/match/rematch", {
    method: "POST",
    headers: { Authorization: `Bearer ${user.token}` }
  });
}

async function getProfile(user) {
  return request("/api/user/profile", {
    method: "GET",
    headers: { Authorization: `Bearer ${user.token}` }
  });
}

async function updateUserLifecycle(userId, fields) {
  const { default: mongoose } = await import("mongoose");
  const { User } = await import("../src/features/auth/auth.model.js");
  const { env } = await import("../src/config/env.js");

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(env.mongoUri);
  }

  await User.updateOne({ _id: userId }, { $set: fields });
}

async function run() {
  const suffix = Date.now();
  const password = "TestPass123!";
  const checks = [];
  const failures = [];

  const addCheck = (name, pass, details) => {
    checks.push({ name, pass, details: summarize(details) });
    if (!pass) {
      failures.push(name);
    }
  };

  try {
    const pairA = await signupAndOnboard({
      email: `match.lifecycle.a+${suffix}@example.com`,
      password,
      role: `rb-lifecycle-role-${suffix}`,
      experience: "junior",
      specialization: `rb-lifecycle-spec-${suffix}`,
      domainArea: `rb-lifecycle-domain-${suffix}`
    });

    const pairB = await signupAndOnboard({
      email: `match.lifecycle.b+${suffix}@example.com`,
      password,
      role: `rb-lifecycle-role-${suffix}`,
      experience: "junior",
      specialization: `rb-lifecycle-spec-${suffix}`,
      domainArea: `rb-lifecycle-domain-${suffix}`
    });

    await touchActive(pairA);
    await touchActive(pairB);

    const initialMatch = await findMatch(pairA);
    addCheck(
      "1. Match creation succeeds",
      initialMatch.status === 200 && initialMatch?.body?.data?.matched === true,
      initialMatch.body
    );

    const pairedProfileA = await getProfile(pairA);
    const pairedProfileB = await getProfile(pairB);
    const pairedUserA = pairedProfileA?.body?.data?.user;
    const pairedUserB = pairedProfileB?.body?.data?.user;

    addCheck(
      "2. Match persists symmetrically",
      pairedProfileA.status === 200 &&
        pairedProfileB.status === 200 &&
        String(pairedUserA?.matchedUserId || "") === String(pairB.id) &&
        String(pairedUserB?.matchedUserId || "") === String(pairA.id) &&
        pairedUserA?.status === "matched" &&
        pairedUserB?.status === "matched",
      { pairedProfileA: pairedProfileA.body, pairedProfileB: pairedProfileB.body }
    );

    const existingMatch = await findMatch(pairA);
    addCheck(
      "3. Existing match is returned idempotently",
      existingMatch.status === 200 &&
        existingMatch?.body?.data?.matched === true &&
        String(existingMatch?.body?.data?.conversationId || "") === String(initialMatch?.body?.data?.conversationId || ""),
      existingMatch.body
    );

    await updateUserLifecycle(pairA.id, {
      activeMatchExpiresAt: new Date("2000-01-01T00:00:00.000Z")
    });

    const expiredDashboard = await request("/api/user/dashboard", {
      headers: { Authorization: `Bearer ${pairA.token}` }
    });

    addCheck(
      "4. Expired matches are cleaned on dashboard fetch",
      expiredDashboard.status === 200 &&
        expiredDashboard?.body?.data?.matching?.status === "waiting" &&
        expiredDashboard?.body?.data?.partner === null,
      expiredDashboard.body
    );

    const rematchCooldownPairA = await signupAndOnboard({
      email: `match.lifecycle.cooldown.a+${suffix}@example.com`,
      password,
      role: `rb-lifecycle-cooldown-${suffix}`,
      experience: "junior",
      specialization: `rb-lifecycle-cooldown-${suffix}`,
      domainArea: `rb-lifecycle-cooldown-${suffix}`
    });

    const rematchCooldownPairB = await signupAndOnboard({
      email: `match.lifecycle.cooldown.b+${suffix}@example.com`,
      password,
      role: `rb-lifecycle-cooldown-${suffix}`,
      experience: "junior",
      specialization: `rb-lifecycle-cooldown-${suffix}`,
      domainArea: `rb-lifecycle-cooldown-${suffix}`
    });

    await touchActive(rematchCooldownPairA);
    await touchActive(rematchCooldownPairB);

    const cooldownMatch = await findMatch(rematchCooldownPairA);
    addCheck(
      "5. Cooldown pair can match initially",
      cooldownMatch.status === 200 && cooldownMatch?.body?.data?.matched === true,
      cooldownMatch.body
    );

    await updateUserLifecycle(rematchCooldownPairA.id, {
      lastMatchAt: new Date()
    });

    const rematchBlocked = await rematch(rematchCooldownPairA);
    addCheck(
      "6. Rematch is rate-limited within 24 hours",
      rematchBlocked.status === 409,
      rematchBlocked.body
    );

    await updateUserLifecycle(rematchCooldownPairA.id, {
      lastMatchAt: new Date("2000-01-01T00:00:00.000Z")
    });

    const rematchAllowed = await rematch(rematchCooldownPairA);
    addCheck(
      "7. Rematch succeeds after cooldown",
      rematchAllowed.status === 200 && rematchAllowed?.body?.data?.matched === true,
      rematchAllowed.body
    );

    console.log("\nMatching lifecycle smoke test results:");
    for (const check of checks) {
      console.log(`${check.pass ? "PASS" : "FAIL"} - ${check.name}`);
    }

    if (failures.length > 0) {
      console.error(`\nFailed checks (${failures.length}):`);
      for (const failure of failures) {
        console.error(`- ${failure}`);
      }
      process.exit(1);
    }

    console.log("\nAll matching lifecycle smoke checks passed.");
    process.exit(0);
  } catch (error) {
    console.error("Matching lifecycle smoke test crashed:", error);
    process.exit(1);
  }
}

run();