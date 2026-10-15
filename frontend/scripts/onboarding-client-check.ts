import { login, signup, getProfile } from "../features/auth/auth.api";
import { submitOnboarding } from "../features/onboarding/onboarding.api";

type LocalStorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function localStorageMock(): LocalStorageLike {
  const store = new Map<string, string>();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    }
  };
}

(globalThis as unknown as { window: { localStorage: LocalStorageLike } }).window = {
  localStorage: localStorageMock()
};

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  const email = `apitest.rolebuddy.onboarding.client+${Date.now()}@example.com`;
  const password = "TestPass123!";

  console.log("Running frontend onboarding API integration check...");

  const signupResult = await signup({ email, password });
  assert(signupResult.data.user.email === email.toLowerCase(), "Signup returned unexpected email");

  const loginResult = await login({ email, password });
  assert(Boolean(loginResult.data.user.email), "Login user missing");

  const onboardingResult = await submitOnboarding({
    domain: "tech",
    primaryArea: "Software Development",
    specialization: "Full Stack",
    role: "Fullstack",
    experience: "experienced",
    skills: ["React", "Node.js", "TypeScript"],
    intent: "Job search",
    goal: "Referrals",
    dailyGoal: 3,
    availabilityFrequency: "Few times a week",
    availabilityTime: "night",
    preferences: ["Same role", "Same tech stack"],
    availability: "night"
  });
  assert(onboardingResult.data.user.onboardingCompleted === true, "Onboarding completion was not persisted");

  const profileAfterOnboarding = await getProfile();
  assert(profileAfterOnboarding.data.user.onboardingCompleted === true, "Profile did not reflect onboarding completion");
  assert(profileAfterOnboarding.data.user.role === "Fullstack", "Role was not saved correctly");
  assert(profileAfterOnboarding.data.user.experience === "experienced", "Experience was not saved correctly");
  assert(profileAfterOnboarding.data.user.dailyGoal === 3, "Daily goal was not saved correctly");
  assert(profileAfterOnboarding.data.user.availability === "night", "Availability was not saved correctly");

  console.log("PASS - frontend signup/login/onboarding/profile flow");
  console.log(`Test email: ${email}`);
}

run().catch((error) => {
  console.error("FAIL - frontend onboarding API integration check");
  console.error(error);
  process.exit(1);
});
