// Orderi PWA & Background Notification Service Worker Helper
// Handles notification click and dismiss events when app is backgrounded or minimized

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const orderId = event.notification.data?.orderId;
  const order = event.notification.data?.order;
  const targetUrl = orderId ? `/?orderId=${encodeURIComponent(orderId)}` : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. If an existing Orderi window/tab is open, focus it and tell it to open the order
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ 
            type: 'ORDERI_OPEN_ORDER', 
            orderId, 
            order 
          });
          return;
        }
      }
      // 2. If no window is open, launch a new window with the order query parameter
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  const orderId = event.notification.data?.orderId;
  if (orderId) {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        client.postMessage({ 
          type: 'ORDERI_NOTIFICATION_DISMISSED', 
          orderId 
        });
      }
    });
  }
});
