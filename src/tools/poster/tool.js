/**
 * The post maker, as a tool.
 *
 * Unlike the gig publisher it has no `load`: the studio fetches the gigs
 * calendar itself when you open it. A tool loader runs on every range change and
 * after every save, and this one would be paying for a list of gigs on the
 * chance that you might one day want to make a poster. Fetching on open costs a
 * spinner once and nothing the rest of the time.
 */
import { isUpcoming } from './posters.js'
import PosterPanel from './PosterPanel.vue'

export default {
  id: 'poster',
  title: 'Make a post',
  icon: '▣',
  blurb: 'A vertical image for stories and feeds.',
  panel: PosterPanel,

  /**
   * Day of, or later. There is no such thing as promoting last Tuesday, and an
   * offer to do it on every event in the past would bury the ones that matter.
   */
  applies(event) {
    return isUpcoming(event)
  },
}
