const API_BASE = process.env.UNIFIED_SMOKE_API_BASE ?? "http://localhost:5000";

function summarize(body) {
  if (body === null || body === undefined) {
    return null;
  }

  if (typeof body === "string") {
    return body.slice(0, 280);
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
    body,
    headers: response.headers
  };
}

function buildOnboarding(roleSeed) {
  return {
    domain: "tech",
    primaryArea: "Software Development",
    specialization: `${roleSeed}-spec`,
    role: `${roleSeed}-role`,
    experience: "mid-level",
    skills: ["Node.js", "MongoDB"],
    intent: "Job search",
    goal: "Get job ready",
    dailyGoal: 2,
    availabilityFrequency: "Few times a week",
    availabilityTime: "morning",
    preferences: []
  };
}

async function signupAndOnboard({ email, password, roleSeed }) {
  const signup = await request("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  let token = signup?.body?.data?.token;
  if (!token) {
    const setCookie = signup.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/accessToken=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
  }

  if (signup.status !== 201 || !token) {
    throw new Error(`Signup failed for ${email}: ${JSON.stringify(summarize(signup.body))}`);
  }

  const onboarding = await request("/api/user/onboarding", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(buildOnboarding(roleSeed))
  });

  if (onboarding.status !== 200) {
    throw new Error(`Onboarding failed for ${email}: ${JSON.stringify(summarize(onboarding.body))}`);
  }

  return {
    token,
    id: onboarding?.body?.data?.user?.id,
    role: onboarding?.body?.data?.user?.role
  };
}

async function getProfile(user) {
  return request("/api/user/profile", {
    headers: { Authorization: `Bearer ${user.token}` }
  });
}

async function findMatch(user) {
  return request("/api/match/find", {
    method: "POST",
    headers: { Authorization: `Bearer ${user.token}` }
  });
}

async function sendRequest(fromUser, toUserId) {
  return request("/api/connection/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fromUser.token}`
    },
    body: JSON.stringify({ toUserId })
  });
}

async function acceptRequest(user, fromUserId) {
  return request("/api/connection/request/accept", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.token}`
    },
    body: JSON.stringify({ fromUserId })
  });
}

async function getSuggestions(user, limit = 50) {
  return request(`/api/connection/suggestions?limit=${limit}`, {
    headers: { Authorization: `Bearer ${user.token}` }
  });
}

async function getRequests(user) {
  return request("/api/connection/requests", {
    headers: { Authorization: `Bearer ${user.token}` }
  });
}

async function getConnections(user) {
  return request("/api/connection/list", {
    headers: { Authorization: `Bearer ${user.token}` }
  });
}

async function getMessages(user, conversationId) {
  return request(`/api/messages/${conversationId}`, {
    headers: { Authorization: `Bearer ${user.token}` }
  });
}

async function setReverseMatchedEdgeCase(userId, targetId) {
  const { default: mongoose } = await import("mongoose");
  const { env } = await import("../src/config/env.js");
  const { User } = await import("../src/features/auth/auth.model.js");

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(env.mongoUri);
  }

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        status: "matched",
        matchedUserId: targetId,
        activeMatchExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
      }
    }
  );
}

async function run() {
  const checks = [];
  const failures = [];
  const suffix = Date.now();
  const password = "TestPass123!";

  const addCheck = (name, pass, details) => {
    checks.push({ name, pass, details: summarize(details) });
    if (!pass) {
      failures.push(name);
    }
  };

  // 1) Symmetric match assignment A <-> B
  const symRole = `unified-sym-${suffix}`;
  const userA = await signupAndOnboard({ email: `unified.a+${suffix}@example.com`, password, roleSeed: symRole });
  const userB = await signupAndOnboard({ email: `unified.b+${suffix}@example.com`, password, roleSeed: symRole });

  const matchA = await findMatch(userA);
  addCheck("1.1 match endpoint returns success", matchA.status === 200 && matchA?.body?.data?.matched === true, matchA.body);

  const [profileA, profileB] = await Promise.all([getProfile(userA), getProfile(userB)]);
  const profileAData = profileA?.body?.data?.user;
  const profileBData = profileB?.body?.data?.user;
  const symmetricOk =
    profileA.status === 200 &&
    profileB.status === 200 &&
    String(profileAData?.matchedUserId || "") === String(userB.id) &&
    String(profileBData?.matchedUserId || "") === String(userA.id) &&
    profileAData?.status === "matched" &&
    profileBData?.status === "matched";

  addCheck("1.2 symmetric match persisted on both users", symmetricOk, {
    profileA: profileA.body,
    profileB: profileB.body
  });

  // 2) Exclusion matrix + discovery correctness (only available visible)
  const matrixRole = `unified-matrix-${suffix}`;
  const viewer = await signupAndOnboard({ email: `unified.viewer+${suffix}@example.com`, password, roleSeed: matrixRole });
  const available = await signupAndOnboard({ email: `unified.available+${suffix}@example.com`, password, roleSeed: matrixRole });
  const pendingSentTarget = await signupAndOnboard({ email: `unified.psent+${suffix}@example.com`, password, roleSeed: matrixRole });
  const pendingReceivedSource = await signupAndOnboard({ email: `unified.precv+${suffix}@example.com`, password, roleSeed: matrixRole });
  const connectedPeer = await signupAndOnboard({ email: `unified.conn+${suffix}@example.com`, password, roleSeed: matrixRole });
  const reverseMatchedPeer = await signupAndOnboard({ email: `unified.rmatch+${suffix}@example.com`, password, roleSeed: matrixRole });

  await sendRequest(viewer, pendingSentTarget.id);
  await sendRequest(pendingReceivedSource, viewer.id);
  await sendRequest(connectedPeer, viewer.id);
  await acceptRequest(viewer, connectedPeer.id);
  await setReverseMatchedEdgeCase(reverseMatchedPeer.id, viewer.id);

  const suggestions = await getSuggestions(viewer, 100);
  const suggestionIds = (suggestions?.body?.data ?? []).map((item) => String(item._id));

  const exclusionOk =
    suggestions.status === 200 &&
    suggestionIds.includes(String(available.id)) &&
    !suggestionIds.includes(String(pendingSentTarget.id)) &&
    !suggestionIds.includes(String(pendingReceivedSource.id)) &&
    !suggestionIds.includes(String(connectedPeer.id)) &&
    !suggestionIds.includes(String(reverseMatchedPeer.id));

  addCheck("2.1 exclusion matrix enforced (matched/connected/pending both directions)", exclusionOk, suggestions.body);
  addCheck(
    "2.2 discovery shows only available profiles",
    exclusionOk && suggestionIds.length >= 1,
    { suggestionIds }
  );

  // 3) Accept -> chat ready
  const chatRole = `unified-chat-${suffix}`;
  const chatSender = await signupAndOnboard({ email: `unified.chat.a+${suffix}@example.com`, password, roleSeed: chatRole });
  const chatReceiver = await signupAndOnboard({ email: `unified.chat.b+${suffix}@example.com`, password, roleSeed: chatRole });

  await sendRequest(chatSender, chatReceiver.id);
  const accept = await acceptRequest(chatReceiver, chatSender.id);
  const conversationId = accept?.body?.data?.conversationId;

  const chatReady = await getMessages(chatSender, conversationId);
  addCheck(
    "3. accept request returns conversation and chat is ready",
    accept.status === 200 && typeof conversationId === "string" && chatReady.status === 200,
    { accept: accept.body, chatReady: chatReady.body }
  );

  // 4) Duplicate prevention for requests + connections
  const dedupeRole = `unified-dedupe-${suffix}`;
  const d1 = await signupAndOnboard({ email: `unified.d1+${suffix}@example.com`, password, roleSeed: dedupeRole });
  const d2 = await signupAndOnboard({ email: `unified.d2+${suffix}@example.com`, password, roleSeed: dedupeRole });

  const req1 = await sendRequest(d1, d2.id);
  const req2 = await sendRequest(d1, d2.id);
  const d2Requests = await getRequests(d2);
  const pendingFromD1 = (d2Requests?.body?.data ?? []).filter((item) => String(item.from?.userId) === String(d1.id));

  const firstAccept = await acceptRequest(d2, d1.id);
  const secondAccept = await acceptRequest(d2, d1.id);
  const d2Connections = await getConnections(d2);
  const linksToD1 = (d2Connections?.body?.data ?? []).filter((item) => String(item.userId?._id || item.userId) === String(d1.id));

  addCheck(
    "4. duplicate requests and connections are prevented",
    req1.status === 201 &&
      req2.status === 200 &&
      pendingFromD1.length === 1 &&
      firstAccept.status === 200 &&
      secondAccept.status === 404 &&
      linksToD1.length === 1,
    {
      req1: req1.body,
      req2: req2.body,
      pendingFromD1: pendingFromD1.length,
      firstAccept: firstAccept.body,
      secondAccept: secondAccept.body,
      linksToD1: linksToD1.length
    }
  );

  console.log("\nUnified Match/Discovery/Connection/Chat smoke test results:");
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

  console.log("\nAll unified smoke checks passed.");
  process.exit(0);
}

run().catch((error) => {
  console.error("Unified smoke test crashed:", error);
  process.exit(1);
});
