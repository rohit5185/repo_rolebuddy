import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        }
      ],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length === 2;
        },
        message: "A conversation must have exactly two participants."
      },
      required: true
    },
    participantsKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: [
        "text",
        "checkin",
        "system",
        "reminder",
        "alert",
        "interview_request",
        "interview_system",
        "interview_question",
        "interview_answer",
        "interview_feedback",
        // ── Phase 3: Live interview scheduling ──
        "interview_schedule_request",
        "interview_schedule_system",
        "interview_meeting_card"
      ],
      default: "text"
    },
    content: {
      type: String,
      trim: true,
      default: ""
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    seenBy: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
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

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, senderId: 1, createdAt: -1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
export const Message = mongoose.model("Message", messageSchema);