export type DomainOption = "tech" | "non-tech";
export type ExperienceOption =
  | "student / fresher"
  | "fresher"
  | "beginner"
  | "junior"
  | "mid-level"
  | "senior"
  | "manager"
  | "lead / head"
  | "experienced";
export type DailyGoalOption = 1 | 2 | 3;
export type AvailabilityOption = "morning" | "afternoon" | "night";

export type OnboardingPayload = {
  domain: DomainOption;
  primaryArea?: string | null;
  area?: string | null;
  specialization: string;
  role: string;
  experience: ExperienceOption;
  skills: string[];
  intent?: string | null;
  goal: string;
  dailyGoal: DailyGoalOption;
  availabilityFrequency: string;
  availabilityTime: AvailabilityOption;
  preferences: string[];
  availability: AvailabilityOption;
};

export type OnboardingResponse = {
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      domain: DomainOption | null;
      primaryArea: string | null;
      area: string | null;
      specialization: string | null;
      role: string;
      experience: ExperienceOption;
      skills: string[];
      intent: string | null;
      goal: string | null;
      dailyGoal: DailyGoalOption;
      availabilityFrequency: string | null;
      availabilityTime: AvailabilityOption | null;
      preferences: string[];
      availability: AvailabilityOption;
      status: "waiting" | "matched";
      matchedUserId: string | null;
      onboardingCompleted: boolean;
      createdAt: string;
    };
  };
};
