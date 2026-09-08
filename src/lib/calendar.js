/** Thin wrapper over the Google Calendar v3 REST API, called straight from the browser. */
import { getToken, clearToken } from './google.js'

const BASE = 'https://www.googleapis.com/calendar/v3'

/** Distinct from a normal failure so the UI can offer sign-in rather than a retry. */
export class AuthError extends Error {}

async function api(path, { method = 'GET', params, body } = {}) {
  const token = getToken()
  if (!token) throw new AuthError('Not signed in.')

  const url = new URL(BASE + path)
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401) {
    clearToken()
    throw new AuthError('Your Google session expired.')
  }
  if (!response.ok) {
    // Google's own message ("Insufficient permission") is far more useful than
    // the status code, and it's the one that tells you a scope is missing.
    let detail = ''
    try {
      detail = (await response.json())?.error?.message || ''
    } catch {
      /* fall back to the status code */
    }
    throw new Error(detail || `Google Calendar returned ${response.status}.`)
  }
  return response.status === 204 ? null : response.json()
}

export async function listCalendars() {
  const data = await api('/users/me/calendarList', {
    params: { minAccessRole: 'reader', maxResults: 250 },
  })
  return data.items || []
}

/**
 * Every event in the window, following pageToken to the end. `singleEvents`
 * expands a recurring series into its occurrences, so a weekly residency shows
 * as the individual nights you'd actually publish.
 */
export async function listEvents(calendarId, { timeMin, timeMax }) {
  const items = []
  let pageToken
  do {
    const data = await api(`/calendars/${encodeURIComponent(calendarId)}/events`, {
      params: {
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250,
        timeMin,
        timeMax,
        pageToken,
      },
    })
    items.push(...(data.items || []))
    pageToken = data.nextPageToken
  } while (pageToken)
  return items
}

export function createEvent(calendarId, event) {
  return api(`/calendars/${encodeURIComponent(calendarId)}/events`, { method: 'POST', body: event })
}

export function patchEvent(calendarId, eventId, patch) {
  return api(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: 'PATCH', body: patch }
  )
}

export function deleteEvent(calendarId, eventId) {
  return api(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: 'DELETE' }
  )
}
