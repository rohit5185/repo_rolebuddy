import type { AuthUser } from "@/features/auth/types";

export type { AuthUser as ProfileUser };

export type MatchHistoryStatus = "active" | "connected";

export type MatchHistoryEntry = {
  userId: string;
  role: string | null;
  experience: string | null;
  status: MatchHistoryStatus;
};

export type ProfileResponse = {
  message: string;
  data: {
    user: AuthUser;
  };
};

export type MatchHistoryResponse = {
  message: string;
  data: MatchHistoryEntry[];
};

export type UpdateProfilePayload = {
  domain?: string;
  primaryArea?: string | null;
  area?: string | null;
  specialization?: string;
  role?: string;
  experience?: string;
  skills?: string[];
  intent?: string | null;
  goal?: string;
  dailyGoal?: number;
  availabilityFrequency?: string;
  availabilityTime?: string;
  availability?: string;
  preferences?: string[];
};

export type UpdateProfileResponse = {
  message: string;
  data: {
    user: AuthUser;
  };
};
