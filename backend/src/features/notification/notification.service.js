import webpush from "web-push";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { Notification, PushSubscription } from "./notification.model.js";

// ── VAPID setup ────────────────────────────────────────────────────────────────
if (env.vapidPublicKey && env.vapidPrivateKey) {
  webpush.setVapidDetails(
    env.vapidEmail,
    env.vapidPublicKey,
    env.vapidPrivateKey
  );
}

// ── Push subscription management ──────────────────────────────────────────────

export async function savePushSubscription(userId, subscription) {
  const { endpoint, keys } = subscription;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error("Invalid push subscription payload");
  }

  await PushSubscription.findOneAndUpdate(
    { userId, endpoint },
    { userId, endpoint, keys },
    { upsert: true, new: true }
  );

  return { saved: true };
}

export async function removePushSubscription(userId, endpoint) {
  await PushSubscription.deleteOne({ userId, endpoint });
  return { removed: true };
}

export async function removeAllPushSubscriptions(userId) {
  await PushSubscription.deleteMany({ userId });
}

// ── Core notification creator ──────────────────────────────────────────────────

export async function createNotification(userId, { type, title, body, icon, url, data } = {}) {
  const notification = await Notification.create({
    userId,
    type,
    title,
    body,
    icon: icon ?? "/icons/icon-192.png",
    url: url ?? "/",
    data: data ?? null,
    isRead: false
  });
  return notification;
}

// ── Send a push notification to a single user ──────────────────────────────────

export async function sendPushNotification(userId, { type, title, body, icon, url, data } = {}) {
  // 1. Store in DB first
  let notification = null;
  try {
    notification = await createNotification(userId, { type, title, body, icon, url, data });
  } catch (dbError) {
    // Log and continue — push still fires even if DB store failed
    logger.error({ err: dbError }, "Notification DB store failed");
  }

  // 2. Fetch subscriptions
  const subscriptions = await PushSubscription.find({ userId }).lean();
  if (subscriptions.length === 0) return { sent: 0, stored: Boolean(notification) };

  const payload = JSON.stringify({
    title,
    body,
    icon: icon ?? "/icons/icon-192.png",
    url: url ?? "/",
    notificationId: notification ? String(notification._id) : null,
    type,
    data: data ?? null
  });

  // 3. Send to all subscriptions (fire-and-forget, cleanup stale endpoints)
  let sent = 0;
  const staleEndpoints = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload,
          { TTL: 86400 } // 24h TTL
        );
        sent += 1;
      } catch (pushError) {
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          // Subscription expired — mark for cleanup
          staleEndpoints.push(sub.endpoint);
        }
        // else: transient error, skip
      }
    })
  );

  // Cleanup expired subscriptions
  if (staleEndpoints.length > 0) {
    await PushSubscription.deleteMany({ userId, endpoint: { $in: staleEndpoints } }).catch(() => {});
  }

  return { sent, stored: Boolean(notification) };
}

// ── Send to multiple users ─────────────────────────────────────────────────────

export async function sendPushToMany(userIds, payload) {
  if (!userIds || userIds.length === 0) return;
  await Promise.allSettled(userIds.map((uid) => sendPushNotification(uid, payload)));
}

// ── Notification inbox ─────────────────────────────────────────────────────────

export async function getNotificationInbox(userId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ userId }),
    Notification.countDocuments({ userId, isRead: false })
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page,
    limit
  };
}

export async function markNotificationRead(userId, notificationId) {
  const result = await Notification.updateOne(
    { _id: notificationId, userId },
    { $set: { isRead: true } }
  );
  return { updated: result.modifiedCount > 0 };
}

export async function markAllNotificationsRead(userId) {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true } }
  );
  return { updated: result.modifiedCount };
}

export async function getUnreadCount(userId) {
  const count = await Notification.countDocuments({ userId, isRead: false });
  return { count };
}

// ── Convenience senders for each notification type ────────────────────────────

export function notifyMatchFound(userId, partnerRole) {
  return sendPushNotification(userId, {
    type: "match_found",
    title: "🎉 You've been matched!",
    body: `You've been paired with a ${partnerRole ?? "partner"} for accountability. Start the chat!`,
    icon: "/icons/icon-192.png",
    url: "/chat",
    data: { partnerRole }
  }).catch(() => {});
}

export function notifyConnectionRequestReceived(userId, fromDisplayName) {
  return sendPushNotification(userId, {
    type: "connection_request_received",
    title: "👋 New connection request",
    body: `${fromDisplayName ?? "Someone"} wants to connect with you on RoleBuddy.`,
    icon: "/icons/icon-192.png",
    url: "/discovery",
    data: {}
  }).catch(() => {});
}

export function notifyConnectionRequestAccepted(userId, accepterDisplayName) {
  return sendPushNotification(userId, {
    type: "connection_request_accepted",
    title: "✅ Connection accepted!",
    body: `${accepterDisplayName ?? "Your connection"} accepted your request. You can now chat!`,
    icon: "/icons/icon-192.png",
    url: "/chat",
    data: {}
  }).catch(() => {});
}

export function notifyNewMessage(userId, senderDisplayName, preview) {
  return sendPushNotification(userId, {
    type: "new_message",
    title: `💬 Message from ${senderDisplayName ?? "your partner"}`,
    body: preview ? preview.slice(0, 80) : "You have a new message.",
    icon: "/icons/icon-192.png",
    url: "/chat",
    data: {}
  }).catch(() => {});
}

export function notifyPartnerCompletedGoal(userId, partnerDisplayName) {
  return sendPushNotification(userId, {
    type: "partner_completed_goal",
    title: "🔥 Partner checked in!",
    body: `${partnerDisplayName ?? "Your partner"} just completed their daily goal. Your turn!`,
    icon: "/icons/icon-192.png",
    url: "/dashboard",
    data: {}
  }).catch(() => {});
}

export function notifyPartnerMissedGoal(userId, partnerDisplayName) {
  return sendPushNotification(userId, {
    type: "partner_missed_goal",
    title: "⚠️ Partner missed their goal",
    body: `${partnerDisplayName ?? "Your partner"} missed today's goal. Send some encouragement!`,
    icon: "/icons/icon-192.png",
    url: "/chat",
    data: {}
  }).catch(() => {});
}

export function notifyStreakMilestone(userId, streakCount) {
  const milestoneMessages = {
    3: "3-day streak! You're building momentum.",
    7: "One full week! You're on fire 🔥",
    14: "Two weeks strong! Incredible consistency.",
    30: "30 DAYS! You're a RoleBuddy legend 🏆"
  };
  const body = milestoneMessages[streakCount] ?? `${streakCount} day streak! Keep it up!`;
  return sendPushNotification(userId, {
    type: "streak_milestone",
    title: `🎯 ${streakCount}-day streak!`,
    body,
    icon: "/icons/icon-192.png",
    url: "/dashboard",
    data: { streakCount }
  }).catch(() => {});
}

export function notifyDailyCheckinReminder(userId) {
  return sendPushNotification(userId, {
    type: "daily_checkin_reminder",
    title: "⏰ Daily check-in reminder",
    body: "Don't forget to log your progress today. Your streak depends on it!",
    icon: "/icons/icon-192.png",
    url: "/chat",
    data: {}
  }).catch(() => {});
}

export function notifyInterviewRequestReceived(userId, interviewerName, templateTitle) {
  return sendPushNotification(userId, {
    type: "interview_request_received",
    title: "🧠 Interview request received",
    body: `${interviewerName ?? "Your partner"} wants to do a "${templateTitle ?? "mock interview"}" with you.`,
    icon: "/icons/icon-192.png",
    url: "/chat",
    data: {}
  }).catch(() => {});
}

export function notifyInterviewRequestAccepted(userId, candidateName) {
  return sendPushNotification(userId, {
    type: "interview_request_accepted",
    title: "✅ Interview accepted!",
    body: `${candidateName ?? "Your partner"} accepted your interview request. Head to chat to begin!`,
    icon: "/icons/icon-192.png",
    url: "/chat",
    data: {}
  }).catch(() => {});
}

export function notifyNewRoleUserJoined(userId, role) {
  return sendPushNotification(userId, {
    type: "new_role_user_joined",
    title: "👋 New peer in your role!",
    body: `Someone preparing for "${role ?? "your role"}" just joined RoleBuddy. Discover them!`,
    icon: "/icons/icon-192.png",
    url: "/discovery",
    data: { role }
  }).catch(() => {});
}

export function notifyWeeklySummary(userId, { streakCount, checkInsThisWeek, partnerDisplayName }) {
  return sendPushNotification(userId, {
    type: "weekly_summary",
    title: "📊 Your weekly RoleBuddy summary",
    body: `${checkInsThisWeek ?? 0}/7 check-ins this week. Streak: ${streakCount ?? 0} days${partnerDisplayName ? `. Partner: ${partnerDisplayName}` : ""}.`,
    icon: "/icons/icon-192.png",
    url: "/dashboard",
    data: { streakCount, checkInsThisWeek }
  }).catch(() => {});
}
