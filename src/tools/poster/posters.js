/**
 * Turning calendar events into the handful of words a poster is made of.
 *
 * A gig on a calendar is written for you — "Trio @ The Green Mill", a location
 * that is really a postal address, a description full of load-in times. A gig on
 * a poster is written for a stranger holding a phone. This file is the whole of
 * that translation, kept away from the drawing code so the templates only ever
 * receive act, venue, day and time.
 */
import {
  addDays,
  startOfDay,
  startOfWeek,
  endOfMonth,
  isSameDay,
  formatTime,
} from '../../lib/dates.js'
import { eventStart, eventEnd, isAllDay, compareEvents } from '../../lib/events.js'

/**
 * How much of the calendar a post covers. Every one of them starts today rather
 * than at the top of the period: a poster advertising last Tuesday is worse than
 * no poster, so "this month" means the rest of this month.
 */
export const SCOPES = [
  { id: 'one', label: 'One gig' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
]

export function scopeWindow(scope, now = new Date()) {
  const from = startOfDay(now)
  if (scope === 'week') return { from, to: addDays(startOfWeek(now), 7) }
  if (scope === 'month') return { from, to: endOfMonth(now) }
  // One gig is picked by hand, so the window is only there to decide which gigs
  // are offered in the picker.
  return { from, to: addDays(from, 400) }
}

/** Everything starting inside the window, earliest first. */
export function gigsIn(events, window) {
  return events
    .filter((event) => {
      const start = eventStart(event)
      return start && start >= window.from && start < window.to
    })
    .sort(compareEvents)
}

/** Is this event still worth posting about? Today counts, yesterday does not. */
export function isUpcoming(event, now = new Date()) {
  const end = eventEnd(event) || eventStart(event)
  return Boolean(end) && end >= startOfDay(now)
}

/**
 * A venue is usually typed in as a full postal address. The name is the part
 * before the first comma; the rest is directions, which belong on a map rather
 * than on a poster, so it is kept separate and only drawn where there is room.
 */
export function splitLocation(location) {
  const parts = String(location || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  if (!parts.length) return { venue: '', detail: '' }
  const [venue, ...rest] = parts
  // Drop the street line: "4802 N Broadway" adds nothing next to "Chicago".
  const detail = rest.filter((part) => !/^\d/.test(part)).join(', ')
  return { venue, detail }
}

/**
 * Calendar titles are very often "Act @ Venue", which is the one convention
 * worth understanding: it saves retyping the act on every poster. An explicit
 * location still wins, because it is the field that was meant for the venue.
 */
export function splitTitle(summary) {
  const raw = String(summary || '').trim()
  const at = raw.match(/^(.*?)\s+[@]\s+(.*)$/)
  if (at) return { act: at[1].trim(), venue: at[2].trim() }
  return { act: raw, venue: '' }
}

/**
 * Everything a template is allowed to know about one gig. Every string is kept
 * in its natural case: whether a look shouts is the look's business, and a card
 * that arrives pre-shouted can never be set quietly again.
 */
export function cardFor(event, now = new Date()) {
  const start = eventStart(event) || new Date()
  const titled = splitTitle(event.summary)
  const located = splitLocation(event.location)
  const allDay = isAllDay(event)

  const today = isSameDay(start, now)
  const tomorrow = isSameDay(start, addDays(startOfDay(now), 1))

  return {
    key: `${event.calendarId}|${event.id}`,
    act: titled.act || 'Untitled',
    venue: located.venue || titled.venue || '',
    venueDetail: located.venue ? located.detail : '',
    start,
    allDay,
    time: allDay ? '' : formatTime(start),
    weekdayShort: start.toLocaleDateString([], { weekday: 'short' }),
    weekdayLong: start.toLocaleDateString([], { weekday: 'long' }),
    monthShort: start.toLocaleDateString([], { month: 'short' }),
    day: String(start.getDate()),
    dateLine: start.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }),
    dateShort: start.toLocaleDateString([], { month: 'short', day: 'numeric' }),
    /** What a human would say out loud, which beats a date whenever it applies. */
    nearLabel: today ? 'Tonight' : tomorrow ? 'Tomorrow' : '',
  }
}

/** The short range under a list heading: "SEP 12 – SEP 18". */
export function rangeLabel(cards) {
  if (!cards.length) return ''
  const first = cards[0]
  const last = cards[cards.length - 1]
  if (first.dateShort === last.dateShort) return first.dateShort
  return `${first.dateShort} – ${last.dateShort}`
}

/**
 * The wording a scope starts with. All of it is editable in the panel — these
 * are the defaults that make the common post a two-tap job.
 */
export function defaultCopy(scope, cards, now = new Date()) {
  if (scope === 'one') {
    const card = cards[0]
    return {
      kicker: card?.nearLabel || card?.weekdayLong || 'LIVE',
      heading: '',
      subheading: '',
    }
  }
  if (scope === 'week') {
    return { kicker: '', heading: 'This Week', subheading: rangeLabel(cards) }
  }
  return {
    kicker: '',
    heading: now.toLocaleDateString([], { month: 'long' }),
    subheading: cards.length > 1 ? `${cards.length} shows` : rangeLabel(cards),
  }
}

/** A filename someone can find again in their camera roll. */
export function fileName(spec, cards) {
  const card = cards[0]
  const when = card
    ? `${card.start.getFullYear()}-${String(card.start.getMonth() + 1).padStart(2, '0')}-${String(
        card.start.getDate()
      ).padStart(2, '0')}`
    : 'gigs'
  const slug = cards.length > 1 ? `${cards.length}-shows` : (card?.act || 'gig').toLowerCase()
  return `${when}-${slug}-${spec.template}.png`
    .replace(/[^a-z0-9.-]+/gi, '-')
    .replace(/-+/g, '-')
}
