import express from "express";
import { verifyJwt } from "../../middlewares/auth.middleware.js";
import {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  getInbox,
  markRead,
  markAllRead,
  fetchUnreadCount
} from "./notification.controller.js";

const router = express.Router();

// Public: VAPID public key (needed before auth to subscribe)
router.get("/vapid-public-key", getVapidPublicKey);

// Protected routes
router.use(verifyJwt);
router.post("/subscribe", subscribe);
router.delete("/unsubscribe", unsubscribe);
router.get("/", getInbox);
router.get("/unread-count", fetchUnreadCount);
router.patch("/mark-all-read", markAllRead);
router.patch("/:id/read", markRead);

export default router;
