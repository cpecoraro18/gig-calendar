/** Date helpers shared by the agenda list and the gig panel. */

export function isAllDay(event) {
  return !event?.start?.dateTime
}

/**
 * An all-day event carries a plain "YYYY-MM-DD". Passing that to `new Date`
 * parses it as UTC, which lands on the previous day for anyone west of
 * Greenwich — so it's pinned to local midnight instead.
 */
export function toDate(slot) {
  if (!slot) return null
  if (slot.dateTime) return new Date(slot.dateTime)
  if (slot.date) return new Date(`${slot.date}T00:00:00`)
  return null
}

export const startOf = (event) => toDate(event?.start)
export const endOf = (event) => toDate(event?.end)

export function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function formatDayHeading(date) {
  return date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatMonth(date) {
  return date.toLocaleDateString([], { month: 'long', year: 'numeric' })
}

export function formatTime(date) {
  return date
    .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    .replace(':00', '')
}

export function formatTimeRange(event) {
  if (isAllDay(event)) return 'All day'
  const start = startOf(event)
  const end = endOf(event)
  if (!start) return ''
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start)
}

export function isSameDay(a, b) {
  return a && b && dayKey(a) === dayKey(b)
}

export function isToday(date) {
  return isSameDay(date, new Date())
}

export function isPast(event) {
  const end = endOf(event) || startOf(event)
  return Boolean(end) && end.getTime() < Date.now()
}

/** ISO bounds for the scan window. */
export function windowBounds(backDays, forwardDays) {
  const timeMin = new Date()
  timeMin.setDate(timeMin.getDate() - backDays)
  timeMin.setHours(0, 0, 0, 0)
  const timeMax = new Date()
  timeMax.setDate(timeMax.getDate() + forwardDays)
  return { timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString() }
}
