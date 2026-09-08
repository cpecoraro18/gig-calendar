/**
 * Calendar colours are chosen for a white calendar, so they arrive far too
 * bright to sit behind text on a dark one. Everything here is about borrowing
 * the hue without the glare.
 */

/** '#9fe1e7' or '#9ee' → [r, g, b]. Anything unrecognised comes back grey. */
function rgb(hex) {
  const text = String(hex || '').trim().replace('#', '')
  const full =
    text.length === 3
      ? text
          .split('')
          .map((c) => c + c)
          .join('')
      : text
  if (!/^[0-9a-f]{6}$/i.test(full)) return [127, 139, 153]
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
}

/** The calendar's colour as a wash behind a chip, rather than a solid block. */
export function tint(hex, alpha = 0.24) {
  const [r, g, b] = rgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * The same hue, lifted to something legible on a dark background. Google's
 * darker calendar colours (a deep blue, a maroon) are unreadable as text at
 * their stated value, so anything below the threshold gets mixed with white
 * until it clears it.
 */
export function readable(hex) {
  const [r, g, b] = rgb(hex)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  if (luminance >= 0.55) return `rgb(${r}, ${g}, ${b})`
  const lift = (channel) => Math.round(channel + (255 - channel) * (0.55 - luminance))
  return `rgb(${lift(r)}, ${lift(g)}, ${lift(b)})`
}
