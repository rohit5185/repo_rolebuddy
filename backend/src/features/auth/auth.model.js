import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: false,
      default: null,
      minlength: 8
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "otp"],
      default: "local",
      trim: true
    },
    otp: {
      code: { type: String, default: null },
      expiresAt: { type: Date, default: null },
      attempts: { type: Number, default: 0 }
    },
    role: {
      type: String,
      trim: true,
      default: null
    },
    experience: {
      type: String,
      trim: true,
      default: null
    },
    dailyGoal: {
      type: Number,
      default: null
    },
    availability: {
      type: String,
      trim: true,
      default: null
    },
    domain: {
      type: String,
      enum: ["tech", "non-tech"],
      default: null,
      required() {
        return Boolean(this.onboardingCompleted);
      }
    },
    domainArea: {
      type: String,
      trim: true,
      default: "Unassigned",
      required: true
    },
    primaryArea: {
      type: String,
      trim: true,
      default: null
    },
    area: {
      type: String,
      trim: true,
      default: null
    },
    specialization: {
      type: String,
      trim: true,
      default: null
    },
    skills: {
      type: [String],
      default: []
    },
    intent: {
      type: String,
      trim: true,
      default: null
    },
    goal: {
      type: String,
      trim: true,
      default: null
    },
    availabilityFrequency: {
      type: String,
      trim: true,
      default: null
    },
    availabilityTime: {
      type: String,
      enum: ["morning", "afternoon", "night"],
      default: null
    },
    preferences: {
      type: [String],
      default: []
    },
    lastActiveAt: {
      type: Date,
      default: null
    },
    activeMatchExpiresAt: {
      type: Date,
      default: null
    },
    lastMatchAt: {
      type: Date,
      default: null
    },
    lastCheckInDate: {
      type: Date,
      default: null
    },
    streakCount: {
      type: Number,
      default: 0
    },
    checkInHistory: {
      type: [
        {
          date: {
            type: Date,
            required: true
          },
          status: {
            type: String,
            enum: ["done", "not_done"],
            required: true
          }
        }
      ],
      default: []
    },
    status: {
      type: String,
      enum: ["waiting", "matched"],
      default: "waiting"
    },
    matchedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    displayName: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    anonUsername: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      default: null
    },
    connections: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        }
      }
    ],
    connectionRequests: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        to: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending"
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    pendingMatchRequests: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    trustTier: {
      type: String,
      enum: ["unverified", "consistent", "trusted", "high_trust"],
      default: "unverified",
      trim: true
    },
    exchangeReputation: {
      type: String,
      enum: ["neutral", "valuable", "highly_valuable"],
      default: "neutral",
      trim: true
    },
    successfulExchangeCount: {
      type: Number,
      default: 0
    },
    reportCount: {
      type: Number,
      default: 0
    },
    abuseIncidentCount: {
      type: Number,
      default: 0
    },
    exchangeStats: {
      requestsSent: { type: Number, default: 0 },
      requestsAccepted: { type: Number, default: 0 },
      entriesShared: { type: Number, default: 0 },
      sensitiveUnlockApproved: { type: Number, default: 0 },
      completedExchanges: { type: Number, default: 0 },
      reportedByPeers: { type: Number, default: 0 }
    },
    capabilitySignals: {
      activityConsistencyScore: { type: Number, default: 0 },
      reciprocityScore: { type: Number, default: 0 },
      relevanceScore: { type: Number, default: 0 },
      capabilityScore: { type: Number, default: 0 },
      lastEvaluatedAt: { type: Date, default: null }
    },
    exchangeProfile: {
      lastJobExperience: {
        type: String,
        trim: true,
        default: null
      },
      lastInterviewExperience: {
        type: String,
        trim: true,
        default: null
      },
      roleTransitionNotes: {
        type: String,
        trim: true,
        default: null
      },
      roleTemplate: {
        roleTitle: { type: String, trim: true, default: null },
        industryCompanyType: { type: String, trim: true, default: null },
        companyType: { type: String, trim: true, default: null },
        experienceLevel: { type: String, trim: true, default: null },
        mainResponsibilities: { type: String, trim: true, default: null },
        typicalWorkflow: { type: String, trim: true, default: null },
        toolsMethodsUsed: { type: String, trim: true, default: null },
        skillsRequired: { type: String, trim: true, default: null },
        mostImportantSkills: { type: String, trim: true, default: null },
        whatMattersToSucceed: { type: String, trim: true, default: null },
        whatHelpedMost: { type: String, trim: true, default: null },
        biggestMistakesToAvoid: { type: String, trim: true, default: null },
        difficultyEnteringRole: { type: String, trim: true, default: null },
        adviceForSomeoneStartingToday: { type: String, trim: true, default: null },
        companyContext: { type: String, trim: true, default: null },
        responsibilities: { type: [String], default: [] },
        workflow: { type: String, trim: true, default: null },
        requiredSkills: { type: [String], default: [] },
        preparationStrategy: { type: String, trim: true, default: null }
      },
      interviewTemplate: {
        roleInterviewedFor: { type: String, trim: true, default: null },
        industryCompanyType: { type: String, trim: true, default: null },
        companyType: { type: String, trim: true, default: null },
        experienceLevelTargeted: { type: String, trim: true, default: null },
        experienceLevel: { type: String, trim: true, default: null },
        interviewDateOptional: { type: String, trim: true, default: null },
        numberOfRounds: { type: String, trim: true, default: null },
        roundTypes: { type: String, trim: true, default: null },
        overallDifficulty: { type: String, trim: true, default: null },
        totalProcessDuration: { type: String, trim: true, default: null },
        mainTopicsEvaluated: { type: String, trim: true, default: null },
        notableQuestionsOrTasks: { type: String, trim: true, default: null },
        ifRejectedLikelyReasonOptional: { type: String, trim: true, default: null },
        whatYouWouldDoDifferently: { type: String, trim: true, default: null },
        finalAdviceForOthers: { type: String, trim: true, default: null },
        roleTitle: { type: String, trim: true, default: null },
        companyContext: { type: String, trim: true, default: null },
        rounds: { type: String, trim: true, default: null },
        questionsTopics: { type: [String], default: [] },
        difficulty: { type: String, trim: true, default: null },
        outcome: { type: String, trim: true, default: null },
        preparationAdvice: { type: String, trim: true, default: null },
        rejectionReasons: { type: String, trim: true, default: null },
        whatHelpedMost: { type: String, trim: true, default: null }
      },
      verificationStatus: {
        type: String,
        enum: ["not_submitted", "pending", "verified", "unverified"],
        default: "not_submitted",
        trim: true
      },
      verificationSource: {
        type: String,
        enum: ["community_consistency", "reputation_system"],
        default: "community_consistency",
        trim: true
      },
      submittedAt: {
        type: Date,
        default: null
      },
      reviewedAt: {
        type: Date,
        default: null
      }
    },

    // ── Professional Progress Foundation ─────────────────────────────────
    consistencyStreak: {
      type: Number,
      default: 0
    },
    lastActiveDay: {
      type: String,
      trim: true,
      default: null
    },
    contributionCount: {
      type: Number,
      default: 0
    },
    completedMockInterviews: {
      type: Number,
      default: 0
    },
    completedExchanges: {
      type: Number,
      default: 0
    },
    completedSensitiveExchanges: {
      type: Number,
      default: 0
    },
    totalAcceptedCommitments: {
      type: Number,
      default: 0
    },
    completedCommitments: {
      type: Number,
      default: 0
    },
    reliabilityScore: {
      type: Number,
      default: null
    },
    reliabilityLabel: {
      type: String,
      trim: true,
      default: null
    },
    preparationStatus: {
      type: String,
      enum: ["Starting Preparation", "Preparing Actively", "Interview Ready"],
      default: "Starting Preparation"
    },
    googleCalendar: {
      connected: {
        type: Boolean,
        default: false
      },
      accessToken: {
        type: String,
        trim: true,
        default: null
      },
      refreshToken: {
        type: String,
        trim: true,
        default: null
      },
      expiryDate: {
        type: Date,
        default: null
      },
      scope: {
        type: String,
        trim: true,
        default: null
      },
      email: {
        type: String,
        trim: true,
        default: null
      }
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

userSchema.index({ role: 1 });
userSchema.index({ domainArea: 1 });
userSchema.index({ status: 1 });
userSchema.index({ lastActiveAt: -1 });
userSchema.index({ activeMatchExpiresAt: 1 });
userSchema.index({ role: 1, status: 1, lastActiveAt: -1 });
userSchema.index({ "connectionRequests.from": 1, "connectionRequests.to": 1 });
userSchema.index({
  "connectionRequests.from": 1,
  "connectionRequests.to": 1,
  "connectionRequests.status": 1
});
userSchema.index({ "pendingMatchRequests.from": 1 });
userSchema.index({ trustTier: 1, exchangeReputation: 1 });
userSchema.index({ successfulExchangeCount: -1, reportCount: 1 });
userSchema.index({ "exchangeStats.completedExchanges": -1 });
userSchema.index({ "otp.expiresAt": 1 }, { sparse: true });
userSchema.index({ anonUsername: 1 }, { sparse: true });

export const User = mongoose.model("User", userSchema);
