/**
 * The OAuth client ID is not a secret — it identifies the app to Google, and
 * Google only honours it on origins you list in the Cloud console. It still
 * comes in as a build-time variable rather than a committed constant so the
 * same source can run against a throwaway client ID on localhost.
 */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

/**
 * Deliberately narrower than the blanket `calendar` scope:
 *  - calendar.events   read and write events (this is what publishes a gig)
 *  - calendar.readonly  list which calendars exist, for the pickers
 */
export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
]

/** How far the agenda looks, in days. A week back so today is never the top row. */
export const WINDOW_BACK_DAYS = 7
export const WINDOW_FORWARD_DAYS = 365

export const STORAGE = {
  source: 'gigScheduler.sourceCalendarId',
  dest: 'gigScheduler.destCalendarId',
}
