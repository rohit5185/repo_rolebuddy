const API_BASE = process.env.DASHBOARD_SMOKE_API_BASE ?? "http://localhost:5000";

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

async function signupAndOnboard({ email, password, onboarding }) {
  const signup = await request("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const token = signup?.body?.data?.token;
  if (signup.status !== 201 || typeof token !== "string") {
    throw new Error(`Signup failed for ${email}: ${JSON.stringify(summarizeBody(signup.body))}`);
  }

  const onboard = await request("/api/user/onboarding", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(onboarding)
  });

  if (onboard.status !== 200) {
    throw new Error(`Onboarding failed for ${email}: ${JSON.stringify(summarizeBody(onboard.body))}`);
  }

  return {
    token,
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
  const role = `DashboardSmoke-${suffix}`;

  const userA = await signupAndOnboard({
    email: `dashboard.a+${suffix}@example.com`,
    password,
    onboarding: { role, experience: "experienced", dailyGoal: 2, availability: "morning" }
  });

  const userB = await signupAndOnboard({
    email: `dashboard.b+${suffix}@example.com`,
    password,
    onboarding: { role, experience: "experienced", dailyGoal: 2, availability: "morning" }
  });

  const initialDashboard = await request("/api/user/dashboard", {
    headers: { Authorization: `Bearer ${userA.token}` }
  });

  addCheck(
    "dashboard returns waiting + pending before matching",
    initialDashboard.status === 200 &&
      initialDashboard?.body?.data?.matching?.status === "waiting" &&
      initialDashboard?.body?.data?.todayStatus === "pending",
    initialDashboard.body
  );

  const matchA = await request("/api/match/find", {
    method: "POST",
    headers: { Authorization: `Bearer ${userA.token}` }
  });

  const matchB = await request("/api/match/find", {
    method: "POST",
    headers: { Authorization: `Bearer ${userB.token}` }
  });

  addCheck(
    "match flow completes for both users",
    matchA.status === 200 && matchB.status === 200 && matchA?.body?.data?.status === "matched",
    { matchA: matchA.body, matchB: matchB.body }
  );

  const postMatchDashboard = await request("/api/user/dashboard", {
    headers: { Authorization: `Bearer ${userA.token}` }
  });

  addCheck(
    "dashboard shows matched status and partner block",
    postMatchDashboard.status === 200 &&
      postMatchDashboard?.body?.data?.matching?.status === "matched" &&
      typeof postMatchDashboard?.body?.data?.partner?.partnerId === "string",
    postMatchDashboard.body
  );

  const partnerId = postMatchDashboard?.body?.data?.partner?.partnerId;

  const conversation = await request("/api/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userA.token}`
    },
    body: JSON.stringify({ partnerId })
  });

  const conversationId = conversation?.body?.data?.conversation?.id;
  addCheck("conversation created", conversation.status === 201 || conversation.status === 200, conversation.body);

  const messages = await request(`/api/messages/${conversationId}`, {
    headers: { Authorization: `Bearer ${userA.token}` }
  });

  const checkinMessage = messages?.body?.data?.messages?.find?.(
    (message) => message.type === "checkin" && message.metadata?.kind === "daily_checkin"
  );

  addCheck("daily check-in prompt exists", Boolean(checkinMessage?.id), messages.body);

  const checkinResponse = await request("/api/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userA.token}`
    },
    body: JSON.stringify({
      conversationId,
      type: "checkin",
      metadata: {
        sourceCheckinId: checkinMessage.id,
        status: "done",
        dateKey: new Date().toISOString().slice(0, 10),
        clientMessageId: `dashboard-smoke-${suffix}`
      }
    })
  });

  addCheck("check-in response accepted", checkinResponse.status === 201 || checkinResponse.status === 200, checkinResponse.body);

  const postCheckinDashboard = await request("/api/user/dashboard", {
    headers: { Authorization: `Bearer ${userA.token}` }
  });

  addCheck(
    "dashboard reflects check-in status and streak",
    postCheckinDashboard.status === 200 &&
      postCheckinDashboard?.body?.data?.todayStatus === "done" &&
      typeof postCheckinDashboard?.body?.data?.user?.streakCount === "number",
    postCheckinDashboard.body
  );

  console.log("\nDashboard API smoke test results:");
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

  console.log("\nAll dashboard smoke checks passed.");
  process.exit(0);
}

run().catch((error) => {
  console.error("Dashboard smoke test crashed:", error);
  process.exit(1);
});
