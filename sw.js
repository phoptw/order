// Big Order 管理系統:網頁推播的 service worker
// 只負責「收到推播 → 跳通知」和「點通知 → 打開寄信助手」;不做離線快取,網頁更新照常即時生效

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(self.registration.showNotification(data.title || 'Big Order 管理系統', {
    body: data.body || '',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    data: { url: data.url || 'ACReport.html#mail' },
    lang: 'zh-TW'
  }));
});

// 只開自己網站的頁面(推播內容是我們伺服器加密送來的,這裡再擋一次以防萬一)
function safeUrl(u) {
  try {
    const url = new URL(u, self.registration.scope);
    return url.origin === self.location.origin ? url.href : new URL('ACReport.html#mail', self.registration.scope).href;
  } catch (e) {
    return new URL('ACReport.html#mail', self.registration.scope).href;
  }
}

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const target = safeUrl(event.notification.data && event.notification.data.url);
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    // 已經開著系統的話,切過去並請它打開寄信助手(不另開一個、不重新載入)
    for (const c of list) {
      if (c.url.indexOf('ACReport.html') !== -1 && 'focus' in c) {
        c.postMessage({ type: 'openMail' });
        return c.focus().catch(function () { return null; });
      }
    }
    return self.clients.openWindow(target);
  }));
});
