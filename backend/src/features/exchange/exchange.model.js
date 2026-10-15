import mongoose from "mongoose";

const exchangeParticipantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    approvedProfessionalUnlock: {
      type: Boolean,
      default: false
    },
    approvedSensitiveUnlock: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const exchangeSchema = new mongoose.Schema(
  {
    participants: {
      type: [exchangeParticipantSchema],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length === 2;
        },
        message: "Exchange requires exactly two participants."
      }
    },
    exchangeType: {
      type: String,
      enum: ["role_experience", "interview_experience", "sensitive_exchange"],
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["requested", "active", "completed", "cancelled", "reported"],
      default: "requested",
      trim: true
    },
    permissionLayer: {
      type: String,
      enum: ["compatibility", "professional", "sensitive"],
      default: "compatibility",
      trim: true
    },
    unlockState: {
      professionalUnlocked: { type: Boolean, default: false },
      sensitiveUnlocked: { type: Boolean, default: false }
    },
    relevance: {
      score: { type: Number, required: true },
      category: { type: String, required: true, trim: true }
    },
    capability: {
      score: { type: Number, required: true },
      category: { type: String, required: true, trim: true },
      warnings: { type: [String], default: [] }
    },
    reciprocity: {
      score: { type: Number, required: true },
      category: { type: String, required: true, trim: true }
    },
    trustSnapshot: {
      initiatorTier: { type: String, required: true, trim: true },
      targetTier: { type: String, required: true, trim: true },
      initiatorReputation: { type: String, required: true, trim: true },
      targetReputation: { type: String, required: true, trim: true }
    },
    contextualWarnings: {
      type: [String],
      default: []
    },
    pendingSensitiveTemplates: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    lastSensitiveSharedAt: {
      type: Date,
      default: null
    },
    lifecycleLog: {
      type: [
        {
          action: { type: String, required: true, trim: true },
          actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
          createdAt: { type: Date, default: Date.now }
        }
      ],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const exchangeEntrySchema = new mongoose.Schema(
  {
    exchangeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exchange",
      required: true,
      index: true
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    entryType: {
      type: String,
      enum: ["role", "interview", "sensitive"],
      required: true,
      trim: true
    },
    visibilityLayer: {
      type: String,
      enum: ["professional", "sensitive"],
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    isReported: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

exchangeSchema.index({ "participants.userId": 1, status: 1, createdAt: -1 });
exchangeSchema.index({ permissionLayer: 1, status: 1, createdAt: -1 });
exchangeSchema.index({ exchangeType: 1, status: 1, createdAt: -1 });
exchangeSchema.index({ "unlockState.sensitiveUnlocked": 1, status: 1 });

exchangeEntrySchema.index({ exchangeId: 1, createdAt: -1 });
exchangeEntrySchema.index({ exchangeId: 1, visibilityLayer: 1, createdAt: -1 });
exchangeEntrySchema.index({ authorId: 1, createdAt: -1 });

export const Exchange = mongoose.model("Exchange", exchangeSchema);
export const ExchangeEntry = mongoose.model("ExchangeEntry", exchangeEntrySchema);
