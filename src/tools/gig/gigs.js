/**
 * The link between a calendar event and its published gig.
 *
 * A published gig is an ordinary event on the gigs calendar, which is what
 * keeps chrispecmusic.com working untouched — it already reads that calendar.
 * What makes the link durable is `extendedProperties.private`: it rides along
 * on the event, comes back on every read, and needs no database. Matching on
 * the source event's id rather than on title and time means renaming a gig
 * doesn't create a second listing.
 */
export const SRC_EVENT_ID = 'srcEventId'
export const SRC_CALENDAR_ID = 'srcCalendarId'
export const SRC_HASH = 'srcHash'

/**
 * djb2 — enough to notice the source event changed after you published it.
 * Not a security hash; it only ever compares against itself.
 */
function hash(text) {
  let value = 5381
  for (let i = 0; i < text.length; i += 1) {
    value = ((value << 5) + value + text.charCodeAt(i)) | 0
  }
  return (value >>> 0).toString(36)
}

/**
 * A NUL byte: the one character that can't appear in a title or a venue, so no
 * two events can be rearranged into the same fingerprint. It also has to stay
 * exactly what the first version used — changing the separator would
 * re-fingerprint every published gig and flag them all as changed at once.
 */
const SEPARATOR = String.fromCharCode(0)

/** The fields whose drift is worth surfacing — the ones that reach the site. */
export function sourceHash(event) {
  return hash(
    [
      event.summary || '',
      event.location || '',
      event.description || '',
      event.start?.dateTime || event.start?.date || '',
      event.end?.dateTime || event.end?.date || '',
    ].join(SEPARATOR)
  )
}

export function privateProps(gig) {
  return gig?.extendedProperties?.private || {}
}

/** Index published gigs by the source event they came from. */
export function indexGigs(gigEvents) {
  const bySource = new Map()
  for (const gig of gigEvents) {
    const id = privateProps(gig)[SRC_EVENT_ID]
    if (id) bySource.set(id, gig)
  }
  return bySource
}

/**
 * Turn a source event into the gig payload. `overrides` carries whatever you
 * edited in the panel; the times come from the source either way, since a gig's
 * date is a fact rather than a piece of copy.
 */
export function buildGig(source, sourceCalendarId, overrides = {}) {
  const gig = {
    summary: (overrides.summary ?? source.summary ?? '').trim(),
    location: (overrides.location ?? source.location ?? '').trim(),
    description: (overrides.description ?? source.description ?? '').trim(),
    start: source.start,
    end: source.end,
    extendedProperties: {
      private: {
        [SRC_EVENT_ID]: source.id,
        [SRC_CALENDAR_ID]: sourceCalendarId,
        [SRC_HASH]: sourceHash(source),
      },
    },
  }
  // The site renders an empty location as "TBD" but an empty summary as a blank
  // row, so a title is the one thing worth refusing to publish without.
  if (!gig.summary) throw new Error('A gig needs a title.')
  return gig
}

export const STATE = {
  unpublished: 'unpublished',
  published: 'published',
  drifted: 'drifted',
}

/**
 * Three states, because the interesting one is the third: published, but the
 * source event has been edited since. That's the case where the site is quietly
 * out of date and nothing would otherwise tell you.
 */
export function gigState(source, gig) {
  if (!gig) return STATE.unpublished
  const stored = privateProps(gig)[SRC_HASH]
  if (stored && stored !== sourceHash(source)) return STATE.drifted
  return STATE.published
}
