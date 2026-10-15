"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellRing, Check, CheckCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getUnreadCount,
  getNotificationInbox,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeToNotifications,
  type NotificationRecord
} from "@/features/notifications/notifications.api";

type PanelState = "closed" | "open";

const TYPE_ICON: Record<string, string> = {
  match_found: "🎉",
  daily_checkin_reminder: "⏰",
  new_role_user_joined: "👋",
  connection_request_received: "🤝",
  connection_request_accepted: "✅",
  new_message: "💬",
  partner_completed_goal: "🔥",
  partner_missed_goal: "⚠️",
  streak_milestone: "🎯",
  weekly_summary: "📊",
  interview_request_received: "🧠",
  interview_request_accepted: "✅",
  exchange_request_received: "🔁",
  exchange_request_accepted: "✅",
  meeting_scheduled: "📅",
  meeting_accepted: "✅"
};

function timeAgo(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationBell({ className = "" }: { className?: string }) {
  const [panel, setPanel] = useState<PanelState>("closed");
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Poll unread count every 30s
  const refreshUnread = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnread(count);
    } catch {
      // Ignore — user might not be logged in
    }
  }, []);

  useEffect(() => {
    void refreshUnread();
    const interval = setInterval(refreshUnread, 30_000);
    return () => clearInterval(interval);
  }, [refreshUnread]);

  // Subscribe to push notifications on mount if already permitted,
  // AND whenever the permission state changes to "granted" (e.g. from the
  // post-login prompt triggered in AuthForm).
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    // Subscribe immediately if already granted
    if (Notification.permission === "granted") {
      subscribeToNotifications().catch(() => {});
    }

    // Watch for future permission changes (Permissions API)
    if ("permissions" in navigator) {
      let permStatus: PermissionStatus | null = null;
      navigator.permissions.query({ name: "notifications" as PermissionName }).then((status) => {
        permStatus = status;
        status.onchange = () => {
          if (status.state === "granted") {
            subscribeToNotifications().catch(() => {});
          }
        };
      }).catch(() => {});
      return () => {
        if (permStatus) permStatus.onchange = null;
      };
    }
  }, []);

  async function openPanel() {
    setPanel("open");
    setLoading(true);
    try {
      const data = await getNotificationInbox(1, 20);
      setItems(data.notifications);
      setUnread(data.unreadCount);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id: string) {
    await markNotificationRead(id).catch(() => {});
    setItems((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnread((c) => Math.max(0, c - 1));
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead().catch(() => {});
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }

  async function handleSubscribe() {
    try {
      await subscribeToNotifications();
      // Refresh after subscription
      await refreshUnread();
    } catch {
      //
    }
  }

  // Close panel when clicking outside
  useEffect(() => {
    if (panel !== "open") return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanel("closed");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [panel]);

  const BellIcon = unread > 0 ? BellRing : Bell;

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      {/* Bell button */}
      <button
        id="notification-bell-btn"
        type="button"
        onClick={() => (panel === "open" ? setPanel("closed") : void openPanel())}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-rb-surface border border-rb-border text-rb-muted hover:bg-rb-primary-light hover:text-rb-primary transition-all"
      >
        <BellIcon className={`h-4 w-4 ${unread > 0 ? "animate-[ring_1s_ease-in-out]" : ""}`} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rb-primary text-[9px] font-black text-white leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {panel === "open" && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            id="notification-panel"
            className="absolute right-0 top-11 z-50 w-[320px] sm:w-[360px] overflow-hidden rounded-2xl border border-rb-border bg-white shadow-[0_12px_40px_rgba(59,42,225,0.15)]"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-rb-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-rb-primary" />
                <p className="text-sm font-black text-rb-text">Notifications</p>
                {unread > 0 && (
                  <span className="rounded-full bg-rb-primary px-1.5 py-0.5 text-[9px] font-black text-white">
                    {unread} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleMarkAllRead()}
                    title="Mark all as read"
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-rb-primary hover:bg-rb-primary-light transition"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    All read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPanel("closed")}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-rb-muted hover:bg-rb-surface transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Push permissions prompt */}
            {typeof window !== "undefined" && "Notification" in window && Notification.permission === "default" && (
              <div className="border-b border-rb-border bg-rb-primary-light px-4 py-2.5">
                <p className="text-xs text-rb-text">
                  Enable push notifications to get alerts even when the app is closed.
                </p>
                <button
                  type="button"
                  onClick={() => void handleSubscribe()}
                  className="mt-1.5 rounded-lg bg-rb-primary px-3 py-1.5 text-[10px] font-black text-white hover:bg-rb-primary/90 transition"
                >
                  Enable push notifications
                </button>
              </div>
            )}

            {/* Notification list */}
            <div className="max-h-[360px] overflow-y-auto rb-scroll-area">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-rb-primary border-t-transparent" />
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-2">
                  <Bell className="h-8 w-8 text-rb-muted opacity-40" />
                  <p className="text-sm font-bold text-rb-text">No notifications yet</p>
                  <p className="text-xs text-rb-muted">
                    You&apos;ll get notified on matches, check-ins, and partner activity.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-rb-border/50">
                  {items.map((item) => (
                    <li
                      key={item._id}
                      className={`flex items-start gap-3 px-4 py-3 transition-colors ${item.isRead ? "" : "bg-rb-primary-light/50"}`}
                    >
                      {/* Type icon */}
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rb-surface text-base">
                        {TYPE_ICON[item.type] ?? "🔔"}
                      </span>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-rb-text leading-snug">{item.title}</p>
                        <p className="mt-0.5 text-[11px] text-rb-muted leading-relaxed">{item.body}</p>
                        <p className="mt-1 text-[10px] text-rb-muted/70">{timeAgo(item.createdAt)}</p>
                      </div>

                      {/* Mark read */}
                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={() => void handleMarkRead(item._id)}
                          title="Mark as read"
                          className="mt-1 shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-rb-primary hover:bg-rb-primary-light transition"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
