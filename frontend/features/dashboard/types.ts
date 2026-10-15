export type DashboardTodayStatus = "done" | "not_done" | "pending";
export type DashboardMatchingStatus = "waiting" | "matched";
export type PreparationStatus = "Starting Preparation" | "Preparing Actively" | "Interview Ready";

export type DashboardUser = {
  role: string | null;
  experience: string | null;
  dailyGoal: number | null;
  streakCount: number;
  lastCheckInDate: string | null;
  lastActiveAt: string | null;
  onboardingCompleted: boolean;
  // Professional Progress Foundation fields (additive — backend-derived)
  consistencyStreak?: number;
  contributionCount?: number;
  reliability?: {
    score: number | null;
    label: string | null;
  } | null;
  preparationStatus?: PreparationStatus | null;
};

export type DashboardPartner = {
  partnerId: string;
  partnerRole: string | null;
  partnerExperience: string | null;
  partnerStreak: number;
  partnerLastCheckIn: string | null;
  partnerLastActive: string | null;
};

export type DashboardResponse = {
  message: string;
  data: {
    user: DashboardUser;
    todayStatus: DashboardTodayStatus;
    partner: DashboardPartner | null;
    matching: {
      status: DashboardMatchingStatus;
    };
  };
};