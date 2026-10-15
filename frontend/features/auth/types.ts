export type AuthPayload = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  email: string;
  anonUsername: string | null;
  createdAt: string;
  domain: "tech" | "non-tech" | null;
  domainArea: string | null;
  primaryArea: string | null;
  area: string | null;
  specialization: string | null;
  role: string | null;
  experience: string | null;
  skills: string[];
  intent: string | null;
  goal: string | null;
  dailyGoal: number | null;
  availabilityFrequency: string | null;
  availabilityTime: "morning" | "afternoon" | "night" | null;
  availability: string | null;
  preferences: string[];
  status: "waiting" | "matched";
  matchedUserId: string | null;
  onboardingCompleted: boolean;
  pendingMatchRequests?: {
    _id: string;
    from: {
      userId: string;
      displayName: string | null;
      role: string | null;
      specialization: string | null;
      experience: string | null;
      domainArea: string | null;
    } | null;
    createdAt: string;
  }[];
};

export type AuthResponse = {
  message: string;
  data: {
    user: AuthUser;
    /** JWT token — returned by backend so the frontend can set a Vercel-domain cookie */
    token?: string;
  };
};

export type ProfileResponse = {
  message: string;
  data: {
    user: AuthUser;
  };
};
