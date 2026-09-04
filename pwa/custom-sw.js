// Custom service worker source for the whole commission.ng site. next-pwa
// (InjectManifest mode, see next.config.mjs) injects the Workbox precache
// manifest at the placeholder below and produces public/sw.js from this
// file. Deliberately minimal: this is here for PWA installability and
// Inbox push notifications, not for aggressive offline caching of the
// marketing site - that's a separate decision with its own tradeoffs
// (stale content risk on SEO-driven pages) that wasn't part of this ask.

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Commission", body: event.data.text() };
  }

  const { title, body, url, icon } = payload;

  event.waitUntil(
    self.registration.showNotification(title || "New message", {
      body: body || "",
      icon: icon || "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: url || "/dashboard/inbox" },
      tag: payload.tag,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard/inbox";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(new URL(targetUrl, self.location.origin).pathname));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});

// Workbox precache injection point - leave this exactly as-is.
self.__WB_MANIFEST;
