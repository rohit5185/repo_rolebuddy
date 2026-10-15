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
    body,
    headers: response.headers
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
  const email = `onboarding.rolebuddy+${Date.now()}@example.com`;
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
    const signup = await request("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    addCheck("signup works", signup.status === 201, signup.body);

    const authCookie = getCookieHeaderFromResponse(signup);

    addCheck("signup sets auth cookie", Boolean(authCookie), signup.headers.get("set-cookie"));

    const onboardingNoRole = await request("/api/user/onboarding", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authCookie ? { Cookie: authCookie } : {})
      },
      body: JSON.stringify({ experience: "fresher", dailyGoal: 2, availability: "morning" })
    });

    addCheck("onboarding without role rejected", onboardingNoRole.status === 400, onboardingNoRole.body);

    const onboardingNoExperience = await request("/api/user/onboarding", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authCookie ? { Cookie: authCookie } : {})
      },
      body: JSON.stringify({ role: "Frontend", dailyGoal: 2, availability: "morning" })
    });

    addCheck("onboarding without experience rejected", onboardingNoExperience.status === 400, onboardingNoExperience.body);

    const onboardingInvalidDailyGoal = await request("/api/user/onboarding", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authCookie ? { Cookie: authCookie } : {})
      },
      body: JSON.stringify({ role: "Frontend", experience: "experienced", dailyGoal: 99, availability: "night" })
    });

    addCheck("onboarding invalid dailyGoal rejected", onboardingInvalidDailyGoal.status === 400, onboardingInvalidDailyGoal.body);

    const onboardingInvalidAvailability = await request("/api/user/onboarding", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authCookie ? { Cookie: authCookie } : {})
      },
      body: JSON.stringify({ role: "Frontend", experience: "experienced", dailyGoal: 3, availability: "weekend" })
    });

    addCheck(
      "onboarding invalid availability rejected",
      onboardingInvalidAvailability.status === 400,
      onboardingInvalidAvailability.body
    );

    const onboardingSuccess = await request("/api/user/onboarding", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authCookie ? { Cookie: authCookie } : {})
      },
      body: JSON.stringify({ role: "Frontend", experience: "experienced", dailyGoal: 3, availability: "night" })
    });

    addCheck("onboarding submit succeeds", onboardingSuccess.status === 200, onboardingSuccess.body);
    addCheck(
      "onboarding response marks completion",
      onboardingSuccess?.body?.data?.user?.onboardingCompleted === true,
      onboardingSuccess.body
    );

    const profileAfterOnboarding = await request("/api/user/profile", {
      headers: authCookie ? { Cookie: authCookie } : {}
    });

    addCheck("profile fetch after onboarding succeeds", profileAfterOnboarding.status === 200, profileAfterOnboarding.body);
    addCheck(
      "profile has onboarding fields",
      profileAfterOnboarding?.body?.data?.user?.role === "Frontend" &&
        profileAfterOnboarding?.body?.data?.user?.experience === "experienced" &&
        profileAfterOnboarding?.body?.data?.user?.dailyGoal === 3 &&
        profileAfterOnboarding?.body?.data?.user?.availability === "night" &&
        profileAfterOnboarding?.body?.data?.user?.onboardingCompleted === true,
      profileAfterOnboarding.body
    );

    console.log("\nOnboarding API smoke test results:");
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

    console.log("\nAll onboarding smoke checks passed.");
    process.exit(0);
  } catch (error) {
    console.error("Onboarding smoke test crashed:", error);
    process.exit(1);
  }
}

run();
