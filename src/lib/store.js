/**
 * The calendar itself: which calendars exist, which of them you're looking at,
 * and the events loaded so far.
 *
 * One module-level store rather than state per component. Everything on screen
 * is a different window onto the same set of events, and the moment two views
 * keep their own copy they start disagreeing about what you just edited.
 */
import { ref, computed, reactive } from 'vue'
import { RANGE, STORAGE, LEGACY_STORAGE } from '../config.js'
import { readPref, writePref, readRawPref, removePref } from './prefs.js'
import {
  listCalendars,
  listColors,
  listEvents,
  createEvent,
  patchEvent,
  deleteEvent,
  moveEvent,
  AuthError,
} from './calendar.js'
import { addDays, startOfDay, ymd } from './dates.js'
import { occursOn, sortEvents, eventStart, eventEnd } from './events.js'

const WRITABLE = ['owner', 'writer']

export const calendars = ref([])
export const eventColors = ref({})
export const visible = ref({})
export const defaultCalendarId = ref('')

/** Keyed by calendar *and* event id: the same id can appear on two calendars. */
const byKey = ref(new Map())
const loaded = reactive({ from: null, to: null })

export const loading = ref(false)
/** A calendar that failed on its own — usually one shared with you, since revoked. */
export const calendarWarnings = ref([])

export const eventKey = (event) => `${event.calendarId}|${event.id}`

export const calendarsById = computed(() =>
  Object.fromEntries(calendars.value.map((calendar) => [calendar.id, calendar]))
)

export const visibleCalendars = computed(() =>
  calendars.value.filter((calendar) => visible.value[calendar.id])
)

export const writableCalendars = computed(() =>
  calendars.value.filter((calendar) => WRITABLE.includes(calendar.accessRole))
)

export function canWrite(calendarId) {
  const calendar = calendarsById.value[calendarId]
  return Boolean(calendar) && WRITABLE.includes(calendar.accessRole)
}

/** An event's colour: its own if it was recoloured, otherwise its calendar's. */
export function colorOf(event) {
  const own = event?.colorId && eventColors.value[event.colorId]?.background
  return own || calendarsById.value[event?.calendarId]?.backgroundColor || '#7f8b99'
}

export function calendarName(calendarId) {
  return calendarsById.value[calendarId]?.summary || ''
}

/* ---------------------------------------------------------------- calendars */

/**
 * On a first run, mirror the calendars already ticked in Google Calendar rather
 * than inventing a selection: `selected` on the calendar list is exactly the
 * set you chose there.
 */
export async function loadCalendars() {
  const [items, colors] = await Promise.all([listCalendars(), listColors().catch(() => ({}))])
  calendars.value = items
  eventColors.value = colors

  const saved = readPref(STORAGE.visible)
  const next = {}
  for (const calendar of items) {
    next[calendar.id] = saved ? Boolean(saved[calendar.id]) : calendar.selected !== false
  }
  // A saved set matching nothing — calendars removed, or a different account —
  // would leave you staring at an empty month with no clue why.
  if (!Object.values(next).some(Boolean)) {
    for (const calendar of items) next[calendar.id] = calendar.selected !== false
  }
  visible.value = next
  writePref(STORAGE.visible, next)

  setDefaultCalendar(pickDefaultCalendar(items))
}

function pickDefaultCalendar(items) {
  const writable = (id) => items.some((c) => c.id === id && WRITABLE.includes(c.accessRole))
  const saved = readPref(STORAGE.defaultCalendar) || readRawPref(LEGACY_STORAGE.source)
  if (saved && writable(saved)) return saved
  return items.find((c) => c.primary)?.id || writableCalendars.value[0]?.id || ''
}

export function setDefaultCalendar(id) {
  defaultCalendarId.value = id
  writePref(STORAGE.defaultCalendar, id)
}

export async function toggleCalendar(id) {
  visible.value = { ...visible.value, [id]: !visible.value[id] }
  writePref(STORAGE.visible, visible.value)
  // Turning one back on shouldn't refetch the other five.
  if (visible.value[id] && loaded.from) await fetchInto(id, loaded.from, loaded.to)
}

/* ------------------------------------------------------------------- events */

function absorb(items, calendarId) {
  const next = new Map(byKey.value)
  for (const item of items) {
    const event = { ...item, calendarId }
    if (item.status === 'cancelled') next.delete(eventKey(event))
    else next.set(eventKey(event), event)
  }
  byKey.value = next
}

async function fetchInto(calendarId, from, to) {
  const items = await listEvents(calendarId, {
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
  })
  absorb(items, calendarId)
}

/**
 * Fetch one span across every visible calendar. A single calendar failing is
 * reported rather than thrown: five calendars loading and one complaining is a
 * far more useful screen than one error message where the month should be.
 */
async function fetchSpan(from, to) {
  const warnings = []
  await Promise.all(
    visibleCalendars.value.map(async (calendar) => {
      try {
        await fetchInto(calendar.id, from, to)
      } catch (error) {
        if (error instanceof AuthError) throw error
        warnings.push(`${calendar.summary}: ${error.message}`)
      }
    })
  )
  calendarWarnings.value = warnings
}

/**
 * Make sure everything between two dates has been fetched, fetching only the
 * parts that haven't. Loaded time is kept as one contiguous span: a calendar
 * gets navigated by walking outwards from today, so holes in the middle never
 * arise and tracking them would be bookkeeping for nothing.
 */
export async function ensureRange(from, to) {
  const wanted = { from: startOfDay(from), to: startOfDay(addDays(to, 1)) }
  const gaps = []
  if (!loaded.from) {
    gaps.push(wanted)
  } else {
    if (wanted.from < loaded.from) gaps.push({ from: wanted.from, to: loaded.from })
    if (wanted.to > loaded.to) gaps.push({ from: loaded.to, to: wanted.to })
  }
  if (!gaps.length) return

  loading.value = true
  try {
    for (const gap of gaps) await fetchSpan(gap.from, gap.to)
    loaded.from = loaded.from && loaded.from < wanted.from ? loaded.from : wanted.from
    loaded.to = loaded.to && loaded.to > wanted.to ? loaded.to : wanted.to
  } finally {
    loading.value = false
  }
}

/** The opening window: a few weeks back, a few months forward. */
export function initialRange() {
  const today = new Date()
  return { from: addDays(today, -RANGE.backDays), to: addDays(today, RANGE.forwardDays) }
}

export const loadedFrom = computed(() => loaded.from)
export const loadedTo = computed(() => loaded.to)

/** Throw away what's loaded and fetch the same span again, from scratch. */
export async function refresh() {
  const span = loaded.from ? { from: loaded.from, to: loaded.to } : initialRange()
  byKey.value = new Map()
  loaded.from = null
  loaded.to = null
  await ensureRange(span.from, addDays(span.to, -1))
}

export const allEvents = computed(() =>
  sortEvents([...byKey.value.values()].filter((event) => visible.value[event.calendarId]))
)

export function eventsOnDay(day) {
  return allEvents.value.filter((event) => occursOn(event, day))
}

/**
 * Day → the events on it, for the dots under a month grid. Built once per
 * change instead of filtering the whole list forty-two times per render.
 */
export const eventsByDay = computed(() => {
  const map = new Map()
  for (const event of allEvents.value) {
    for (const key of daysCovered(event)) {
      const list = map.get(key)
      if (list) list.push(event)
      else map.set(key, [event])
    }
  }
  return map
})

function daysCovered(event) {
  const start = eventStart(event)
  if (!start) return []
  const from = startOfDay(start)
  const rawEnd = eventEnd(event)
  const until = rawEnd && rawEnd > from ? rawEnd : new Date(from.getTime() + 1)
  const keys = []
  let cursor = from
  // A guard, not a policy: a decade-long event would otherwise spin here.
  for (let i = 0; cursor < until && i < 400; i += 1) {
    keys.push(ymd(cursor))
    cursor = addDays(cursor, 1)
  }
  return keys
}

/* ------------------------------------------------------------------ writing */

export async function saveEvent({ calendarId, eventId, resource, recurrence, movedFrom }) {
  const body = { ...resource }
  if (recurrence !== undefined) body.recurrence = recurrence ? [recurrence] : []

  if (!eventId) {
    const created = await createEvent(calendarId, body)
    absorb([created], calendarId)
    return { ...created, calendarId }
  }

  // Changing calendar is a move, then a patch. The move keeps the event's
  // identity and its guests, which a delete-and-recreate pair would throw away.
  let id = eventId
  let home = movedFrom || calendarId
  if (movedFrom && movedFrom !== calendarId) {
    const moved = await moveEvent(movedFrom, eventId, calendarId)
    dropEvent(movedFrom, eventId)
    id = moved.id
    home = calendarId
  }
  const updated = await patchEvent(home, id, body)
  absorb([updated], home)
  return { ...updated, calendarId: home }
}

export async function removeEvent(event) {
  await deleteEvent(event.calendarId, event.id)
  dropEvent(event.calendarId, event.id)
}

function dropEvent(calendarId, eventId) {
  const next = new Map(byKey.value)
  next.delete(`${calendarId}|${eventId}`)
  byKey.value = next
}

/** The live copy of an event, so an open sheet doesn't show a stale one. */
export function currentEvent(event) {
  return event ? byKey.value.get(eventKey(event)) || null : null
}

/** Signing out has to leave nothing of the previous account on screen. */
export function resetStore() {
  byKey.value = new Map()
  loaded.from = null
  loaded.to = null
  calendars.value = []
  calendarWarnings.value = []
}

/** One-time carry-over from the gig-only build, so its choice of calendar survives. */
export function legacyDestCalendar() {
  return readRawPref(LEGACY_STORAGE.dest)
}

export function forgetLegacy() {
  removePref(LEGACY_STORAGE.source)
  removePref(LEGACY_STORAGE.dest)
}

