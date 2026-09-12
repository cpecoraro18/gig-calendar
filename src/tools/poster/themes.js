/**
 * The looks.
 *
 * A template here is a theme, not a layout: colours, type, a background painter
 * and a few switches the two layout engines in `render.js` read. Splitting it
 * that way is what makes sixteen of them affordable — the hard part, fitting a
 * band name and five dates into a fixed rectangle, is written and debugged once,
 * and a new look is a palette and a dozen lines of background.
 *
 * Every theme has to survive both jobs: one gig blown up across the whole poster,
 * and nine gigs in a list. A look that only works as a hero is a look you can
 * only post once a month.
 */
import * as P from './paint.js'

/**
 * Web fonts would mean a network request inside a PWA that is meant to work in a
 * venue basement, so these are all families that ship with a phone or a laptop —
 * probed at runtime, first hit wins, and the generic at the end is a real design
 * choice rather than a shrug.
 */
const STACKS = {
  grotesk: [['Avenir Next', 'Helvetica Neue', 'Segoe UI', 'Roboto'], 'system-ui, sans-serif'],
  black: [['Arial Black', 'Helvetica Neue', 'Segoe UI', 'Roboto'], 'system-ui, sans-serif'],
  condensed: [
    ['Avenir Next Condensed', 'Haettenschweiler', 'Impact', 'Arial Narrow', 'Roboto Condensed'],
    'system-ui, sans-serif',
  ],
  impact: [['Impact', 'Haettenschweiler', 'Arial Black', 'Helvetica Neue'], 'system-ui, sans-serif'],
  serif: [['Georgia', 'Palatino', 'Times New Roman'], 'serif'],
  didone: [['Didot', 'Bodoni 72', 'Baskerville', 'Georgia'], 'serif'],
  slab: [['Rockwell', 'Courier New', 'Georgia'], 'serif'],
  mono: [['SFMono-Regular', 'Menlo', 'Consolas', 'Courier New'], 'ui-monospace, monospace'],
  rounded: [['SF Pro Rounded', 'Varela Round', 'Trebuchet MS', 'Verdana'], 'system-ui, sans-serif'],
  humanist: [['Optima', 'Gill Sans', 'Trebuchet MS', 'Segoe UI'], 'system-ui, sans-serif'],
}

const resolved = {}

/** Probing costs a canvas measurement, so each stack is settled once per session. */
export function font(key) {
  if (!resolved[key]) {
    const [candidates, fallback] = STACKS[key] || STACKS.grotesk
    resolved[key] = P.pickFamily(candidates, fallback)
  }
  return resolved[key]
}

/* ------------------------------------------------------------------- themes */

/**
 * Shared defaults. A theme only writes down what makes it itself, which keeps
 * the differences between them readable at a glance.
 */
const BASE = {
  display: 'grotesk',
  displayWeight: 800,
  displayCaps: true,
  displayTracking: 0,
  body: 'grotesk',
  bodyWeight: 600,
  align: 'center',
  rule: 'line',
  chip: 'solid',
  grain: 0,
  actInk: 'ink',
  dateInk: 'accent',
  kickerInk: 'accent',
  headInk: 'ink',
  radius: 14,
}

const THEMES = [
  {
    id: 'midnight',
    name: 'Midnight',
    pal: {
      bg: '#0a0e14',
      ink: '#f4f8fc',
      ink2: '#8fa3b8',
      accent: '#f0b429',
      accentInk: '#1a1204',
      line: 'rgba(255,255,255,0.16)',
      panel: 'rgba(255,255,255,0.05)',
    },
    displayTracking: -0.01,
    paint(ctx, S) {
      ctx.fillStyle = P.linear(ctx, 0, 0, 0, S.h, [
        [0, '#141c28'],
        [0.55, '#0a0e14'],
        [1, '#05080c'],
      ])
      ctx.fillRect(0, 0, S.w, S.h)
      P.blob(ctx, S.w * 0.78, S.h * 0.12, S.w * 0.7, '#f0b429', 0.16)
      P.strokeRound(ctx, 44, 44, S.w - 88, S.h - 88, 0, 'rgba(255,255,255,0.13)', 2)
    },
  },
  {
    id: 'neon',
    name: 'Neon',
    pal: {
      bg: '#07060f',
      ink: '#ffffff',
      ink2: '#9d8ad6',
      accent: '#43e8ff',
      accentInk: '#05141a',
      line: 'rgba(255,86,205,0.55)',
      panel: 'rgba(120,60,200,0.16)',
    },
    displayTracking: 0.01,
    actInk: 'ink',
    kickerInk: 'hot',
    paint(ctx, S) {
      ctx.fillStyle = '#07060f'
      ctx.fillRect(0, 0, S.w, S.h)
      P.blob(ctx, S.w * 0.2, S.h * 0.18, S.w * 0.85, '#ff56cd', 0.3)
      P.blob(ctx, S.w * 0.85, S.h * 0.82, S.w * 0.8, '#43e8ff', 0.26)
      P.gridLines(ctx, S, { step: 108, color: '#8a7bff', amount: 0.1 })
      P.strokeRound(ctx, 40, 40, S.w - 80, S.h - 80, 26, 'rgba(255,86,205,0.5)', 3)
    },
    emphasis(ctx, S, draw) {
      P.withGlow(ctx, '#ff56cd', 42, draw)
    },
  },
  {
    id: 'letterpress',
    name: 'Letterpress',
    pal: {
      bg: '#f3ead7',
      ink: '#1b1713',
      ink2: '#6d6256',
      accent: '#a8322a',
      accentInk: '#f3ead7',
      line: 'rgba(27,23,19,0.35)',
      panel: 'rgba(27,23,19,0.06)',
    },
    display: 'didone',
    displayWeight: 700,
    body: 'serif',
    bodyWeight: 600,
    rule: 'double',
    chip: 'outline',
    grain: 0.14,
    paint(ctx, S) {
      ctx.fillStyle = '#f3ead7'
      ctx.fillRect(0, 0, S.w, S.h)
      P.blob(ctx, S.w * 0.5, S.h * 0.4, S.w * 0.95, '#d8c9a8', 0.5)
      ctx.strokeStyle = 'rgba(27,23,19,0.5)'
      ctx.lineWidth = 5
      ctx.strokeRect(46, 46, S.w - 92, S.h - 92)
      ctx.lineWidth = 1.5
      ctx.strokeRect(62, 62, S.w - 124, S.h - 124)
    },
  },
  {
    id: 'marquee',
    name: 'Marquee',
    pal: {
      bg: '#120c06',
      ink: '#ffe9b8',
      ink2: '#b79a68',
      accent: '#ffcc4d',
      accentInk: '#221603',
      line: 'rgba(255,204,77,0.4)',
      panel: 'rgba(255,204,77,0.08)',
    },
    display: 'serif',
    displayWeight: 700,
    displayTracking: 0.02,
    chip: 'outline',
    paint(ctx, S) {
      ctx.fillStyle = P.linear(ctx, 0, 0, 0, S.h, [
        [0, '#1d1206'],
        [1, '#0c0803'],
      ])
      ctx.fillRect(0, 0, S.w, S.h)
      P.blob(ctx, S.w * 0.5, S.h * 0.5, S.w * 0.8, '#ffcc4d', 0.1)
      const inset = { x: 56, y: 56, w: S.w - 112, h: S.h - 112 }
      ctx.strokeStyle = 'rgba(255,204,77,0.35)'
      ctx.lineWidth = 3
      ctx.strokeRect(inset.x, inset.y, inset.w, inset.h)
      P.bulbs(ctx, inset, { spacing: 64, r: 8, color: '#ffd76e', glow: 22 })
    },
  },
  {
    id: 'ticket',
    name: 'Ticket',
    pal: {
      bg: '#e8d9b5',
      ink: '#231a10',
      ink2: '#6b5a42',
      accent: '#b8461e',
      accentInk: '#f6efdd',
      line: 'rgba(35,26,16,0.4)',
      panel: 'rgba(35,26,16,0.07)',
    },
    display: 'condensed',
    displayWeight: 800,
    body: 'mono',
    bodyWeight: 600,
    align: 'left',
    rule: 'dots',
    chip: 'outline',
    grain: 0.12,
    paint(ctx, S) {
      ctx.fillStyle = '#e8d9b5'
      ctx.fillRect(0, 0, S.w, S.h)
      P.stripes(ctx, S, { angle: 0, step: 26, color: '#231a10', amount: 0.035 })
      ctx.strokeStyle = 'rgba(35,26,16,0.45)'
      ctx.lineWidth = 3
      ctx.setLineDash([14, 10])
      ctx.strokeRect(48, 48, S.w - 96, S.h - 96)
      ctx.setLineDash([])
      P.notches(ctx, S, { y: S.h * 0.26, r: 30, color: '#0f1216' })
      P.notches(ctx, S, { y: S.h * 0.82, r: 30, color: '#0f1216' })
    },
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    pal: {
      bg: '#08294a',
      ink: '#eaf4ff',
      ink2: '#7fa8cd',
      accent: '#69e0ff',
      accentInk: '#062033',
      line: 'rgba(234,244,255,0.3)',
      panel: 'rgba(234,244,255,0.06)',
    },
    display: 'mono',
    displayWeight: 700,
    displayTracking: 0.02,
    body: 'mono',
    align: 'left',
    chip: 'outline',
    paint(ctx, S) {
      ctx.fillStyle = P.linear(ctx, 0, 0, S.w, S.h, [
        [0, '#0a3057'],
        [1, '#061d35'],
      ])
      ctx.fillRect(0, 0, S.w, S.h)
      P.gridLines(ctx, S, { step: 40, color: '#9fd0ff', amount: 0.08 })
      P.gridLines(ctx, S, { step: 200, color: '#9fd0ff', amount: 0.16, width: 2 })
      ctx.strokeStyle = 'rgba(234,244,255,0.5)'
      ctx.lineWidth = 2
      ctx.strokeRect(52, 52, S.w - 104, S.h - 104)
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    pal: {
      bg: '#2b0b3a',
      ink: '#fff6ec',
      ink2: '#ffcbb0',
      accent: '#ffe066',
      accentInk: '#3a1400',
      line: 'rgba(255,246,236,0.35)',
      panel: 'rgba(255,255,255,0.12)',
    },
    display: 'black',
    displayWeight: 900,
    displayTracking: -0.015,
    paint(ctx, S) {
      ctx.fillStyle = P.linear(ctx, 0, 0, 0, S.h, [
        [0, '#ffb03a'],
        [0.35, '#ef5d5d'],
        [0.7, '#8a2d7a'],
        [1, '#2b0b3a'],
      ])
      ctx.fillRect(0, 0, S.w, S.h)
      ctx.save()
      ctx.globalAlpha = 0.5
      ctx.fillStyle = P.radial(ctx, S.w * 0.5, S.h * 0.34, S.w * 0.42, [
        [0, 'rgba(255,236,170,0.95)'],
        [0.6, 'rgba(255,180,90,0.25)'],
        [1, 'rgba(255,180,90,0)'],
      ])
      ctx.fillRect(0, 0, S.w, S.h)
      ctx.restore()
    },
  },
  {
    id: 'photocopy',
    name: 'Photocopy',
    pal: {
      bg: '#eceae4',
      ink: '#0d0d0d',
      ink2: '#4d4d4d',
      accent: '#0d0d0d',
      accentInk: '#eceae4',
      line: 'rgba(13,13,13,0.65)',
      panel: 'rgba(13,13,13,0.1)',
    },
    display: 'impact',
    displayWeight: 400,
    displayTracking: -0.01,
    body: 'condensed',
    bodyWeight: 700,
    align: 'left',
    chip: 'solid',
    grain: 0.3,
    paint(ctx, S) {
      ctx.fillStyle = '#eceae4'
      ctx.fillRect(0, 0, S.w, S.h)
      // Toner never lands evenly: a few dark smears sell the photocopier more
      // than the grain does.
      ctx.save()
      for (let i = 0; i < 7; i += 1) {
        ctx.globalAlpha = 0.05 + S.rng() * 0.06
        ctx.fillStyle = '#0d0d0d'
        const w = S.w * (0.3 + S.rng() * 0.8)
        ctx.fillRect(S.rng() * S.w - w / 2, S.rng() * S.h, w, 6 + S.rng() * 30)
      }
      ctx.restore()
      P.dots(ctx, S, { step: 9, r: 1.4, color: '#0d0d0d', amount: 0.1 })
      ctx.strokeStyle = '#0d0d0d'
      ctx.lineWidth = 8
      ctx.strokeRect(40, 40, S.w - 80, S.h - 80)
    },
    emphasis(ctx, S, draw) {
      P.withOffset(ctx, 7, 7, 'rgba(13,13,13,0.28)', draw)
    },
  },
  {
    id: 'deco',
    name: 'Deco',
    pal: {
      bg: '#0d0d10',
      ink: '#f2e2bd',
      ink2: '#9c8c6a',
      accent: '#d4af5e',
      accentInk: '#14120a',
      line: 'rgba(212,175,94,0.5)',
      panel: 'rgba(212,175,94,0.1)',
    },
    display: 'didone',
    displayWeight: 700,
    displayTracking: 0.06,
    body: 'humanist',
    rule: 'double',
    chip: 'outline',
    paint(ctx, S) {
      ctx.fillStyle = '#0d0d10'
      ctx.fillRect(0, 0, S.w, S.h)
      P.rays(ctx, S.w / 2, S.h * 0.22, { count: 20, color: '#d4af5e', amount: 0.07 })
      ctx.strokeStyle = 'rgba(212,175,94,0.55)'
      ctx.lineWidth = 2
      ctx.strokeRect(50, 50, S.w - 100, S.h - 100)
      ctx.strokeRect(66, 66, S.w - 132, S.h - 132)
      // Clipped corners: the one shape that says deco without a single motif.
      ctx.lineWidth = 3
      const c = 46
      for (const [x, y, dx, dy] of [
        [50, 50 + c, 1, -1],
        [S.w - 50, 50 + c, -1, -1],
        [50, S.h - 50 - c, 1, 1],
        [S.w - 50, S.h - 50 - c, -1, 1],
      ]) {
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + c * dx, y + c * dy)
        ctx.stroke()
      }
    },
  },
  {
    id: 'riso',
    name: 'Riso',
    pal: {
      bg: '#f7f4ea',
      ink: '#181818',
      ink2: '#5a5a5a',
      accent: '#ff4f6d',
      accentInk: '#fff6f7',
      line: 'rgba(24,24,24,0.5)',
      panel: 'rgba(24,24,24,0.08)',
    },
    display: 'condensed',
    displayWeight: 800,
    body: 'grotesk',
    align: 'left',
    chip: 'solid',
    grain: 0.16,
    paint(ctx, S) {
      ctx.fillStyle = '#f7f4ea'
      ctx.fillRect(0, 0, S.w, S.h)
      // Two passes through a duplicator, slightly out of register.
      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      P.blob(ctx, S.w * 0.22, S.h * 0.2, S.w * 0.62, '#ff4f6d', 0.55)
      P.blob(ctx, S.w * 0.84, S.h * 0.72, S.w * 0.58, '#2f6bff', 0.5)
      P.blob(ctx, S.w * 0.1, S.h * 0.9, S.w * 0.4, '#ffd233', 0.5)
      ctx.restore()
      P.dots(ctx, S, { step: 12, r: 1.6, color: '#181818', amount: 0.07 })
    },
  },
  {
    id: 'chalk',
    name: 'Chalkboard',
    pal: {
      bg: '#232a26',
      ink: '#f2f5ef',
      ink2: '#a8b3a6',
      accent: '#ffd98e',
      accentInk: '#2a2118',
      line: 'rgba(242,245,239,0.4)',
      panel: 'rgba(242,245,239,0.07)',
    },
    display: 'humanist',
    displayWeight: 700,
    displayTracking: 0.01,
    body: 'humanist',
    rule: 'dots',
    chip: 'outline',
    grain: 0.18,
    paint(ctx, S) {
      ctx.fillStyle = P.linear(ctx, 0, 0, S.w, S.h, [
        [0, '#2a322d'],
        [1, '#1b201d'],
      ])
      ctx.fillRect(0, 0, S.w, S.h)
      // Smeared-eraser clouds, which is the only thing that stops a dark green
      // rectangle from reading as a dark green rectangle.
      ctx.save()
      ctx.globalAlpha = 0.05
      for (let i = 0; i < 9; i += 1) {
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.ellipse(
          S.rng() * S.w,
          S.rng() * S.h,
          120 + S.rng() * 260,
          40 + S.rng() * 90,
          S.rng() * Math.PI,
          0,
          Math.PI * 2
        )
        ctx.fill()
      }
      ctx.restore()
      ctx.strokeStyle = 'rgba(242,245,239,0.28)'
      ctx.lineWidth = 2
      ctx.setLineDash([2, 9])
      ctx.strokeRect(52, 52, S.w - 104, S.h - 104)
      ctx.setLineDash([])
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    pal: {
      bg: '#ffffff',
      ink: '#101010',
      ink2: '#8a8a8a',
      accent: '#101010',
      accentInk: '#ffffff',
      line: 'rgba(16,16,16,0.18)',
      panel: 'rgba(16,16,16,0.05)',
    },
    display: 'grotesk',
    displayWeight: 700,
    displayCaps: false,
    displayTracking: -0.02,
    align: 'left',
    chip: 'plain',
    paint(ctx, S) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, S.w, S.h)
      P.line(ctx, 0, S.h * 0.5, S.w, S.h * 0.5, 'rgba(16,16,16,0.06)', 1)
    },
  },
  {
    id: 'vhs',
    name: 'VHS',
    pal: {
      bg: '#0b0b12',
      ink: '#f0f4ff',
      ink2: '#8d93b5',
      accent: '#37f5c8',
      accentInk: '#04241d',
      line: 'rgba(240,244,255,0.3)',
      panel: 'rgba(120,140,255,0.12)',
    },
    display: 'condensed',
    displayWeight: 800,
    body: 'mono',
    chip: 'outline',
    grain: 0.14,
    paint(ctx, S) {
      ctx.fillStyle = P.linear(ctx, 0, 0, 0, S.h, [
        [0, '#151434'],
        [1, '#07060d'],
      ])
      ctx.fillRect(0, 0, S.w, S.h)
      P.blob(ctx, S.w * 0.5, S.h * 0.78, S.w * 0.9, '#3b2bff', 0.22)
      P.scanlines(ctx, S, { step: 7, color: '#000000', amount: 0.22 })
      // Tracking error: one band of the tape that never quite locked.
      ctx.save()
      ctx.globalAlpha = 0.16
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, S.h * 0.63, S.w, 12)
      ctx.restore()
    },
    emphasis(ctx, S, draw) {
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.fillStyle = 'rgba(255,0,90,0.75)'
      ctx.translate(-6, 0)
      draw()
      ctx.restore()
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.fillStyle = 'rgba(0,220,255,0.75)'
      ctx.translate(6, 0)
      draw()
      ctx.restore()
      draw()
    },
  },
  {
    id: 'tape',
    name: 'Tape',
    pal: {
      bg: '#20211c',
      ink: '#efe9d6',
      ink2: '#9d9782',
      accent: '#d9603b',
      accentInk: '#1a1006',
      line: 'rgba(239,233,214,0.3)',
      panel: 'rgba(239,233,214,0.06)',
    },
    display: 'mono',
    displayWeight: 700,
    displayTracking: -0.01,
    body: 'mono',
    bodyWeight: 500,
    align: 'left',
    rule: 'none',
    chip: 'solid',
    grain: 0.1,
    paint(ctx, S) {
      ctx.fillStyle = '#20211c'
      ctx.fillRect(0, 0, S.w, S.h)
      // The label strip down the middle of a cassette insert.
      P.fillRound(ctx, 40, 40, S.w - 80, S.h - 80, 10, '#2b2c25')
      ctx.save()
      ctx.globalAlpha = 0.5
      for (const y of [0.14, 0.88]) {
        ctx.fillStyle = '#d9603b'
        ctx.fillRect(40, S.h * y, S.w - 80, 10)
      }
      ctx.restore()
      P.stripes(ctx, S, { angle: 0, step: 5, color: '#efe9d6', amount: 0.02 })
    },
  },
  {
    id: 'mesh',
    name: 'Aurora',
    pal: {
      bg: '#070b16',
      ink: '#ffffff',
      ink2: '#a9b6d6',
      accent: '#7cf0c8',
      accentInk: '#042018',
      line: 'rgba(255,255,255,0.22)',
      panel: 'rgba(255,255,255,0.09)',
    },
    display: 'rounded',
    displayWeight: 800,
    displayCaps: false,
    displayTracking: -0.015,
    body: 'rounded',
    chip: 'solid',
    radius: 26,
    paint(ctx, S) {
      ctx.fillStyle = '#070b16'
      ctx.fillRect(0, 0, S.w, S.h)
      P.blob(ctx, S.w * 0.15, S.h * 0.12, S.w * 0.8, '#5b4bff', 0.6)
      P.blob(ctx, S.w * 0.92, S.h * 0.32, S.w * 0.7, '#00c2ff', 0.5)
      P.blob(ctx, S.w * 0.45, S.h * 0.85, S.w * 0.9, '#7cf0c8', 0.35)
      P.blob(ctx, S.w * 0.8, S.h * 0.96, S.w * 0.5, '#ff5fa2', 0.3)
      ctx.fillStyle = 'rgba(7,11,22,0.35)'
      ctx.fillRect(0, 0, S.w, S.h)
    },
  },
  {
    id: 'punch',
    name: 'Punch',
    pal: {
      bg: '#e8422f',
      ink: '#fff3e2',
      ink2: '#ffd3c4',
      accent: '#131313',
      accentInk: '#fff3e2',
      line: 'rgba(255,243,226,0.45)',
      panel: 'rgba(19,19,19,0.18)',
    },
    display: 'condensed',
    displayWeight: 800,
    displayTracking: -0.005,
    body: 'grotesk',
    bodyWeight: 700,
    align: 'left',
    chip: 'solid',
    paint(ctx, S) {
      ctx.fillStyle = '#e8422f'
      ctx.fillRect(0, 0, S.w, S.h)
      // One black wedge across the bottom third: flat colour, hard edge, done.
      ctx.fillStyle = '#131313'
      ctx.beginPath()
      ctx.moveTo(0, S.h * 0.74)
      ctx.lineTo(S.w, S.h * 0.66)
      ctx.lineTo(S.w, S.h)
      ctx.lineTo(0, S.h)
      ctx.closePath()
      ctx.fill()
      P.stripes(ctx, S, { angle: -0.5, step: 70, color: '#fff3e2', amount: 0.05 })
    },
  },
]

/** Filled in from BASE so a theme can stay as short as its idea. */
export const templates = THEMES.map((theme) => ({
  ...BASE,
  ...theme,
  pal: { hot: theme.pal.accent, ...theme.pal },
}))

export const templateIds = templates.map((template) => template.id)

export function templateById(id) {
  return templates.find((template) => template.id === id) || templates[0]
}

/** The next look along, for the shuffle button. Never the one already on screen. */
export function nextTemplate(currentId, random = Math.random) {
  const others = templateIds.filter((id) => id !== currentId)
  return others[Math.floor(random() * others.length)] || templateIds[0]
}
