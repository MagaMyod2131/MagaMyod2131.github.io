// sw.js — Service Worker для Связь
var CACHE = 'svyaz-v1';
var FILES = ['/index.html', '/sw.js'];

// Установка — кэшируем файлы
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(FILES);
    })
  );
  self.skipWaiting();
});

// Активация — удаляем старый кэш
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// Перехват запросов — отдаём из кэша если есть
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request);
    })
  );
});

// Получение push-уведомления от сервера
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data.json(); } catch(ex) { data = { title: 'Связь', body: e.data ? e.data.text() : 'Новое сообщение' }; }
  var title = data.title || 'Связь';
  var options = {
    body: data.body || '',
    icon: data.icon || '/icon.png',
    badge: '/icon.png',
    tag: data.tag || 'msg',
    data: { url: data.url || '/', fromId: data.fromId || '' },
    vibrate: [200, 100, 200],
    requireInteraction: false
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Клик по уведомлению — открываем сайт
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf(url) >= 0) { return list[i].focus(); }
      }
      return clients.openWindow(url);
    })
  );
});

// Сообщения от страницы (показать локальное уведомление)
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SHOW_NOTIF') {
    var d = e.data;
    self.registration.showNotification(d.title || 'Связь', {
      body: d.body || '',
      icon: d.icon || '/icon.png',
      tag: d.tag || 'msg-' + Date.now(),
      data: { url: d.url || '/', fromId: d.fromId || '' },
      vibrate: [150, 50, 150],
      requireInteraction: false
    });
  }
});
