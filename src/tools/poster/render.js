/**
 * The two layouts every template is poured into.
 *
 * `hero` is one gig taking the whole poster; `list` is a run of dates. Both
 * measure before they draw and stack from the outside in — the footer is pinned
 * to the bottom, the kicker to the top, and whatever is left over goes to the
 * band name. Nothing here uses a fixed font size for content, because the one
 * thing a poster generator must never do is clip a venue or run a name off the
 * edge, and the gig that breaks a hard-coded size is always the one you are
 * posting from a car park ten minutes before doors.
 */
import * as P from './paint.js'
import { templateById, font } from './themes.js'

/**
 * Vertical only, and padded for the phone furniture: a story has a profile
 * bubble over the top of it and a reply box across the bottom, so the safe area
 * is a great deal smaller than the canvas.
 */
export const SIZES = [
  {
    id: 'story',
    label: 'Story',
    ratio: '9:16',
    w: 1080,
    h: 1920,
    pad: { top: 215, bottom: 255, side: 92 },
  },
  {
    id: 'post',
    label: 'Post',
    ratio: '4:5',
    w: 1080,
    h: 1350,
    pad: { top: 110, bottom: 118, side: 88 },
  },
]

export function sizeById(id) {
  return SIZES.find((size) => size.id === id) || SIZES[0]
}

const text = (value) => String(value ?? '').trim()
const upper = (value) => text(value).toUpperCase()

/** Display type follows the theme; small labels are always set as caps. */
const caps = (theme, value) => (theme.displayCaps ? upper(value) : text(value))

function anchor(S) {
  return S.theme.align === 'center' ? S.box.x + S.box.w / 2 : S.box.x
}

function drawRule(ctx, S, y, width = S.box.w) {
  const { theme, pal, box } = S
  if (theme.rule === 'none') return
  const x0 = theme.align === 'center' ? box.x + (box.w - width) / 2 : box.x
  const x1 = x0 + width
  if (theme.rule === 'dots') {
    P.dottedLine(ctx, x0, y, x1, pal.line)
    return
  }
  P.line(ctx, x0, y, x1, y, pal.line, 2)
  if (theme.rule === 'double') P.line(ctx, x0, y + 9, x1, y + 9, pal.line, 1)
}

/** Big type gets the theme's one trick — a glow, a drop shadow, a misregister. */
function emphasise(ctx, S, draw) {
  if (S.theme.emphasis) S.theme.emphasis(ctx, S, draw)
  else draw()
}

/* ----------------------------------------------------------------- one gig */

function drawHero(ctx, S, card, spec) {
  const { box, pal, theme } = S
  const x = anchor(S)
  const align = theme.align
  const body = font(theme.body)
  const display = font(theme.display)

  if (!card) {
    const empty = P.fitLines(ctx, 'Nothing booked', {
      family: display,
      weight: theme.displayWeight,
      maxWidth: box.w,
      maxLines: 2,
      max: 84,
      tracking: theme.displayTracking,
    })
    ctx.fillStyle = pal.ink2
    P.drawLines(ctx, empty, x, box.y + (box.h - empty.height) / 2, align)
    return
  }

  /**
   * Every size and gap below is the smaller of what the layout wants and a share
   * of the box it actually got. A photo style hands the words half a poster
   * instead of a whole one, and without this the fixed sizes stay fixed, the
   * middle collapses, and the band name is drawn straight through the date.
   * At full height the caps win and nothing about the typographic styles moves.
   */
  const room = (wanted, share) => Math.min(wanted, box.h * share)

  /* Top down: the kicker. */
  let top = box.y
  const kicker = upper(spec.kicker)
  if (kicker) {
    const block = P.fitOneLine(ctx, kicker, {
      family: body,
      weight: 700,
      maxWidth: box.w,
      max: room(46, 0.055),
      min: 18,
      tracking: 0.28,
    })
    ctx.fillStyle = pal[theme.kickerInk] || pal.accent
    P.drawLines(ctx, block, x, top, align)
    top += block.height + room(50, 0.05)
  }

  /* Bottom up: footer, time, date, rule. Pinning these to the bottom edge is
     what keeps the poster from drifting when the band name is short. */
  let bottom = box.bottom
  const footer = text(spec.footer)
  if (footer) {
    const block = P.fitOneLine(ctx, footer, {
      family: body,
      weight: 600,
      maxWidth: box.w,
      max: room(34, 0.045),
      min: 15,
      tracking: 0.16,
    })
    ctx.fillStyle = pal.ink2
    P.drawLines(ctx, block, x, bottom - block.height, align)
    bottom -= block.height + room(62, 0.055)
  }

  if (card.time) {
    const block = P.fitOneLine(ctx, upper(card.time), {
      family: body,
      weight: theme.bodyWeight,
      maxWidth: box.w,
      max: room(52, 0.06),
      min: 20,
      tracking: 0.1,
    })
    bottom -= block.height
    ctx.fillStyle = pal.ink2
    P.drawLines(ctx, block, x, bottom, align)
    bottom -= room(26, 0.03)
  }

  const date = P.fitLines(ctx, caps(theme, card.dateLine), {
    family: display,
    weight: theme.displayWeight,
    maxWidth: box.w,
    maxLines: 2,
    max: room(94, 0.11),
    min: 26,
    tracking: 0.04,
    lineHeight: 1.12,
  })
  bottom -= date.height
  ctx.fillStyle = pal[theme.dateInk] || pal.accent
  P.drawLines(ctx, date, x, bottom, align)
  bottom -= room(46, 0.05)

  drawRule(ctx, S, bottom, Math.min(box.w, 420))
  bottom -= room(56, 0.06)

  /* Whatever is left in the middle belongs to the act and the venue. */
  const middle = Math.max(bottom - top, 120)
  const gap = room(54, 0.06)
  let venue = card.venue
    ? P.fitLines(ctx, card.venue, {
        family: body,
        weight: theme.bodyWeight,
        maxWidth: box.w,
        maxLines: 2,
        max: room(66, 0.075),
        min: 22,
        tracking: 0.02,
        lineHeight: 1.16,
      })
    : null
  let detail = card.venueDetail
    ? P.fitOneLine(ctx, upper(card.venueDetail), {
        family: body,
        weight: 500,
        maxWidth: box.w,
        max: room(34, 0.04),
        min: 14,
        tracking: 0.14,
      })
    : null

  const measure = () => (venue?.height || 0) + (detail ? detail.height + 14 : 0)
  // Shed the optional lines rather than let the name be crushed. The town is the
  // first thing a poster can live without; the venue is the second.
  if (detail && middle - measure() - gap < 150) detail = null
  if (venue && middle - measure() - gap < 110) venue = null

  const venueHeight = measure()
  const act = P.fitLines(ctx, caps(theme, card.act), {
    family: display,
    weight: theme.displayWeight,
    maxWidth: box.w,
    maxHeight: Math.max(middle - venueHeight - (venueHeight ? gap : 0), 60),
    maxLines: 3,
    max: 210,
    min: 26,
    tracking: theme.displayTracking,
    lineHeight: 0.98,
  })

  const total = act.height + (venueHeight ? venueHeight + gap : 0)
  let y = top + Math.max((middle - total) / 2, 0)

  ctx.fillStyle = pal[theme.actInk] || pal.ink
  emphasise(ctx, S, () => P.drawLines(ctx, act, x, y, align))
  y += act.height

  if (venueHeight) {
    y += gap
    if (venue) {
      ctx.fillStyle = pal.ink
      P.drawLines(ctx, venue, x, y, align)
      y += venue.height
    }
    if (detail) {
      y += 14
      ctx.fillStyle = pal.ink2
      P.drawLines(ctx, detail, x, y, align)
    }
  }
}

/* ------------------------------------------------------------------- a run */

function drawRow(ctx, S, card, rect, divider) {
  const { pal, theme } = S
  const body = font(theme.body)
  const display = font(theme.display)

  const pad = Math.min(rect.h * 0.1, 18)
  const innerY = rect.y + pad
  const innerH = Math.max(rect.h - pad * 2, 40)

  /* The date, as a chip, so the eye can run down the left edge and find a night. */
  const chipW = Math.min(Math.max(rect.h * 0.82, 92), 158)
  if (theme.chip === 'solid') {
    P.fillRound(ctx, rect.x, innerY, chipW, innerH, theme.radius, pal.accent)
  } else if (theme.chip === 'outline') {
    P.strokeRound(ctx, rect.x, innerY, chipW, innerH, theme.radius, pal.line, 2)
  }

  const onChip = theme.chip === 'solid' ? pal.accentInk : pal.ink
  const weekday = P.fitOneLine(ctx, upper(card.weekdayShort), {
    family: body,
    weight: 700,
    maxWidth: chipW - 18,
    max: innerH * 0.24,
    min: 11,
    tracking: 0.14,
  })
  const day = P.fitOneLine(ctx, card.day, {
    family: display,
    weight: theme.displayWeight,
    maxWidth: chipW - 18,
    max: innerH * 0.54,
    min: 18,
  })
  const gap = innerH * 0.05
  let cy = innerY + (innerH - (weekday.height + day.height + gap)) / 2
  ctx.fillStyle = onChip
  P.drawLines(ctx, weekday, rect.x + chipW / 2, cy, 'center')
  cy += weekday.height + gap
  ctx.fillStyle = theme.chip === 'solid' ? pal.accentInk : pal.accent
  P.drawLines(ctx, day, rect.x + chipW / 2, cy, 'center')

  /* The act, and one line of everything else. */
  const tx = rect.x + chipW + Math.max(rect.h * 0.16, 22)
  const tw = Math.max(rect.x + rect.w - tx, 80)
  const act = P.fitOneLine(ctx, caps(theme, card.act), {
    family: display,
    weight: theme.displayWeight,
    maxWidth: tw,
    max: Math.min(innerH * 0.46, 64),
    min: 20,
    tracking: theme.displayTracking,
  })
  const metaText = [card.venue, card.time].filter(Boolean).join(' · ')
  const meta = metaText
    ? P.fitOneLine(ctx, metaText, {
        family: body,
        weight: theme.bodyWeight,
        maxWidth: tw,
        max: Math.min(innerH * 0.27, 36),
        min: 14,
      })
    : null

  const stack = act.height + (meta ? meta.height + innerH * 0.08 : 0)
  let ty = innerY + (innerH - stack) / 2
  ctx.fillStyle = pal.ink
  P.drawLines(ctx, act, tx, ty, 'left')
  if (meta) {
    ty += act.height + innerH * 0.08
    ctx.fillStyle = pal.ink2
    P.drawLines(ctx, meta, tx, ty, 'left')
  }

  if (divider && theme.rule !== 'none') {
    const y = rect.y + rect.h
    if (theme.rule === 'dots') P.dottedLine(ctx, rect.x, y, rect.x + rect.w, pal.line, 4, 15)
    else P.line(ctx, rect.x, y, rect.x + rect.w, y, pal.line, 1)
  }
}

function drawList(ctx, S, cards, spec) {
  const { box, pal, theme } = S
  const x = anchor(S)
  const align = theme.align
  const body = font(theme.body)
  const display = font(theme.display)

  // Same bargain as the hero: a photo style leaves less room, so the heading is
  // the smaller of what it wants and a share of what it was given.
  const room = (wanted, share) => Math.min(wanted, box.h * share)

  let top = box.y
  const heading = text(spec.heading)
  if (heading) {
    const block = P.fitLines(ctx, caps(theme, heading), {
      family: display,
      weight: theme.displayWeight,
      maxWidth: box.w,
      maxLines: 2,
      max: room(150, 0.2),
      min: 34,
      tracking: theme.displayTracking,
      lineHeight: 0.98,
    })
    ctx.fillStyle = pal[theme.headInk] || pal.ink
    emphasise(ctx, S, () => P.drawLines(ctx, block, x, top, align))
    top += block.height + 20
  }

  const sub = upper(spec.subheading)
  if (sub) {
    const block = P.fitOneLine(ctx, sub, {
      family: body,
      weight: 700,
      maxWidth: box.w,
      max: room(38, 0.05),
      min: 15,
      tracking: 0.24,
    })
    ctx.fillStyle = pal[theme.kickerInk] || pal.accent
    P.drawLines(ctx, block, x, top, align)
    top += block.height + room(16, 0.02)
  }

  top += room(26, 0.03)
  drawRule(ctx, S, top)
  top += room(34, 0.04)

  let bottom = box.bottom
  const footer = text(spec.footer)
  if (footer) {
    const block = P.fitOneLine(ctx, footer, {
      family: body,
      weight: 600,
      maxWidth: box.w,
      max: 32,
      min: 16,
      tracking: 0.16,
    })
    ctx.fillStyle = pal.ink2
    P.drawLines(ctx, block, x, bottom - block.height, align)
    bottom -= block.height + 36
  }

  /* Rows get whatever is left, down to a floor below which two lines of type
     stop being readable — past that the overflow is admitted rather than
     squeezed, because "+3 more" is honest and a wall of 40px rows is not. */
  const areaH = Math.max(bottom - top, 220)
  const maxRows = Math.max(2, Math.floor(areaH / 100))
  const shown = Math.min(cards.length, maxRows)
  const hidden = cards.length - shown
  const usable = areaH - (hidden > 0 ? 58 : 0)
  const rowH = Math.min(usable / shown, 232)
  const startY = top + Math.max((usable - rowH * shown) / 2, 0)

  for (let i = 0; i < shown; i += 1) {
    drawRow(
      ctx,
      S,
      cards[i],
      { x: box.x, y: startY + rowH * i, w: box.w, h: rowH },
      i < shown - 1
    )
  }

  if (hidden > 0) {
    const block = P.fitOneLine(ctx, `+ ${hidden} more`, {
      family: body,
      weight: 700,
      maxWidth: box.w,
      max: 32,
      min: 16,
      tracking: 0.18,
    })
    ctx.fillStyle = pal.ink2
    P.drawLines(ctx, block, x, startY + rowH * shown + 16, align)
  }
}

/* ----------------------------------------------------------------- the job */

/**
 * Paint one poster into a canvas. `scale` below 1 gives the picker its
 * thumbnails: the transform shrinks the drawing but not `measureText`, so a
 * thumbnail runs the same layout maths as the export and is a true miniature of
 * it rather than an approximation that flatters.
 */
export function renderPoster(canvas, spec, scale = 1) {
  const size = sizeById(spec.size)
  const theme = templateById(spec.template)
  const cards = spec.cards || []

  canvas.width = Math.max(Math.round(size.w * scale), 1)
  canvas.height = Math.max(Math.round(size.h * scale), 1)

  const ctx = canvas.getContext('2d')
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.textBaseline = 'alphabetic'

  const S = {
    w: size.w,
    h: size.h,
    theme,
    pal: theme.pal,
    pad: size.pad,
    /** Which layout is about to run. A photo style needs to know: one gig can
        sit over a full-bleed picture, nine rows of dates cannot. */
    mode: cards.length > 1 ? 'list' : 'hero',
    photo: spec.photo || null,
    focus: typeof spec.focus === 'number' ? spec.focus : 0.5,
    rng: P.seeded(`${theme.id}|${size.id}`),
    /** The whole safe area. What a theme leaves of it is `box`. */
    full: {
      x: size.pad.side,
      y: size.pad.top,
      w: size.w - size.pad.side * 2,
      h: size.h - size.pad.top - size.pad.bottom,
    },
  }
  // A theme that puts a picture somewhere has to say where the words may go;
  // everything else gets the safe area untouched.
  S.box = { ...S.full, ...(theme.boxFor ? theme.boxFor(S) : null) }
  S.box.right = S.box.x + S.box.w
  S.box.bottom = S.box.y + S.box.h

  theme.paint(ctx, S)
  if (S.mode === 'list') drawList(ctx, S, cards, spec)
  else drawHero(ctx, S, cards[0], spec)
  if (theme.grain) P.grain(ctx, S, theme.grain)

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  return canvas
}

export function toPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The image could not be created.'))),
      'image/png'
    )
  })
}
