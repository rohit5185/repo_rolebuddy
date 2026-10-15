import { apiRequest } from "@/services/api";

import type { OnboardingPayload, OnboardingResponse } from "./types";

export function submitOnboarding(payload: OnboardingPayload) {
  return apiRequest<OnboardingResponse>("/user/onboarding", {
    method: "PUT",
    body: JSON.stringify(payload),
    credentials: "include"
  });
}
