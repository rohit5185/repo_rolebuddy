import type { AuthUser } from "../auth/types";

export type ChatMessageType =
  | "text"
  | "checkin"
  | "system"
  | "reminder"
  | "alert"
  | "interview_request"
  | "interview_system"
  | "interview_question"
  | "interview_answer"
  | "interview_feedback"
  // Phase 3: Live interview scheduling
  | "interview_schedule_request"
  | "interview_schedule_system"
  | "interview_meeting_card";


export type InterviewSessionStatus = "pending" | "active" | "paused" | "completed" | "cancelled";
export type InterviewMode = "text_async" | "live_online" | "live_video";
export type InterviewTemplateType = "technical" | "hr" | "behavioral" | "mixed" | "resume_round";
export type InterviewDomain = "tech" | "non-tech" | "any";
export type InterviewDifficulty = "beginner" | "intermediate" | "advanced";

export type InterviewQuestion = {
  index: number;
  question: string;
  type: "open" | "technical" | "behavioral" | "situational" | "hr" | "resume";
  followUps: string[];
  expectedTopics: string[];
  notes?: string | null;
};

export type InterviewTemplate = {
  id: string;
  title: string;
  domain: InterviewDomain;
  role: string | null;
  type: InterviewTemplateType;
  difficulty: InterviewDifficulty;
  estimatedDuration: number;
  totalQuestions: number;
  questions: InterviewQuestion[];
  createdBy?: string | null;
  isSystemTemplate?: boolean;
  visibility?: "public" | "private";
  usageCount?: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type InterviewRatings = {
  communication?: number | null;
  technical?: number | null;
  problemSolving?: number | null;
  overall?: number | null;
};

export type InterviewSession = {
  id: string;
  conversationId: string;
  interviewerId: string;
  candidateId: string;
  templateId: string;
  mode: InterviewMode;
  scheduleStatus?: "proposed" | "confirmed" | "missed" | "completed" | "cancelled" | null;
  proposedSlots?: string[];
  confirmedSlot?: string | null;
  timezoneHint?: string | null;
  googleCalendar?: {
    interviewer?: { eventId: string | null; eventLink: string | null };
    candidate?: { eventId: string | null; eventLink: string | null };
  };
  liveOnlineStatus?: {
    interviewerOnline: boolean;
    candidateOnline: boolean;
    bothOnline: boolean;
  };
  status: InterviewSessionStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  finalRatings: InterviewRatings | null;
  overallFeedback: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  template?: InterviewTemplate | null;
};

export type GoogleCalendarStatus = {
  configured: boolean;
  connected: boolean;
  email: string | null;
};

export type CreateTemplatePayload = {
  title: string;
  domain: InterviewDomain;
  type: InterviewTemplateType;
  difficulty: InterviewDifficulty;
  role?: string;
  estimatedDuration?: number;
  visibility?: "public" | "private";
  tags?: string[];
  questions: Array<{
    question: string;
    type?: string;
    followUps?: string[];
    expectedTopics?: string[];
    notes?: string;
  }>;
};

export type UpdateTemplatePayload = Partial<CreateTemplatePayload>;


export type ExchangeType = "role_experience" | "interview_experience";
export type TrustTier = "unverified" | "consistent" | "trusted" | "high_trust";
export type ExchangeReputation = "neutral" | "valuable" | "highly_valuable";
export type SensitiveShareResult = { shared: boolean; waiting: boolean; message: string };

export type ChatMessageMetadata = Record<string, unknown> & {
  kind?: string;
  dateKey?: string;
  question?: string;
  status?: "done" | "not_done" | "pending";
  clientMessageId?: string;
  sourceCheckinId?: string;
  responderId?: string;
  recipientId?: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    anonUsername: string | null;
    role: string | null;
    experience: string | null;
  } | null;
  type: ChatMessageType;
  content: string;
  metadata: ChatMessageMetadata;
  seenBy: string[];
  createdAt: string;
  updatedAt: string;
};

export type ChatConversation = {
  id: string;
  participants: Array<{
    id: string;
    anonUsername: string | null;
    role: string | null;
    experience: string | null;
  } | null>;
  partner: {
    id: string;
    anonUsername: string | null;
    role: string | null;
    experience: string | null;
  } | null;
  lastMessage: ChatMessage | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessagePage = {
  messages: ChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNextPage: boolean;
  };
};

export type ConversationsResponse = {
  message: string;
  data: {
    conversations: ChatConversation[];
  };
};

export type MessagesResponse = {
  message: string;
  data: ChatMessagePage;
};

export type CreateConversationResponse = {
  message: string;
  data: {
    conversation: ChatConversation;
  };
};

export type SendMessagePayload = {
  conversationId: string;
  type?: ChatMessageType;
  content?: string;
  metadata?: ChatMessageMetadata;
};

export type SendMessageResponse = {
  message: string;
  data: {
    message: ChatMessage;
    conversation: ChatConversation;
    alert?: ChatMessage | null;
  };
};

export type CreateConversationPayload = {
  partnerId?: string | null;
};

export type ChatSocketPayload = {
  conversationId: string;
  partnerId?: string | null;
};

export type ChatPageState = {
  user: AuthUser | null;
  conversations: ChatConversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  status: "idle" | "loading" | "connected" | "disconnected";
  error: string | null;
};

export type ExchangeRecord = {
  id: string;
  participants: string[];
  exchangeType: string;
  status: "requested" | "active" | "completed" | "cancelled" | "reported";
  permissionLayer: "compatibility" | "professional" | "sensitive";
  unlockState: { professionalUnlocked: boolean; sensitiveUnlocked: boolean };
  relevance: { score: number; category: string };
  capability: { score: number; category: string; warnings: string[] };
  reciprocity: { score: number; category: string };
  contextualWarnings: string[];
  trustSnapshot: {
    initiatorTier: TrustTier;
    targetTier: TrustTier;
    initiatorReputation: ExchangeReputation;
    targetReputation: ExchangeReputation;
  };
  approvals: {
    professional: { self: boolean; partner: boolean };
    sensitive: { self: boolean; partner: boolean };
  };
  createdAt: string;
  updatedAt: string;
};

export type ExchangeEntry = {
  id: string;
  exchangeId: string;
  authorId: string;
  entryType: "role" | "interview" | "sensitive";
  visibilityLayer: "professional" | "sensitive";
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ExchangeProfile = {
  lastJobExperience: string | null;
  lastInterviewExperience: string | null;
  roleTransitionNotes: string | null;
  roleTemplate?: {
    roleTitle: string | null;
    industryCompanyType?: string | null;
    companyType?: string | null;
    experienceLevel?: string | null;
    mainResponsibilities?: string | null;
    typicalWorkflow?: string | null;
    toolsMethodsUsed?: string | null;
    skillsRequired?: string | null;
    mostImportantSkills?: string | null;
    whatMattersToSucceed?: string | null;
    whatHelpedMost?: string | null;
    biggestMistakesToAvoid?: string | null;
    difficultyEnteringRole?: string | null;
    adviceForSomeoneStartingToday?: string | null;
    companyContext?: string | null;
    responsibilities?: string[];
    workflow?: string | null;
    requiredSkills?: string[];
    preparationStrategy?: string | null;
  } | null;
  interviewTemplate?: {
    roleInterviewedFor?: string | null;
    industryCompanyType?: string | null;
    companyType?: string | null;
    experienceLevelTargeted?: string | null;
    experienceLevel?: string | null;
    interviewDateOptional?: string | null;
    numberOfRounds?: string | null;
    roundTypes?: string | null;
    overallDifficulty?: string | null;
    totalProcessDuration?: string | null;
    mainTopicsEvaluated?: string | null;
    notableQuestionsOrTasks?: string | null;
    ifRejectedLikelyReasonOptional?: string | null;
    whatYouWouldDoDifferently?: string | null;
    finalAdviceForOthers?: string | null;
    roleTitle?: string | null;
    companyContext?: string | null;
    rounds?: string | null;
    questionsTopics?: string[];
    difficulty?: string | null;
    outcome?: string | null;
    preparationAdvice?: string | null;
    rejectionReasons?: string | null;
    whatHelpedMost?: string | null;
  } | null;
  verificationStatus: "not_submitted" | "pending" | "verified" | "unverified";
  verificationSource: "community_consistency" | "reputation_system";
  submittedAt: string | null;
  reviewedAt: string | null;
};

export type SensitiveTemplate = {
  hrContact: string | null;
  recruiterDetails: string | null;
  referralPathway: string | null;
  internalProcessNotes: string | null;
  additionalNotes: string | null;
};

// ── Phase 3: Live Interview Meeting Scheduling ─────────────────────────────────

export type MeetingProvider = "jitsi" | "google_meet";

export type MeetingStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "scheduled"
  | "completed"
  | "cancelled"
  | "expired";

export type InterviewMeetingSession = {
  id: string;
  conversationId: string;
  interviewSessionId: string | null;
  organizerId: string;
  participantId: string;
  provider: MeetingProvider;
  meetingLink: string | null;
  scheduledAt: string;
  duration: number;
  status: MeetingStatus;
  notes: string | null;
  scheduleRequestMessageId: string | null;
  meetingCardMessageId: string | null;
  createdAt: string;
};

export type ScheduleMeetingPayload = {
  conversationId: string;
  interviewSessionId?: string | null;
  provider: MeetingProvider;
  meetingLink?: string | null;
  scheduledAt: string;
  duration: number;
  notes?: string | null;
};


