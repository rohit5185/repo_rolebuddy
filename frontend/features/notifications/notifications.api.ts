import { apiRequest } from "@/services/api";

// ── VAPID ─────────────────────────────────────────────────────────────────────

export async function getVapidPublicKey(): Promise<string> {
  const res = await apiRequest<{ message: string; data: { publicKey: string } }>(
    "/notifications/vapid-public-key"
  );
  return res.data.publicKey;
}

// ── Subscription ──────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToNotifications(): Promise<PushSubscription | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const vapidKey = await getVapidPublicKey();
  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource
  });

  // Save subscription to backend
  const subJson = subscription.toJSON();
  await apiRequest<{ message: string; data: null }>("/notifications/subscribe", {
    method: "POST",
    body: JSON.stringify({
      endpoint: subJson.endpoint,
      keys: subJson.keys
    })
  });

  return subscription;
}

export async function unsubscribeFromNotifications(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();

  await apiRequest<{ message: string; data: null }>("/notifications/unsubscribe", {
    method: "DELETE",
    body: JSON.stringify({ endpoint })
  }).catch(() => {});
}

// ── Inbox ─────────────────────────────────────────────────────────────────────

export type NotificationRecord = {
  _id: string;
  type: string;
  title: string;
  body: string;
  icon: string;
  url: string;
  isRead: boolean;
  createdAt: string;
};

export type InboxResponse = {
  notifications: NotificationRecord[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
};

export async function getNotificationInbox(page = 1, limit = 20): Promise<InboxResponse> {
  const res = await apiRequest<{ message: string; data: InboxResponse }>(
    `/notifications?page=${page}&limit=${limit}`
  );
  return res.data;
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiRequest<{ message: string; data: { count: number } }>(
    "/notifications/unread-count"
  );
  return res.data.count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiRequest<{ message: string; data: null }>(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest<{ message: string; data: null }>("/notifications/mark-all-read", { method: "PATCH" });
}
