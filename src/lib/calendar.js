/** Thin wrapper over the Google Calendar v3 REST API, called straight from the browser. */
import { getToken, clearToken } from './google.js'

const BASE = 'https://www.googleapis.com/calendar/v3'

/** Distinct from a normal failure so the UI can offer sign-in rather than a retry. */
export class AuthError extends Error {}

const path = (...parts) => parts.map(encodeURIComponent).join('/')

async function api(url, { method = 'GET', params, body } = {}) {
  const token = getToken()
  if (!token) throw new AuthError('Not signed in.')

  const target = new URL(BASE + url)
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== '') target.searchParams.set(key, value)
  }

  const response = await fetch(target, {
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
  const data = await api('/users/me/calendarList', { params: { maxResults: 250 } })
  return data.items || []
}

/** The palette behind an event's `colorId`, so a recoloured event looks right. */
export async function listColors() {
  const data = await api('/colors')
  return data?.event || {}
}

/**
 * Every event in the window, following pageToken to the end. `singleEvents`
 * expands a recurring series into its occurrences, so a weekly residency shows
 * as the individual nights rather than one row in January.
 */
export async function listEvents(calendarId, { timeMin, timeMax }) {
  const items = []
  let pageToken
  do {
    const data = await api(`/${path('calendars', calendarId, 'events')}`, {
      params: {
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250,
        showDeleted: false,
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
  return api(`/${path('calendars', calendarId, 'events')}`, { method: 'POST', body: event })
}

export function patchEvent(calendarId, eventId, patch) {
  return api(`/${path('calendars', calendarId, 'events', eventId)}`, { method: 'PATCH', body: patch })
}

export function deleteEvent(calendarId, eventId) {
  return api(`/${path('calendars', calendarId, 'events', eventId)}`, { method: 'DELETE' })
}

/**
 * Moving an event between calendars is its own verb — a create-and-delete pair
 * would break every invite and drop the event's history.
 */
export function moveEvent(calendarId, eventId, destination) {
  return api(`/${path('calendars', calendarId, 'events', eventId, 'move')}`, {
    method: 'POST',
    params: { destination },
  })
}
