export const onboardingFeature = {
  name: "onboarding"
};

export { OnboardingFlow } from "./OnboardingFlow";
export { submitOnboarding } from "./onboarding.api";
export type {
  AvailabilityOption,
  DailyGoalOption,
  DomainOption,
  ExperienceOption,
  OnboardingPayload,
  OnboardingResponse
} from "./types";
