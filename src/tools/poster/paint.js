/**
 * The drawing kit the poster templates are built from.
 *
 * Everything here works in poster coordinates — 1080 across, whatever the
 * chosen height — and the canvas is scaled before any of it runs. That is what
 * lets one set of templates paint both a full-size export and the thumbnails in
 * the picker strip: `measureText` ignores the transform, so the layout maths
 * comes out identical and a thumbnail is a true miniature rather than a
 * separate, simpler drawing that lies about what you are about to get.
 */

/* -------------------------------------------------------------------- random */

/**
 * A seeded PRNG. Grain, confetti and torn edges have to land in the same place
 * every redraw, or the preview crawls with static while you type.
 */
export function seeded(seed) {
  let a = 0x9e3779b9
  for (let i = 0; i < seed.length; i += 1) a = (Math.imul(a, 31) + seed.charCodeAt(i)) | 0
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* --------------------------------------------------------------------- fonts */

let probe = null
const known = new Map()

function probeWidth(text, font) {
  if (!probe) probe = document.createElement('canvas').getContext('2d')
  probe.font = font
  return probe.measureText(text).width
}

/**
 * Is this family actually installed? Measured against two very different
 * fallbacks, because a missing family silently becomes the fallback — and a
 * template that thinks it is setting Didot while the phone quietly draws
 * Helvetica is how every poster ends up looking the same.
 */
export function hasFont(family) {
  if (known.has(family)) return known.get(family)
  const sample = 'WMmiil1@%&gjq'
  const found = ['monospace', 'serif'].some(
    (base) => probeWidth(sample, `72px ${base}`) !== probeWidth(sample, `72px "${family}", ${base}`)
  )
  known.set(family, found)
  return found
}

/** The first installed family from the list, else the stack's own fallback. */
export function pickFamily(candidates, fallback) {
  for (const family of candidates) if (hasFont(family)) return `"${family}", ${fallback}`
  return fallback
}

/* ---------------------------------------------------------------------- text */

export function setFont(ctx, { size, family, weight = 400, italic = false }) {
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${Math.max(size, 1)}px ${family}`
}

export function textWidth(ctx, text, tracking = 0) {
  const glyphs = [...text].length
  return ctx.measureText(text).width + tracking * Math.max(glyphs - 1, 0)
}

/**
 * fillText with optional letter-spacing, drawn a glyph at a time. `ctx.letterSpacing`
 * exists now but not on every phone this runs on, and tracking is most of what
 * makes the all-caps templates look set rather than typed.
 */
export function drawText(ctx, text, x, y, { align = 'left', tracking = 0 } = {}) {
  if (!tracking) {
    ctx.textAlign = align
    ctx.fillText(text, x, y)
    return
  }
  ctx.textAlign = 'left'
  const total = textWidth(ctx, text, tracking)
  let cursor = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x
  for (const glyph of text) {
    ctx.fillText(glyph, cursor, y)
    cursor += ctx.measureText(glyph).width + tracking
  }
}

export function wrap(ctx, text, maxWidth, tracking = 0) {
  const words = String(text ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    // A single word wider than the box still takes the line on its own: the
    // fitting loop shrinks the type until it stops overflowing.
    if (!line || textWidth(ctx, next, tracking) <= maxWidth) line = next
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

/**
 * The largest size at which the text wraps inside the box. Type that fills the
 * space it is given is most of the difference between a poster and a screenshot,
 * and it is the only way one layout survives both "Chris" and a six-word band name.
 */
export function fitLines(ctx, text, options) {
  const {
    family,
    weight = 400,
    italic = false,
    maxWidth,
    maxHeight = Infinity,
    maxLines = 3,
    max = 200,
    min = 16,
    lineHeight = 1.05,
    tracking = 0,
  } = options
  let size = max
  let lines = ['']
  for (;;) {
    setFont(ctx, { size, family, weight, italic })
    const space = tracking * size
    lines = wrap(ctx, text, maxWidth, space)
    const widest = Math.max(...lines.map((line) => textWidth(ctx, line, space)))
    const height = lines.length * size * lineHeight
    const fits = lines.length <= maxLines && widest <= maxWidth && height <= maxHeight
    if (fits || size <= min) break
    size = Math.max(min, Math.floor(size * 0.94))
  }
  setFont(ctx, { size, family, weight, italic })
  return {
    size,
    lines,
    family,
    weight,
    italic,
    tracking: tracking * size,
    lineHeight,
    height: lines.length * size * lineHeight,
  }
}

/**
 * Draws what `fitLines` measured, with `y` as the top of the block rather than a
 * baseline — every layout here stacks blocks, and tops are what stack.
 */
export function drawLines(ctx, block, x, y, align = 'left') {
  setFont(ctx, block)
  ctx.textBaseline = 'alphabetic'
  const step = block.size * block.lineHeight
  block.lines.forEach((line, i) => {
    drawText(ctx, line, x, y + step * i + block.size * 0.8, { align, tracking: block.tracking })
  })
}

export function ellipsize(ctx, text, maxWidth, tracking = 0) {
  const full = String(text ?? '')
  if (textWidth(ctx, full, tracking) <= maxWidth) return full
  let cut = full
  while (cut.length > 1 && textWidth(ctx, `${cut}…`, tracking) > maxWidth) cut = cut.slice(0, -1)
  return `${cut.trimEnd()}…`
}

/** One line, shrunk rather than wrapped, then clipped if it still will not go. */
export function fitOneLine(ctx, text, options) {
  const block = fitLines(ctx, text, { ...options, maxLines: 1, lineHeight: 1 })
  if (block.lines.length > 1) {
    setFont(ctx, block)
    block.lines = [ellipsize(ctx, text, options.maxWidth, block.tracking)]
    block.height = block.size
  }
  return block
}

/* -------------------------------------------------------------------- colour */

/** `#rgb` or `#rrggbb` at an alpha — the templates tint their own palettes a lot. */
export function alpha(hex, a) {
  const raw = String(hex).replace('#', '')
  const full = raw.length === 3 ? [...raw].map((c) => c + c).join('') : raw.padEnd(6, '0').slice(0, 6)
  const n = parseInt(full, 16) || 0
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

export function linear(ctx, x0, y0, x1, y1, stops) {
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1)
  for (const [at, color] of stops) gradient.addColorStop(at, color)
  return gradient
}

export function radial(ctx, x, y, r, stops) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(r, 1))
  for (const [at, color] of stops) gradient.addColorStop(at, color)
  return gradient
}

/* -------------------------------------------------------------------- shapes */

export function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.max(Math.min(r, w / 2, h / 2), 0)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

export function fillRound(ctx, x, y, w, h, r, style) {
  ctx.fillStyle = style
  roundRect(ctx, x, y, w, h, r)
  ctx.fill()
}

export function strokeRound(ctx, x, y, w, h, r, style, width = 2) {
  ctx.strokeStyle = style
  ctx.lineWidth = width
  roundRect(ctx, x, y, w, h, r)
  ctx.stroke()
}

export function line(ctx, x0, y0, x1, y1, style, width = 2) {
  ctx.strokeStyle = style
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
}

export function dottedLine(ctx, x0, y, x1, style, dot = 6, gap = 18) {
  ctx.fillStyle = style
  for (let x = x0; x <= x1; x += gap) {
    ctx.beginPath()
    ctx.arc(x, y, dot / 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

/* -------------------------------------------------------------------- photos */

/**
 * Fill a rect with an image, cropping whatever doesn't fit rather than squashing
 * it. `focus` decides what survives the crop — 0 keeps the top of the frame, 1
 * the bottom — because a phone photo cropped to 9:16 takes someone's head off
 * about half the time, and which half is a judgement only the user can make.
 */
export function cover(ctx, img, rect, focus = 0.5) {
  const scale = Math.max(rect.w / img.width, rect.h / img.height)
  const w = img.width * scale
  const h = img.height * scale
  ctx.drawImage(img, rect.x + (rect.w - w) / 2, rect.y + (rect.h - h) * focus, w, h)
}

/**
 * The photo, or something deliberate in its place. A photo style has to read in
 * the picker before there is a photo, or half the strip is grey rectangles.
 */
export function photoFill(ctx, S, rect, { radius = 0, fade = 1, ground } = {}) {
  ctx.save()
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, radius)
  ctx.clip()
  if (S.photo) {
    ctx.globalAlpha = fade
    cover(ctx, S.photo, rect, S.focus)
  } else {
    const stops = ground || [
      [0, alpha(S.pal.accent, 0.5)],
      [1, alpha(S.pal.ink2, 0.25)],
    ]
    ctx.fillStyle = linear(ctx, rect.x, rect.y, rect.x + rect.w, rect.y + rect.h, stops)
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
    // A diagonal, so an empty photo well reads as a place for one rather than
    // as a colour the designer chose.
    ctx.globalAlpha = 0.16
    ctx.strokeStyle = S.pal.ink
    ctx.lineWidth = Math.max(rect.w, rect.h) * 0.02
    ctx.beginPath()
    ctx.moveTo(rect.x, rect.y + rect.h)
    ctx.lineTo(rect.x + rect.w, rect.y)
    ctx.stroke()
  }
  ctx.restore()
}

/**
 * Two-colour photography: desaturate, push the highlights toward `light` and
 * lift the blacks toward `dark`. Applied over whatever is already in the rect,
 * so the caller draws the photo first.
 */
export function duotone(ctx, rect, dark, light, radius = 0) {
  ctx.save()
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, radius)
  ctx.clip()
  for (const [mode, color] of [
    ['saturation', '#808080'],
    ['multiply', light],
    ['screen', dark],
  ]) {
    ctx.globalCompositeOperation = mode
    ctx.fillStyle = color
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
  }
  ctx.restore()
}

/**
 * The gradient between a photograph and legible text. Without one, white type
 * over a bright sky is simply gone.
 */
export function scrim(ctx, rect, stops, horizontal = false) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(rect.x, rect.y, rect.w, rect.h)
  ctx.clip()
  ctx.fillStyle = horizontal
    ? linear(ctx, rect.x, rect.y, rect.x + rect.w, rect.y, stops)
    : linear(ctx, rect.x, rect.y, rect.x, rect.y + rect.h, stops)
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
  ctx.restore()
}

/** The perforated edges of 35mm film, top and bottom of a frame. */
export function filmEdge(ctx, rect, color) {
  ctx.save()
  ctx.fillStyle = color
  const pitch = 46
  for (let x = rect.x + 8; x < rect.x + rect.w - 24; x += pitch) {
    ctx.fillRect(x, rect.y + 12, 26, 20)
    ctx.fillRect(x, rect.y + rect.h - 32, 26, 20)
  }
  ctx.restore()
}

/* ----------------------------------------------------------------- ornaments */

let grainTile = null

/**
 * Film grain from a repeating tile rather than per-pixel noise: two million
 * random pixels per redraw is the one thing here slow enough to feel.
 */
export function grain(ctx, S, amount = 0.06) {
  if (!grainTile) {
    const tile = document.createElement('canvas')
    tile.width = 128
    tile.height = 128
    const tileCtx = tile.getContext('2d')
    const image = tileCtx.createImageData(128, 128)
    for (let i = 0; i < image.data.length; i += 4) {
      const value = 110 + Math.random() * 145
      image.data[i] = value
      image.data[i + 1] = value
      image.data[i + 2] = value
      image.data[i + 3] = 255
    }
    tileCtx.putImageData(image, 0, 0)
    grainTile = tile
  }
  ctx.save()
  ctx.globalAlpha = amount
  ctx.globalCompositeOperation = 'overlay'
  ctx.fillStyle = ctx.createPattern(grainTile, 'repeat')
  ctx.fillRect(0, 0, S.w, S.h)
  ctx.restore()
}

export function scanlines(ctx, S, { step = 6, color = '#000', amount = 0.16 } = {}) {
  ctx.save()
  ctx.globalAlpha = amount
  ctx.fillStyle = color
  for (let y = 0; y < S.h; y += step) ctx.fillRect(0, y, S.w, step / 2)
  ctx.restore()
}

export function gridLines(ctx, S, { step = 60, color = '#ffffff', amount = 0.12, width = 1 } = {}) {
  ctx.save()
  ctx.globalAlpha = amount
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  for (let x = 0; x <= S.w; x += step) {
    ctx.moveTo(x, 0)
    ctx.lineTo(x, S.h)
  }
  for (let y = 0; y <= S.h; y += step) {
    ctx.moveTo(0, y)
    ctx.lineTo(S.w, y)
  }
  ctx.stroke()
  ctx.restore()
}

export function stripes(ctx, S, { angle = -0.4, step = 46, color = '#ffffff', amount = 0.06 } = {}) {
  ctx.save()
  ctx.globalAlpha = amount
  ctx.fillStyle = color
  ctx.translate(S.w / 2, S.h / 2)
  ctx.rotate(angle)
  const reach = S.w + S.h
  for (let x = -reach; x < reach; x += step) ctx.fillRect(x, -reach, step / 2, reach * 2)
  ctx.restore()
}

const dotTiles = new Map()

/**
 * Halftone, from a one-dot tile. Drawn honestly, the photocopy look is 25,000
 * separate arcs across a 1080×1920 field — fine once, ruinous seventeen times
 * over every time the style strip redraws.
 */
export function dots(ctx, S, { step = 44, r = 3, color = '#ffffff', amount = 0.16 } = {}) {
  const side = Math.max(Math.round(step), 2)
  const key = `${side}|${r}|${color}`
  let tile = dotTiles.get(key)
  if (!tile) {
    tile = document.createElement('canvas')
    tile.width = side
    tile.height = side
    const tileCtx = tile.getContext('2d')
    tileCtx.fillStyle = color
    tileCtx.beginPath()
    tileCtx.arc(side / 2, side / 2, r, 0, Math.PI * 2)
    tileCtx.fill()
    dotTiles.set(key, tile)
  }
  ctx.save()
  ctx.globalAlpha = amount
  ctx.fillStyle = ctx.createPattern(tile, 'repeat')
  ctx.fillRect(0, 0, S.w, S.h)
  ctx.restore()
}

/** A soft colour cloud — the base of every gradient-mesh background here. */
export function blob(ctx, x, y, r, color, amount = 0.55) {
  ctx.save()
  ctx.globalAlpha = amount
  ctx.fillStyle = radial(ctx, x, y, r, [
    [0, color],
    [1, alpha(color, 0)],
  ])
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
  ctx.restore()
}

export function rays(ctx, cx, cy, { count = 24, length = 2200, color = '#ffffff', amount = 0.08 } = {}) {
  ctx.save()
  ctx.globalAlpha = amount
  ctx.fillStyle = color
  ctx.translate(cx, cy)
  const wedge = Math.PI / count
  for (let i = 0; i < count; i += 1) {
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, length, i * wedge * 2, i * wedge * 2 + wedge)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

/** The bulb border of a theatre marquee. */
export function bulbs(ctx, rect, { spacing = 58, r = 7, color = '#ffd76e', glow = 18 } = {}) {
  const { x, y, w, h } = rect
  const points = []
  const across = Math.max(Math.round(w / spacing), 2)
  const down = Math.max(Math.round(h / spacing), 2)
  for (let i = 0; i <= across; i += 1) {
    points.push([x + (w * i) / across, y], [x + (w * i) / across, y + h])
  }
  for (let i = 1; i < down; i += 1) {
    points.push([x, y + (h * i) / down], [x + w, y + (h * i) / down])
  }
  ctx.save()
  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = glow
  for (const [px, py] of points) {
    ctx.beginPath()
    ctx.arc(px, py, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/** The punched edge of a torn-off ticket. */
export function notches(ctx, S, { y, r = 26, color }) {
  ctx.fillStyle = color
  for (const cx of [0, S.w]) {
    ctx.beginPath()
    ctx.arc(cx, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** A hard offset shadow behind whatever the callback draws — it reads as print. */
export function withOffset(ctx, dx, dy, color, draw) {
  ctx.save()
  ctx.fillStyle = color
  ctx.translate(dx, dy)
  draw()
  ctx.restore()
  draw()
}

/** A neon halo. Drawn twice under the final pass, because once is never bright enough. */
export function withGlow(ctx, color, blur, draw) {
  ctx.save()
  ctx.shadowColor = color
  ctx.shadowBlur = blur
  draw()
  draw()
  ctx.restore()
  draw()
}
