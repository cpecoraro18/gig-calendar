/**
 * The post maker, as a tool.
 *
 * Unlike the gig publisher it has no `load`: the studio fetches its calendar
 * itself when you open it. A tool loader runs on every range change and after
 * every save, and this one would be paying for a list of gigs on the chance
 * that you might one day want to make a poster. Fetching on open costs a
 * spinner once and nothing the rest of the time.
 */
import { readPref, writePref } from '../../lib/prefs.js'
import { gigCalendarId } from '../gig/tool.js'
import { isUpcoming } from './posters.js'
import PosterPanel from './PosterPanel.vue'
import PosterSettings from './PosterSettings.vue'

const KEY = 'tool.poster.calendarId'

/**
 * Where posts find gigs. Most people keep them on an ordinary calendar —
 * often their main one — so this is its own choice rather than the website
 * calendar. Someone who set up publishing before this existed had their posts
 * drawn from the website calendar, and keeps that until they pick otherwise.
 */
export function posterCalendarId() {
  return readPref(KEY) || gigCalendarId()
}

export function setPosterCalendarId(id) {
  writePref(KEY, id)
}

export default {
  id: 'poster',
  title: 'Make a post',
  icon: '▣',
  blurb: 'A vertical image for stories and feeds.',
  panel: PosterPanel,
  settings: PosterSettings,

  /**
   * Day of, or later. There is no such thing as promoting last Tuesday, and an
   * offer to do it on every event in the past would bury the ones that matter.
   */
  applies(event) {
    return isUpcoming(event)
  },
}
