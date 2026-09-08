/**
 * The OAuth client ID is not a secret — it identifies the app to Google, and
 * Google only honours it on origins you list in the Cloud console. It still
 * comes in as a build-time variable rather than a committed constant so the
 * same source can run against a throwaway client ID on localhost.
 */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

/**
 * Deliberately narrower than the blanket `calendar` scope:
 *  - calendar.events    read and write events on any calendar you can reach
 *  - calendar.readonly  list which calendars exist, and their colours
 *
 * Neither one lets the app create, delete or share a calendar. Those are the
 * operations you'd do once, in Google Calendar, and never from a phone.
 */
export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
]

/**
 * How much calendar is fetched at a time. Events load in spans rather than one
 * enormous query: opening the app should cost a few weeks of data, and paging
 * into 2028 should cost the same again rather than everything in between.
 */
export const RANGE = {
  /** Loaded on first open — far enough back that last weekend is still there. */
  backDays: 45,
  forwardDays: 120,
  /** How far each extra fetch reaches when you navigate past the loaded edge. */
  stepDays: 120,
}

export const STORAGE = {
  visible: 'cal.visibleCalendars',
  defaultCalendar: 'cal.defaultCalendar',
  view: 'cal.view',
}

/** Keys the gig-only version of this app wrote, read once to carry settings over. */
export const LEGACY_STORAGE = {
  source: 'gigScheduler.sourceCalendarId',
  dest: 'gigScheduler.destCalendarId',
}
