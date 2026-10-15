const API_BASE = process.env.DOMAIN_AREA_SMOKE_API_BASE ?? "http://localhost:5000";

function summarizeBody(body) {
  if (body === null || body === undefined) {
    return null;
  }

  if (typeof body === "string") {
    return body.slice(0, 220);
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

async function signup(email, password) {
  const result = await request("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const token = result?.body?.data?.token;
  if (result.status !== 201 || typeof token !== "string") {
    throw new Error(`Signup failed for ${email}: ${JSON.stringify(summarizeBody(result.body))}`);
  }

  return token;
}

async function onboard(token, payload) {
  return request("/api/user/onboarding", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

async function getProfile(token) {
  return request("/api/user/profile", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
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

  const techEmail = `domain.tech+${suffix}@example.com`;
  const techToken = await signup(techEmail, password);
  const techPrimaryArea = "Software Development";

  const techOnboarding = await onboard(techToken, {
    domain: "tech",
    primaryArea: techPrimaryArea,
    specialization: "Frontend Development",
    role: `TechRole-${suffix}`,
    experience: "experienced",
    skills: ["React", "TypeScript"],
    intent: "Job search",
    goal: "Job search",
    dailyGoal: 2,
    availabilityFrequency: "Few times a week",
    availabilityTime: "morning",
    preferences: []
  });

  addCheck("tech onboarding succeeds", techOnboarding.status === 200, techOnboarding.body);
  addCheck(
    "tech onboarding maps domainArea from primaryArea",
    techOnboarding?.body?.data?.user?.domainArea === techPrimaryArea,
    techOnboarding.body
  );
  addCheck(
    "tech response keeps legacy primaryArea",
    techOnboarding?.body?.data?.user?.primaryArea === techPrimaryArea,
    techOnboarding.body
  );

  const techProfile = await getProfile(techToken);
  addCheck("tech profile fetch succeeds", techProfile.status === 200, techProfile.body);
  addCheck(
    "tech profile contains mapped domainArea",
    techProfile?.body?.data?.user?.domainArea === techPrimaryArea,
    techProfile.body
  );

  const nonTechEmail = `domain.nontech+${suffix}@example.com`;
  const nonTechToken = await signup(nonTechEmail, password);
  const nonTechArea = "Business Operations";

  const nonTechOnboarding = await onboard(nonTechToken, {
    domain: "non-tech",
    area: nonTechArea,
    specialization: "Operations",
    role: `NonTechRole-${suffix}`,
    experience: "experienced",
    skills: ["Planning", "Communication"],
    intent: "Career growth",
    goal: "Leadership",
    dailyGoal: 2,
    availabilityFrequency: "Daily",
    availabilityTime: "night",
    preferences: ["Accountability"]
  });

  addCheck("non-tech onboarding succeeds", nonTechOnboarding.status === 200, nonTechOnboarding.body);
  addCheck(
    "non-tech onboarding maps domainArea from area",
    nonTechOnboarding?.body?.data?.user?.domainArea === nonTechArea,
    nonTechOnboarding.body
  );
  addCheck(
    "non-tech response keeps legacy area",
    nonTechOnboarding?.body?.data?.user?.area === nonTechArea,
    nonTechOnboarding.body
  );

  const nonTechProfile = await getProfile(nonTechToken);
  addCheck("non-tech profile fetch succeeds", nonTechProfile.status === 200, nonTechProfile.body);
  addCheck(
    "non-tech profile contains mapped domainArea",
    nonTechProfile?.body?.data?.user?.domainArea === nonTechArea,
    nonTechProfile.body
  );

  console.log("\nDomain-area smoke test results:");
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

  console.log("\nAll domain-area smoke checks passed.");
  process.exit(0);
}

run().catch((error) => {
  console.error("Domain-area smoke test crashed:", error);
  process.exit(1);
});
