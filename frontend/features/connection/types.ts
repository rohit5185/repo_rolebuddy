export type ProfileSuggestion = {
  _id?: string;
  userId?: string;
  displayName?: string | null;
  role: string | null;
  specialization: string | null;
  domainArea: string;
  experience: string | null;
  dailyGoal: number | null;
  availability: string | null;
  lastActiveAt: string;
  matchScore: number;
  requestSent?: boolean;
  // Professional Progress Foundation fields
  activeToday?: boolean;
  contributionCount?: number;
  reliabilityLabel?: string | null;
};

export type UserProfile = {
  _id?: string;
  userId?: string;
  displayName?: string | null;
  role: string | null;
  specialization: string | null;
  domainArea: string;
  experience: string | null;
  dailyGoal: number | null;
  availability: string | null;
  lastActiveAt: string;
  matchScore?: number;
  requestSent?: boolean;
  // Professional Progress Foundation fields
  activeToday?: boolean;
  contributionCount?: number;
  reliabilityLabel?: string | null;
};

export type ConnectionRequest = {
  _id: string;
  from: {
    _id?: string;
    userId?: string;
    displayName: string | null;
    role: string | null;
    specialization: string | null;
    experience: string | null;
    domainArea: string | null;
  };
  to: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

export type Connection = {
  userId: UserProfile;
};

export type SuggestionsResponse = {
  message: string;
  data: ProfileSuggestion[];
};

export type ProfileResponse = {
  message: string;
  data: UserProfile;
};

export type ConnectionRequestsResponse = {
  message: string;
  data: ConnectionRequest[];
};

export type ConnectionsResponse = {
  message: string;
  data: Connection[];
};

export type SearchResponse = {
  message: string;
  data: UserProfile[];
};
