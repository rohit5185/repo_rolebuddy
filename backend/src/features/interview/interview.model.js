import mongoose from "mongoose";

// ── InterviewTemplate ─────────────────────────────────────────────────────────

const interviewQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["open", "technical", "behavioral", "situational"],
      default: "open",
      trim: true
    },
    followUps: {
      type: [String],
      default: []
    },
    expectedTopics: {
      type: [String],
      default: []
    },
    notes: {
      type: String,
      trim: true,
      default: null
    }
  },
  { _id: false }
);

const interviewTemplateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    domain: {
      type: String,
      enum: ["tech", "non-tech", "any"],
      required: true,
      trim: true
    },
    role: {
      type: String,
      trim: true,
      default: null
    },
    type: {
      type: String,
      enum: ["technical", "hr", "behavioral", "mixed", "resume_round"],
      required: true,
      trim: true
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
      trim: true
    },
    estimatedDuration: {
      type: Number,
      default: 30
    },
    questions: {
      type: [interviewQuestionSchema],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // ── Phase 2 fields ──
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    isSystemTemplate: {
      type: Boolean,
      default: false
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
      trim: true
    },
    usageCount: {
      type: Number,
      default: 0
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

interviewTemplateSchema.index({ domain: 1, type: 1, isActive: 1 });
interviewTemplateSchema.index({ role: 1, isActive: 1 });
interviewTemplateSchema.index({ createdBy: 1, isActive: 1, createdAt: -1 });
interviewTemplateSchema.index({ visibility: 1, isActive: 1, domain: 1, type: 1 });

// ── InterviewSession ──────────────────────────────────────────────────────────

const interviewRatingsSchema = new mongoose.Schema(
  {
    communication: { type: Number, min: 1, max: 5, default: null },
    technical: { type: Number, min: 1, max: 5, default: null },
    problemSolving: { type: Number, min: 1, max: 5, default: null },
    overall: { type: Number, min: 1, max: 5, default: null }
  },
  { _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewTemplate",
      required: true
    },
    mode: {
      type: String,
      enum: ["text_async", "live_online", "live_video"],
      default: "text_async",
      trim: true
    },
    scheduleStatus: {
      type: String,
      enum: ["proposed", "confirmed", "missed", "completed", "cancelled"],
      default: null,
      trim: true
    },
    proposedSlots: {
      type: [Date],
      default: []
    },
    confirmedSlot: {
      type: Date,
      default: null
    },
    timezoneHint: {
      type: String,
      trim: true,
      default: null
    },
    googleCalendar: {
      interviewer: {
        eventId: { type: String, trim: true, default: null },
        eventLink: { type: String, trim: true, default: null }
      },
      candidate: {
        eventId: { type: String, trim: true, default: null },
        eventLink: { type: String, trim: true, default: null }
      }
    },
    status: {
      type: String,
      enum: ["pending", "active", "paused", "completed", "cancelled"],
      default: "pending",
      trim: true
    },
    currentQuestionIndex: {
      type: Number,
      default: 0
    },
    totalQuestions: {
      type: Number,
      required: true
    },
    finalRatings: {
      type: interviewRatingsSchema,
      default: () => ({})
    },
    overallFeedback: {
      type: String,
      trim: true,
      default: null
    },
    startedAt: {
      type: Date,
      default: null
    },
    endedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

interviewSessionSchema.index({ conversationId: 1, status: 1 });
interviewSessionSchema.index({ interviewerId: 1, status: 1, createdAt: -1 });
interviewSessionSchema.index({ candidateId: 1, status: 1, createdAt: -1 });

export const InterviewTemplate = mongoose.model("InterviewTemplate", interviewTemplateSchema);
export const InterviewSession = mongoose.model("InterviewSession", interviewSessionSchema);

// ── InterviewMeetingSession ───────────────────────────────────────────────────
// Phase 3: Live interview scheduling coordination layer inside conversations.
// Each meeting is attached to an existing conversation (and optionally to an
// InterviewSession). The meeting lifecycle is managed independently via its own
// status cycle: pending → accepted/declined/scheduled/completed/cancelled/expired.

const interviewMeetingSessionSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },
    // Optional reference to an existing async InterviewSession (null = standalone meeting)
    interviewSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewSession",
      default: null
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    // Provider abstraction — add new values without schema changes
    provider: {
      type: String,
      enum: ["jitsi", "google_meet"],
      required: true,
      trim: true
    },
    // Populated after the meeting is accepted (generated by provider logic)
    meetingLink: {
      type: String,
      trim: true,
      default: null
    },
    scheduledAt: {
      type: Date,
      required: true
    },
    // Duration in minutes
    duration: {
      type: Number,
      required: true,
      default: 30
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "scheduled", "completed", "cancelled", "expired"],
      default: "pending",
      trim: true
    },
    notes: {
      type: String,
      trim: true,
      default: null
    },
    // Tracks the message documents created for this meeting inside the conversation timeline
    scheduleRequestMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null
    },
    meetingCardMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

interviewMeetingSessionSchema.index({ conversationId: 1, status: 1 });
interviewMeetingSessionSchema.index({ organizerId: 1, createdAt: -1 });
interviewMeetingSessionSchema.index({ participantId: 1, createdAt: -1 });
interviewMeetingSessionSchema.index({ scheduledAt: 1, status: 1 });

export const InterviewMeetingSession = mongoose.model("InterviewMeetingSession", interviewMeetingSessionSchema);
