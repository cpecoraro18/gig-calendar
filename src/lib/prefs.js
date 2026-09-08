/**
 * localStorage that never throws. Private browsing and locked-down WebViews
 * both make the store unavailable, and a calendar that refuses to open because
 * it couldn't remember a colour preference would be a bad trade.
 */
export function readPref(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writePref(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* the choice just won't survive a reload */
  }
}

export function removePref(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* nothing to clean up */
  }
}

/** For values written by an older build, which stored plain strings. */
export function readRawPref(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
