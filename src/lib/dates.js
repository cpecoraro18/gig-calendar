/**
 * Date helpers. Everything here works in the browser's local time zone, which
 * is the only one a calendar you carry around actually cares about.
 */

export const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

const pad = (n) => String(n).padStart(2, '0')

/** "YYYY-MM-DD" for a local date — the format Google uses for all-day events. */
export function ymd(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * A plain "YYYY-MM-DD" passed to `new Date` parses as UTC, which lands on the
 * previous day for anyone west of Greenwich. Split and build locally instead.
 */
export function parseYmd(text) {
  const [y, m, d] = text.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** "YYYY-MM-DDTHH:mm" — what an <input type="datetime-local"> wants. */
export function toLocalInput(date) {
  return `${ymd(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromLocalInput(text) {
  const [day, time] = text.split('T')
  const [y, m, d] = day.split('-').map(Number)
  const [hh, mm] = (time || '00:00').split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm)
}

export function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000)
}

/**
 * Month arithmetic has to clamp: 31 January plus one month is 31 February,
 * which JavaScript happily rolls into March. Snap to the 1st before adding.
 */
export function addMonths(date, months) {
  const next = new Date(date.getFullYear(), date.getMonth() + months, 1)
  return next
}

export function startOfDay(date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export function endOfDay(date) {
  return addDays(startOfDay(date), 1)
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1)
}

/** Sunday-first, matching the weekday strip in the month grid. */
export function startOfWeek(date) {
  return addDays(startOfDay(date), -startOfDay(date).getDay())
}

/**
 * The six-by-seven block a month grid needs. Always six rows, so the grid
 * doesn't change height as you swipe between months — a jumping layout on a
 * phone is worse than one row of grey trailing days.
 */
export function monthGrid(month) {
  const first = startOfWeek(startOfMonth(month))
  const weeks = []
  for (let w = 0; w < 6; w += 1) {
    const days = []
    for (let d = 0; d < 7; d += 1) days.push(addDays(first, w * 7 + d))
    weeks.push(days)
  }
  return weeks
}

export function weekdayNames() {
  const base = startOfWeek(new Date())
  return Array.from({ length: 7 }, (_, i) =>
    addDays(base, i).toLocaleDateString([], { weekday: 'narrow' })
  )
}

export function dayKey(date) {
  return ymd(date)
}

export function isSameDay(a, b) {
  return Boolean(a && b) && dayKey(a) === dayKey(b)
}

export function isToday(date) {
  return isSameDay(date, new Date())
}

export function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export function formatTime(date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(':00', '')
}

export function formatDayHeading(date) {
  return date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatLongDay(date) {
  return date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatMonth(date) {
  return date.toLocaleDateString([], { month: 'long', year: 'numeric' })
}

/** Drops the year when it's the current one — it's noise eleven months of twelve. */
export function formatMonthShort(date) {
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString([], { month: 'long', ...(sameYear ? {} : { year: 'numeric' }) })
}
