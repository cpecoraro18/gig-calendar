/**
 * Tools: the extra things this calendar can do to an event that Google
 * Calendar can't.
 *
 * A tool is a plain object, so adding one is adding a file and a line to the
 * list below — the event sheet, the agenda badges and the settings screen all
 * pick it up without knowing what it does. The gig publisher is the first one,
 * and it exists mostly to prove the shape is real rather than theoretical.
 *
 * Every field but `id`, `title` and `panel` is optional:
 *
 *   id       stable string, used as the key for this tool's state
 *   title    what the button on an event says
 *   icon     one glyph, shown beside it
 *   blurb    one line under the title in the event sheet
 *   panel    the component opened when the button is tapped. Receives
 *            `event` and `state`; emits `close` and `changed`
 *   settings a component for the tool's own settings, shown in the
 *            Calendars sheet under the tool's name
 *   load     async ({ from, to }) => state. Runs after events load and
 *            after any tool reports a change; whatever it returns is handed
 *            back to `applies`, `badge` and `panel`
 *   applies  (event, state) => boolean. False hides the button — a tool that
 *            isn't configured yet, or doesn't suit this event
 *   badge    (event, state) => ({ label, tone }) | null, for the chip shown on
 *            agenda rows. `tone` is 'live', 'warn' or 'plain'
 */
import gig from './gig/tool.js'

export const tools = [gig]

export const toolsWithSettings = tools.filter((tool) => tool.settings)

/** The tools offered on a particular event, given the current tool state. */
export function toolsFor(event, states) {
  if (!event) return []
  return tools.filter((tool) => !tool.applies || tool.applies(event, states[tool.id]))
}

/** Every badge any tool wants to show on this event. */
export function badgesFor(event, states) {
  const badges = []
  for (const tool of tools) {
    const badge = tool.badge?.(event, states[tool.id])
    if (badge) badges.push({ ...badge, tool: tool.id })
  }
  return badges
}

/** Run every tool's loader. One failing tool must not take the others down. */
export async function loadToolStates(range) {
  const entries = await Promise.all(
    tools.map(async (tool) => {
      if (!tool.load) return [tool.id, null]
      try {
        return [tool.id, await tool.load(range)]
      } catch {
        // A tool that can't load simply offers nothing this time round.
        return [tool.id, null]
      }
    })
  )
  return Object.fromEntries(entries)
}
