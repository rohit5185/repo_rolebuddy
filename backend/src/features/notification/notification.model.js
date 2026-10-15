import mongoose from "mongoose";

// ── PushSubscription schema ────────────────────────────────────────────────────
const PushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    endpoint: {
      type: String,
      required: true,
      trim: true
    },
    keys: {
      p256dh: { type: String, required: true, trim: true },
      auth: { type: String, required: true, trim: true }
    }
  },
  { timestamps: true }
);

PushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

// ── Notification schema ────────────────────────────────────────────────────────
const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: [
        "match_found",
        "daily_checkin_reminder",
        "new_role_user_joined",
        "connection_request_received",
        "connection_request_accepted",
        "new_message",
        "partner_completed_goal",
        "partner_missed_goal",
        "streak_milestone",
        "weekly_summary",
        "interview_request_received",
        "interview_request_accepted",
        "exchange_request_received",
        "exchange_request_accepted",
        "meeting_scheduled",
        "meeting_accepted"
      ],
      required: true,
      trim: true
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    icon: { type: String, trim: true, default: "/icons/icon-192.png" },
    url: { type: String, trim: true, default: "/" },
    isRead: { type: Boolean, default: false },
    data: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export const PushSubscription = mongoose.model("PushSubscription", PushSubscriptionSchema);
export const Notification = mongoose.model("Notification", NotificationSchema);
