/// <reference lib="webworker" />

const _self = self as unknown as ServiceWorkerGlobalScope;

// ── Push event handler ────────────────────────────────────────────────────────
_self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: {
    title?: string;
    body?: string;
    icon?: string;
    url?: string;
    type?: string;
    data?: unknown;
  };

  try {
    payload = event.data.json() as typeof payload;
  } catch {
    payload = { title: "RoleBuddy", body: event.data.text() };
  }

  const title = payload.title ?? "RoleBuddy";
  const options: any = {
    body: payload.body ?? "You have a new notification.",
    icon: payload.icon ?? "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    data: { url: payload.url ?? "/" },
    tag: payload.type ?? "rolebuddy-notification",
    renotify: true
  };

  event.waitUntil(_self.registration.showNotification(title, options));
});

// ── Notification click ────────────────────────────────────────────────────────
_self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string })?.url ?? "/";

  event.waitUntil(
    _self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(_self.location.origin) && "focus" in client) {
          void client.navigate(url);
          return client.focus();
        }
      }
      if (_self.clients.openWindow) {
        return _self.clients.openWindow(url);
      }
    })
  );
});
