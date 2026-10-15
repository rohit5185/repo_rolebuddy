export type DiscoveryRoleAggregate = {
  role: string;
  totalUsers: number;
  activeUsers: number;
  waitingUsers: number;
};

export type DiscoveryRoleUser = {
  experience: string | null;
  dailyGoal: number | null;
  status: "waiting" | "matched";
  matchScore?: number;
  // Professional Progress Foundation fields (additive — backend-derived)
  reliabilityLabel?: string | null;
  contributionCount?: number;
  activeRecently?: boolean;
};

export type DiscoveryRoleSearchResponse = {
  message: string;
  data: DiscoveryRoleAggregate[];
};

export type DiscoveryRoleDetailResponse = {
  message: string;
  data: {
    role: string;
    users: DiscoveryRoleUser[];
  };
};
