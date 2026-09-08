/**
 * The event model: reading a Google event resource, and turning the editor's
 * form back into one.
 *
 * Google describes a timed event with `dateTime` and an all-day one with a
 * plain `date`, and an all-day event's `end` is *exclusive* — a single day on
 * the 3rd ends on the 4th. Both quirks are contained in this file so the rest
 * of the app can ask plain questions like "when does this start".
 */
import {
  TIME_ZONE,
  ymd,
  parseYmd,
  addDays,
  addMinutes,
  toLocalInput,
  fromLocalInput,
  startOfDay,
  formatTime,
} from './dates.js'

export function isAllDay(event) {
  return !event?.start?.dateTime
}

function slotDate(slot) {
  if (!slot) return null
  if (slot.dateTime) return new Date(slot.dateTime)
  if (slot.date) return parseYmd(slot.date)
  return null
}

export const eventStart = (event) => slotDate(event?.start)
export const eventEnd = (event) => slotDate(event?.end)

/** A zero-length event still has to occupy a moment, or it lands on no day at all. */
function span(event) {
  const start = eventStart(event)
  if (!start) return null
  const end = eventEnd(event)
  return { start, end: end && end > start ? end : new Date(start.getTime() + 1) }
}

/** Does this event touch the given day? True for every day a multi-day event covers. */
export function occursOn(event, day) {
  const s = span(event)
  if (!s) return false
  const from = startOfDay(day)
  const to = addDays(from, 1)
  return s.start < to && s.end > from
}

export function isPast(event) {
  const s = span(event)
  return Boolean(s) && s.end.getTime() < Date.now()
}

/** Sort key: all-day events lead the day, then chronological. */
export function compareEvents(a, b) {
  const allDayGap = Number(isAllDay(b)) - Number(isAllDay(a))
  if (allDayGap) return allDayGap
  const left = eventStart(a)?.getTime() ?? 0
  const right = eventStart(b)?.getTime() ?? 0
  return left - right || (a.summary || '').localeCompare(b.summary || '')
}

export function sortEvents(events) {
  return [...events].sort(compareEvents)
}

/**
 * The time label for a row, said the way you'd say it out loud: a multi-day
 * event reads as a date range rather than a time, because its start time isn't
 * the useful fact about it.
 */
export function timeLabel(event, onDay) {
  if (isAllDay(event)) {
    const start = eventStart(event)
    const end = eventEnd(event)
    const days = end ? Math.round((end - start) / 86_400_000) : 1
    return days > 1 ? `All day · ${days} days` : 'All day'
  }
  const start = eventStart(event)
  const end = eventEnd(event)
  if (!start) return ''
  // Continuing from an earlier day: the start time belongs to another row.
  if (onDay && start < startOfDay(onDay)) return `Until ${formatTime(end)}`
  if (end && end > addDays(startOfDay(start), 1)) return `${formatTime(start)} →`
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start)
}

export const REPEATS = [
  { value: '', label: 'Does not repeat' },
  { value: 'RRULE:FREQ=DAILY', label: 'Every day' },
  { value: 'RRULE:FREQ=WEEKLY', label: 'Every week' },
  { value: 'RRULE:FREQ=MONTHLY', label: 'Every month' },
  { value: 'RRULE:FREQ=YEARLY', label: 'Every year' },
]

/** True for one occurrence of a series, which is all this app ever edits. */
export function isRecurringInstance(event) {
  return Boolean(event?.recurringEventId)
}

export function repeatLabel(event) {
  const rule = (event?.recurrence || []).find((line) => line.startsWith('RRULE'))
  const known = REPEATS.find((option) => option.value && rule?.startsWith(option.value))
  if (known) return known.label
  if (rule || isRecurringInstance(event)) return 'Repeats'
  return ''
}

/** A blank event, an hour long, starting at the next round half hour. */
export function newDraft(day, calendarId) {
  const now = new Date()
  const base = new Date(day || now)
  const anchor = new Date(base)
  anchor.setHours(now.getHours(), now.getMinutes() >= 30 ? 60 : 30, 0, 0)
  const start = anchor
  return {
    summary: '',
    location: '',
    description: '',
    allDay: false,
    startLocal: toLocalInput(start),
    endLocal: toLocalInput(addMinutes(start, 60)),
    startDay: ymd(base),
    endDay: ymd(base),
    calendarId,
    recurrence: '',
  }
}

/** Fill the editor from an existing event. */
export function draftFromEvent(event) {
  const allDay = isAllDay(event)
  const start = eventStart(event) || new Date()
  const end = eventEnd(event) || addMinutes(start, 60)
  return {
    summary: event.summary || '',
    location: event.location || '',
    description: event.description || '',
    allDay,
    // An all-day event carries no times of its own, so the timed half of the
    // form holds a placeholder in case the switch gets flipped.
    startLocal: toLocalInput(start),
    endLocal: toLocalInput(allDay ? addMinutes(start, 60) : end),
    startDay: ymd(start),
    // Google's exclusive end date, shown inclusively: a one-day event reads as
    // starting and ending on the same day, which is how people describe it.
    endDay: ymd(allDay ? addDays(end, -1) : start),
    calendarId: event.calendarId,
    recurrence: (event.recurrence || []).find((line) => line.startsWith('RRULE')) || '',
  }
}

/** Keep the two halves of the form in step when the all-day switch is flipped. */
export function syncDraftMode(draft) {
  if (draft.allDay) {
    const start = fromLocalInput(draft.startLocal)
    const end = fromLocalInput(draft.endLocal)
    draft.startDay = ymd(start)
    draft.endDay = ymd(end < start ? start : end)
  } else {
    const day = parseYmd(draft.startDay)
    const start = new Date(day)
    start.setHours(19, 0, 0, 0)
    draft.startLocal = toLocalInput(start)
    draft.endLocal = toLocalInput(addMinutes(start, 60))
  }
  return draft
}

/** Moving the start drags the end with it, keeping the duration. */
export function shiftDraftEnd(draft, previousStart) {
  const before = fromLocalInput(previousStart)
  const after = fromLocalInput(draft.startLocal)
  const end = fromLocalInput(draft.endLocal)
  const duration = Math.max(end - before, 0)
  draft.endLocal = toLocalInput(new Date(after.getTime() + duration))
  return draft
}

/** The form as a Google event resource, or an error explaining why it isn't one. */
export function toResource(draft) {
  const summary = draft.summary.trim()
  if (!summary) throw new Error('An event needs a title.')

  let start
  let end
  if (draft.allDay) {
    const from = parseYmd(draft.startDay)
    const to = parseYmd(draft.endDay || draft.startDay)
    if (to < from) throw new Error('The end date is before the start date.')
    start = { date: ymd(from) }
    end = { date: ymd(addDays(to, 1)) }
  } else {
    const from = fromLocalInput(draft.startLocal)
    const to = fromLocalInput(draft.endLocal)
    if (!(to > from)) throw new Error('The end time is before the start time.')
    start = { dateTime: from.toISOString(), timeZone: TIME_ZONE }
    end = { dateTime: to.toISOString(), timeZone: TIME_ZONE }
  }

  return {
    summary,
    location: draft.location.trim(),
    description: draft.description.trim(),
    start,
    end,
  }
}
