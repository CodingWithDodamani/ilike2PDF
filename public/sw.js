// Self-destroying service worker.
// A previous build shipped a PWA/Workbox service worker that cached the app
// shell. This replacement unregisters itself and clears all caches so that
// returning visitors immediately receive the latest version of the site
// (fixes stale UI such as a missing footer button).
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      } catch (e) {
        // ignore
      }
      await self.registration.unregister()
      const clients = await self.clients.matchAll({ type: 'window' })
      clients.forEach((client) => client.navigate(client.url))
    })()
  )
})
