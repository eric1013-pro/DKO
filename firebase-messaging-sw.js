/* DKO 푸시 알림 서비스 워커 — index.html과 같은 폴더에 두세요 */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDSKD8s5zrfSWsakM01pyRmuTRHa7vmZgA",
  authDomain: "overwatche3-6508d.firebaseapp.com",
  projectId: "overwatche3-6508d",
  storageBucket: "overwatche3-6508d.firebasestorage.app",
  messagingSenderId: "462686197585",
  appId: "1:462686197585:web:0a23aee3fa142f149ca570"
});

const messaging = firebase.messaging();

// 서버(Cloud Functions)가 보내는 data 메시지를 알림으로 띄워요
messaging.onBackgroundMessage((payload) => {
  const d = payload.data || {};
  return self.registration.showNotification(d.title || 'DKO', {
    body: d.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: { link: d.link || '{}' }
  });
});

// 알림을 누르면 앱을 열고 해당 화면으로 이동해요
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const raw = (event.notification.data && event.notification.data.link) || '{}';
  const link = typeof raw === 'string' ? raw : JSON.stringify(raw);
  event.waitUntil((async () => {
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of all) {
      if ('focus' in w) { await w.focus(); w.postMessage({ type: 'dko-open', link }); return; }
    }
    await clients.openWindow('./?open=' + encodeURIComponent(link));
  })());
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
