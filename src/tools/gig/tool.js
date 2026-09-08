/**
 * The gig publisher, as a tool.
 *
 * It turns any event on any calendar into a listing on the gigs calendar that
 * chrispecmusic.com reads. Everything it needs — which calendar publishes, what
 * is already published — it loads itself, so the rest of the app carries no
 * knowledge of gigs at all.
 */
import { listEvents } from '../../lib/calendar.js'
import { readPref, writePref } from '../../lib/prefs.js'
import { legacyDestCalendar, forgetLegacy } from '../../lib/store.js'
import { indexGigs, gigState, STATE } from './gigs.js'
import GigPanel from './GigPanel.vue'
import GigSettings from './GigSettings.vue'

const KEY = 'tool.gig.calendarId'

export function gigCalendarId() {
  const saved = readPref(KEY)
  if (saved) return saved
  // The gig-only build stored this under its own key. Carry it across once, so
  // an upgrade doesn't ask you to pick a calendar you already picked.
  const carried = legacyDestCalendar()
  if (carried) setGigCalendarId(carried)
  return carried || ''
}

export function setGigCalendarId(id) {
  writePref(KEY, id)
  forgetLegacy()
}

export default {
  id: 'gig',
  title: 'Publish as a gig',
  icon: '♪',
  blurb: 'Puts this event on chrispecmusic.com.',
  panel: GigPanel,
  settings: GigSettings,

  /**
   * Reading the gigs calendar over the same window as everything else is what
   * makes this safe to reopen: it always knows which events already have a
   * listing, so nothing is ever published twice.
   */
  async load({ from, to }) {
    const calendarId = gigCalendarId()
    if (!calendarId || !from) return { calendarId, bySource: new Map() }
    const gigs = await listEvents(calendarId, {
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
    })
    return { calendarId, bySource: indexGigs(gigs) }
  },

  /** Nothing to offer until a gigs calendar is chosen, and never on that calendar. */
  applies(event, state) {
    return Boolean(state?.calendarId) && event.calendarId !== state.calendarId
  },

  badge(event, state) {
    if (!state?.calendarId || event.calendarId === state.calendarId) return null
    const gig = state.bySource.get(event.id)
    const status = gigState(event, gig)
    if (status === STATE.published) return { label: 'On site', tone: 'live' }
    if (status === STATE.drifted) return { label: 'Changed', tone: 'warn' }
    return null
  },
}
