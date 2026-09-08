/**
 * Installing the app is the point of the manifest; this is the other half —
 * the worker that makes a cold launch instant. Kept out of main.js so the
 * entry file stays a statement of what the app is, not how it caches.
 */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  if (!import.meta.env.PROD) {
    // `npm run preview` and `npm run dev` are both localhost, and a worker
    // registered by one is still in charge when you open the other. Clearing it
    // here is the difference between an edit not showing up and an edit not
    // showing up for a reason nobody can find.
    navigator.serviceWorker.getRegistrations().then((all) => {
      all.forEach((registration) => registration.unregister())
    })
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // An installed app is almost never closed — it sits in the background
        // for weeks — so "next launch" may not come for a long time. Coming
        // back to it is the moment to check for a new build. The update is
        // applied on the next load, never by reloading the page out from under
        // a half-finished event.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') registration.update()
        })
      })
      // Caching is an optimisation. A browser that refuses to register one
      // (private mode, an unusual setting) should still get a working app.
      .catch(() => {})
  })
}
