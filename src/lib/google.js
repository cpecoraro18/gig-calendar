/**
 * Google sign-in, browser-side.
 *
 * There is no server in this app, so nothing here is a credential store: the
 * page asks Google for an access token at the moment you tap sign in, and
 * Google only ever returns one scoped to whoever signed in. Someone else
 * loading this URL gets their own calendar, not yours.
 */
import { GOOGLE_CLIENT_ID, SCOPES } from '../config.js'

const GSI_SRC = 'https://accounts.google.com/gsi/client'
const TOKEN_KEY = 'gigScheduler.token'

/** Treat a token as spent a minute early, so a call can't die mid-flight. */
const EXPIRY_SKEW_MS = 60_000

let tokenClient = null
let accessToken = null
let expiresAt = 0

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve()
    const el = document.createElement('script')
    el.src = src
    el.async = true
    el.defer = true
    el.onload = () => resolve()
    el.onerror = () => reject(new Error('Could not reach Google to sign in.'))
    document.head.appendChild(el)
  })
}

/**
 * sessionStorage, not localStorage: an access token lives about an hour, and
 * keeping it only for the life of the tab means a shared or borrowed phone
 * doesn't hold one after the tab closes.
 */
function restore() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || 'null')
    if (saved && saved.expiresAt > Date.now() + EXPIRY_SKEW_MS) {
      accessToken = saved.accessToken
      expiresAt = saved.expiresAt
    }
  } catch {
    /* a malformed or unavailable store just means signing in again */
  }
}

function persist() {
  try {
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ accessToken, expiresAt }))
  } catch {
    /* private mode: the token still works for this page load */
  }
}

export async function initAuth() {
  if (!GOOGLE_CLIENT_ID) return
  await loadScript(GSI_SRC)
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: SCOPES.join(' '),
    callback: () => {},
  })
  restore()
}

export function isSignedIn() {
  return Boolean(accessToken) && expiresAt > Date.now() + EXPIRY_SKEW_MS
}

export function getToken() {
  return isSignedIn() ? accessToken : null
}

export function clearToken() {
  accessToken = null
  expiresAt = 0
  try {
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* nothing to clean up */
  }
}

/**
 * Must be called from a click. `prompt: ''` lets Google decide: silent when
 * you've already consented and are still signed in, a consent popup when it
 * genuinely needs one — and a popup with no user gesture behind it gets
 * blocked, which is why this is never called on load.
 */
export function signIn() {
  return new Promise((resolve, reject) => {
    if (!tokenClient) return reject(new Error('Google sign-in is still loading.'))
    tokenClient.callback = (response) => {
      if (response.error) {
        return reject(new Error(response.error_description || response.error))
      }
      accessToken = response.access_token
      expiresAt = Date.now() + (Number(response.expires_in) || 3600) * 1000
      persist()
      resolve(accessToken)
    }
    tokenClient.error_callback = (err) => {
      reject(new Error(err?.type === 'popup_closed' ? 'Sign-in was cancelled.' : 'Sign-in failed.'))
    }
    tokenClient.requestAccessToken({ prompt: '' })
  })
}
