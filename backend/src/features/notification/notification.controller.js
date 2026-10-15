import { asyncHandler } from "../../utils/asyncHandler.js";
import { env } from "../../config/env.js";
import {
  savePushSubscription,
  removePushSubscription,
  getNotificationInbox,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount
} from "./notification.service.js";

// GET /api/notifications/vapid-public-key
export const getVapidPublicKey = asyncHandler(async (_req, res) => {
  res.json({
    message: "VAPID public key",
    data: { publicKey: env.vapidPublicKey }
  });
});

// POST /api/notifications/subscribe
export const subscribe = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { endpoint, keys } = req.body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ message: "Invalid subscription payload.", data: null });
  }

  const result = await savePushSubscription(userId, { endpoint, keys });
  res.status(201).json({ message: "Push subscription saved.", data: result });
});

// DELETE /api/notifications/unsubscribe
export const unsubscribe = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ message: "Endpoint is required.", data: null });
  }

  const result = await removePushSubscription(userId, endpoint);
  res.json({ message: "Push subscription removed.", data: result });
});

// GET /api/notifications
export const getInbox = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? "20", 10)));

  const result = await getNotificationInbox(userId, { page, limit });
  res.json({ message: "Notifications fetched.", data: result });
});

// PATCH /api/notifications/:id/read
export const markRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const result = await markNotificationRead(userId, id);
  res.json({ message: "Notification marked as read.", data: result });
});

// PATCH /api/notifications/mark-all-read
export const markAllRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const result = await markAllNotificationsRead(userId);
  res.json({ message: "All notifications marked as read.", data: result });
});

// GET /api/notifications/unread-count
export const fetchUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const result = await getUnreadCount(userId);
  res.json({ message: "Unread count fetched.", data: result });
});
