/**
 * The looks.
 *
 * A template here is a theme, not a layout: colours, type, a background painter
 * and a few switches the two layout engines in `render.js` read. Splitting it
 * that way is what makes forty of them affordable — the hard part, fitting a
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
  {
    id: 'terminal',
    name: 'Terminal',
    pal: {
      bg: '#020a05',
      ink: '#4dff9b',
      ink2: '#1f8a4d',
      accent: '#b6ff6a',
      accentInk: '#04160a',
      line: 'rgba(77,255,155,0.35)',
      panel: 'rgba(77,255,155,0.08)',
    },
    display: 'mono',
    displayWeight: 700,
    displayTracking: 0.02,
    body: 'mono',
    bodyWeight: 500,
    align: 'left',
    chip: 'outline',
    grain: 0.1,
    paint(ctx, S) {
      ctx.fillStyle = '#020a05'
      ctx.fillRect(0, 0, S.w, S.h)
      P.blob(ctx, S.w * 0.5, S.h * 0.55, S.w * 0.95, '#0e5c2c', 0.5)
      P.scanlines(ctx, S, { step: 5, color: '#000000', amount: 0.3 })
      // The cursor, parked where a prompt would have left it.
      ctx.fillStyle = '#4dff9b'
      ctx.fillRect(S.w - 150, S.h - 128, 44, 62)
    },
    emphasis(ctx, S, draw) {
      P.withGlow(ctx, '#4dff9b', 24, draw)
    },
  },
  {
    id: 'newsprint',
    name: 'Newsprint',
    pal: {
      bg: '#e9e6dd',
      ink: '#15151a',
      ink2: '#5c5c63',
      accent: '#15151a',
      accentInk: '#e9e6dd',
      line: 'rgba(21,21,26,0.45)',
      panel: 'rgba(21,21,26,0.07)',
    },
    display: 'serif',
    displayWeight: 700,
    displayTracking: -0.005,
    body: 'grotesk',
    bodyWeight: 600,
    rule: 'double',
    grain: 0.18,
    paint(ctx, S) {
      ctx.fillStyle = '#e9e6dd'
      ctx.fillRect(0, 0, S.w, S.h)
      P.dots(ctx, S, { step: 14, r: 1.5, color: '#15151a', amount: 0.07 })
      // A masthead rule and its hairline, above the safe area where a paper
      // would carry the date and the price.
      ctx.fillStyle = '#15151a'
      ctx.fillRect(0, S.h * 0.052, S.w, 9)
      ctx.fillRect(0, S.h * 0.052 + 15, S.w, 2)
      ctx.fillRect(0, S.h * 0.955, S.w, 5)
    },
  },
  {
    id: 'bubblegum',
    name: 'Bubblegum',
    pal: {
      bg: '#ff3f9a',
      ink: '#fffafc',
      ink2: '#ffd3e7',
      accent: '#c8ff4f',
      accentInk: '#1b3300',
      line: 'rgba(255,255,255,0.5)',
      panel: 'rgba(255,255,255,0.18)',
    },
    display: 'rounded',
    displayWeight: 800,
    displayTracking: -0.01,
    body: 'rounded',
    bodyWeight: 700,
    radius: 30,
    paint(ctx, S) {
      ctx.fillStyle = P.linear(ctx, 0, 0, 0, S.h, [
        [0, '#ff6ab4'],
        [1, '#f01f7e'],
      ])
      ctx.fillRect(0, 0, S.w, S.h)
      P.blob(ctx, S.w * 0.15, S.h * 0.85, S.w * 0.7, '#c8ff4f', 0.4)
      P.blob(ctx, S.w * 0.9, S.h * 0.1, S.w * 0.6, '#ffe66a', 0.35)
      // Loose bubbles, seeded so they don't crawl about between redraws.
      ctx.save()
      for (let i = 0; i < 16; i += 1) {
        ctx.globalAlpha = 0.1 + S.rng() * 0.14
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(S.rng() * S.w, S.rng() * S.h, 16 + S.rng() * 70, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    },
    emphasis(ctx, S, draw) {
      P.withOffset(ctx, 0, 9, 'rgba(27,51,0,0.3)', draw)
    },
  },
  {
    id: 'swiss',
    name: 'Swiss',
    pal: {
      bg: '#f2f2f0',
      ink: '#111111',
      ink2: '#6a6a6a',
      accent: '#ff2d16',
      accentInk: '#ffffff',
      line: 'rgba(17,17,17,0.85)',
      panel: 'rgba(17,17,17,0.06)',
    },
    display: 'grotesk',
    displayWeight: 700,
    displayCaps: false,
    displayTracking: -0.035,
    align: 'left',
    chip: 'solid',
    radius: 0,
    paint(ctx, S) {
      ctx.fillStyle = '#f2f2f0'
      ctx.fillRect(0, 0, S.w, S.h)
      // A red column down the gutter and one heavy rule: the whole grid, stated.
      ctx.fillStyle = '#ff2d16'
      ctx.fillRect(0, 0, 26, S.h)
      ctx.fillStyle = '#111111'
      ctx.fillRect(0, S.h * 0.075, S.w, 13)
      ctx.fillRect(0, S.h * 0.945, S.w, 4)
    },
  },
  {
    id: 'gold',
    name: 'Gold',
    pal: {
      bg: '#08080a',
      ink: '#f0dfae',
      ink2: '#8a7c58',
      accent: '#e8c877',
      accentInk: '#1a1405',
      line: 'rgba(232,200,119,0.45)',
      panel: 'rgba(232,200,119,0.08)',
    },
    display: 'didone',
    displayWeight: 700,
    displayTracking: 0.08,
    body: 'serif',
    chip: 'outline',
    paint(ctx, S) {
      ctx.fillStyle = P.linear(ctx, 0, 0, 0, S.h, [
        [0, '#121216'],
        [1, '#050506'],
      ])
      ctx.fillRect(0, 0, S.w, S.h)
      for (const y of [S.h * 0.055, S.h * 0.945]) {
        P.line(ctx, 90, y, S.w - 90, y, 'rgba(232,200,119,0.5)', 2)
        P.line(ctx, 90, y + 7, S.w - 90, y + 7, 'rgba(232,200,119,0.25)', 1)
      }
    },
    /**
     * Metal is a gradient across the letterforms, not a colour. Bands of light
     * and shade repeated down the poster so the name catches one wherever the
     * layout happens to put it.
     */
    emphasis(ctx, S, draw) {
      ctx.save()
      ctx.fillStyle = P.linear(ctx, 0, 0, 0, S.h, [
        [0, '#7a642f'],
        [0.2, '#f7e8bb'],
        [0.36, '#a98c4a'],
        [0.52, '#fbf0cd'],
        [0.68, '#8f7538'],
        [0.84, '#f3e2b0'],
        [1, '#6f5a2a'],
      ])
      draw()
      ctx.restore()
    },
  },
  {
    id: 'terrazzo',
    name: 'Terrazzo',
    pal: {
      bg: '#f5f2e9',
      ink: '#1d2b24',
      ink2: '#5d6b62',
      accent: '#e2603f',
      accentInk: '#fff6f2',
      line: 'rgba(29,43,36,0.3)',
      panel: 'rgba(29,43,36,0.07)',
    },
    display: 'grotesk',
    displayWeight: 800,
    chip: 'solid',
    radius: 22,
    paint(ctx, S) {
      ctx.fillStyle = '#f5f2e9'
      ctx.fillRect(0, 0, S.w, S.h)
      const chips = ['#e2603f', '#2f7d6a', '#e8b53c', '#1d2b24', '#8fb7a6']
      ctx.save()
      for (let i = 0; i < 150; i += 1) {
        ctx.globalAlpha = 0.5 + S.rng() * 0.4
        ctx.fillStyle = chips[Math.floor(S.rng() * chips.length)]
        ctx.save()
        ctx.translate(S.rng() * S.w, S.rng() * S.h)
        ctx.rotate(S.rng() * Math.PI)
        ctx.beginPath()
        ctx.ellipse(0, 0, 6 + S.rng() * 20, 4 + S.rng() * 9, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      ctx.restore()
      // A wash back over the chips, so type still has somewhere to sit.
      ctx.fillStyle = 'rgba(245,242,233,0.55)'
      ctx.fillRect(0, 0, S.w, S.h)
    },
  },
  {
    id: 'emboss',
    name: 'Emboss',
    pal: {
      bg: '#d9d7d2',
      ink: '#c3c1bb',
      ink2: '#8b8982',
      accent: '#9a968c',
      accentInk: '#f2f1ee',
      line: 'rgba(90,88,82,0.35)',
      panel: 'rgba(255,255,255,0.35)',
    },
    display: 'grotesk',
    displayWeight: 900,
    displayTracking: -0.02,
    chip: 'outline',
    paint(ctx, S) {
      ctx.fillStyle = P.linear(ctx, 0, 0, S.w, S.h, [
        [0, '#e2e0db'],
        [1, '#cdcbc5'],
      ])
      ctx.fillRect(0, 0, S.w, S.h)
      P.grain(ctx, S, 0.1)
    },
    /**
     * Pressed into the paper rather than printed on it: a highlight above, a
     * shadow below, and the letter itself barely darker than the ground.
     */
    emphasis(ctx, S, draw) {
      P.withOffset(ctx, 0, 4, 'rgba(80,78,72,0.45)', () => {
        P.withOffset(ctx, 0, -8, 'rgba(255,255,255,0.95)', draw)
      })
    },
  },
  {
    id: 'sunbeam',
    name: 'Sunbeam',
    pal: {
      bg: '#2a1206',
      ink: '#fff4e0',
      ink2: '#f0c08a',
      accent: '#ffd166',
      accentInk: '#3a1a00',
      line: 'rgba(255,244,224,0.4)',
      panel: 'rgba(42,18,6,0.45)',
    },
    display: 'condensed',
    displayWeight: 800,
    displayTracking: 0.01,
    chip: 'solid',
    paint(ctx, S) {
      const bands = ['#7a1f12', '#c23b16', '#e8701f', '#f0a12c', '#f7c85a']
      const h = S.h / bands.length
      bands.forEach((color, i) => {
        ctx.fillStyle = color
        ctx.fillRect(0, i * h, S.w, h + 1)
      })
      // Softened where the bands meet, or it reads as a bar chart.
      P.scrim(ctx, { x: 0, y: 0, w: S.w, h: S.h }, [
        [0, 'rgba(42,18,6,0.55)'],
        [0.5, 'rgba(42,18,6,0.2)'],
        [1, 'rgba(42,18,6,0.6)'],
      ])
    },
    emphasis(ctx, S, draw) {
      P.withOffset(ctx, 5, 5, 'rgba(42,18,6,0.45)', draw)
    },
  },
  {
    id: 'ink',
    name: 'Ink',
    pal: {
      bg: '#f2f0e9',
      ink: '#141c2b',
      ink2: '#4f5b70',
      accent: '#2b4f8a',
      accentInk: '#f2f0e9',
      line: 'rgba(20,28,43,0.35)',
      panel: 'rgba(20,28,43,0.06)',
    },
    display: 'didone',
    displayWeight: 700,
    displayCaps: false,
    body: 'serif',
    rule: 'line',
    chip: 'outline',
    grain: 0.12,
    paint(ctx, S) {
      ctx.fillStyle = '#f2f0e9'
      ctx.fillRect(0, 0, S.w, S.h)
      // Blooms: overlapping soft circles in one colour, which is how a wash
      // behaves on wet paper and nothing like a gradient does.
      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      for (let i = 0; i < 16; i += 1) {
        const x = S.w * (0.1 + S.rng() * 0.85)
        const y = S.h * (0.05 + S.rng() * 0.9)
        P.blob(ctx, x, y, 130 + S.rng() * 260, '#2b4f8a', 0.12 + S.rng() * 0.12)
      }
      ctx.restore()
    },
  },
]

/* ------------------------------------------------------------ with a photo */

/**
 * A photo changes where the words can go, so these themes move the text box as
 * well as painting the background. `boxFor` returns the area the layout engines
 * are allowed to use; everything outside it belongs to the picture.
 *
 * The two layouts want very different things from a photograph. One gig can sit
 * over a full-bleed image with a gradient under the type. Nine rows cannot —
 * they need a solid ground — so most of these put the photo in a band at the top
 * when the post is a list, and `S.mode` is how a theme tells the difference.
 */

/**
 * The safe area below `y`. It never runs past the bottom of the safe area — if
 * the picture has been greedy the box climbs back up into it, because type that
 * has fallen off the poster is worse than a photo with something over it.
 */
function below(S, y, min = S.mode === 'list' ? 640 : 560) {
  const bottom = S.full.y + S.full.h
  const top = Math.max(Math.min(Math.max(y, S.full.y), bottom - min), S.full.y)
  return { x: S.full.x, y: top, w: S.full.w, h: bottom - top }
}

/**
 * How tall a picture may be and still leave room for the words. A square window
 * is as wide as the poster, which on the 4:5 shape is most of its height — so
 * what a theme wants is a request, not the answer.
 */
function wellHeight(S, wanted) {
  // A hero needs room for a kicker, a name, a venue, a date and a footer; a list
  // needs that plus rows. Whatever is left over is the picture's.
  const keep = S.mode === 'list' ? 700 : 620
  return Math.max(Math.min(wanted, S.full.h - keep), 180)
}

/** The lower `share` of the safe area, for text over a full-bleed picture. */
function lower(S, share) {
  const h = S.full.h * share
  return { x: S.full.x, y: S.full.y + S.full.h - h, w: S.full.w, h }
}

/** A picture band across the top, the height set as a share of the whole poster. */
const band = (S, share) => ({ x: 0, y: 0, w: S.w, h: S.h * share })

const PHOTO_THEMES = [
  {
    id: 'billboard',
    name: 'Billboard',
    photo: true,
    pal: {
      bg: '#0b0b0d',
      ink: '#ffffff',
      ink2: '#c9c9cf',
      accent: '#ffd400',
      accentInk: '#141200',
      line: 'rgba(255,255,255,0.4)',
      panel: 'rgba(0,0,0,0.4)',
    },
    display: 'condensed',
    displayWeight: 800,
    align: 'left',
    boxFor: (S) => lower(S, S.mode === 'list' ? 0.72 : 0.56),
    paint(ctx, S) {
      ctx.fillStyle = '#0b0b0d'
      ctx.fillRect(0, 0, S.w, S.h)
      P.photoFill(ctx, S, { x: 0, y: 0, w: S.w, h: S.h })
      // The scrim starts just above the text box, so the picture is clean where
      // it is a picture and solid where it is a background.
      const start = (S.box.y - 150) / S.h
      P.scrim(ctx, { x: 0, y: 0, w: S.w, h: S.h }, [
        [0, 'rgba(11,11,13,0.25)'],
        [Math.max(start - 0.12, 0.02), 'rgba(11,11,13,0.1)'],
        [Math.max(start, 0.1), S.mode === 'list' ? 'rgba(11,11,13,0.86)' : 'rgba(11,11,13,0.62)'],
        [1, 'rgba(11,11,13,0.97)'],
      ])
    },
  },
  {
    id: 'duotone',
    name: 'Duotone',
    photo: true,
    pal: {
      bg: '#160b2e',
      ink: '#fff6d6',
      ink2: '#c3a6ff',
      accent: '#ffd84d',
      accentInk: '#20104a',
      line: 'rgba(255,216,77,0.5)',
      panel: 'rgba(30,10,70,0.5)',
    },
    display: 'black',
    displayWeight: 900,
    displayTracking: -0.015,
    boxFor: (S) => lower(S, S.mode === 'list' ? 0.76 : 0.58),
    paint(ctx, S) {
      const full = { x: 0, y: 0, w: S.w, h: S.h }
      ctx.fillStyle = '#160b2e'
      ctx.fillRect(0, 0, S.w, S.h)
      P.photoFill(ctx, S, full)
      P.duotone(ctx, full, '#3b1978', '#ffd84d')
      P.scrim(ctx, full, [
        [0, 'rgba(22,11,46,0.15)'],
        [0.45, 'rgba(22,11,46,0.55)'],
        [1, 'rgba(22,11,46,0.95)'],
      ])
    },
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    photo: true,
    pal: {
      bg: '#f7f6f2',
      ink: '#17171a',
      ink2: '#6f6f76',
      accent: '#e2553d',
      accentInk: '#fff6f3',
      line: 'rgba(23,23,26,0.2)',
      panel: 'rgba(23,23,26,0.06)',
    },
    display: 'grotesk',
    displayWeight: 800,
    align: 'left',
    chip: 'outline',
    grain: 0.08,
    /** One definition of the window, so the words and the picture can't disagree. */
    well(S) {
      const wanted = S.full.w * (S.mode === 'list' ? 0.66 : 1)
      return { x: S.full.x, y: S.full.y, w: S.full.w, h: wellHeight(S, wanted) }
    },
    boxFor(S) {
      const rect = this.well(S)
      return below(S, rect.y + rect.h + 58)
    },
    paint(ctx, S) {
      ctx.fillStyle = '#f7f6f2'
      ctx.fillRect(0, 0, S.w, S.h)
      const rect = this.well(S)
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.22)'
      ctx.shadowBlur = 30
      ctx.shadowOffsetY = 10
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(rect.x - 18, rect.y - 18, rect.w + 36, rect.h + 36)
      ctx.restore()
      P.photoFill(ctx, S, rect)
    },
  },
  {
    id: 'split',
    name: 'Split',
    photo: true,
    pal: {
      bg: '#12303a',
      ink: '#f2fbff',
      ink2: '#9fc4d2',
      accent: '#ffb03a',
      accentInk: '#231300',
      line: 'rgba(242,251,255,0.3)',
      panel: 'rgba(242,251,255,0.07)',
    },
    display: 'grotesk',
    displayWeight: 800,
    align: 'left',
    boxFor(S) {
      return below(S, band(S, S.mode === 'list' ? 0.3 : 0.46).h + 70)
    },
    paint(ctx, S) {
      ctx.fillStyle = '#12303a'
      ctx.fillRect(0, 0, S.w, S.h)
      const top = band(S, S.mode === 'list' ? 0.3 : 0.46)
      P.photoFill(ctx, S, top)
      P.line(ctx, 0, top.h, S.w, top.h, '#ffb03a', 10)
    },
  },
  {
    id: 'arch',
    name: 'Arch',
    photo: true,
    pal: {
      bg: '#eee6da',
      ink: '#2b211a',
      ink2: '#7a6a5c',
      accent: '#b5563a',
      accentInk: '#fdf6ef',
      line: 'rgba(43,33,26,0.28)',
      panel: 'rgba(43,33,26,0.06)',
    },
    display: 'didone',
    displayWeight: 700,
    body: 'serif',
    rule: 'double',
    chip: 'outline',
    grain: 0.1,
    boxFor(S) {
      const h = S.full.h * (S.mode === 'list' ? 0.3 : 0.46)
      return below(S, S.full.y + h + 64)
    },
    paint(ctx, S) {
      ctx.fillStyle = P.linear(ctx, 0, 0, 0, S.h, [
        [0, '#f4ede2'],
        [1, '#e4d8c6'],
      ])
      ctx.fillRect(0, 0, S.w, S.h)
      const h = S.full.h * (S.mode === 'list' ? 0.3 : 0.46)
      const w = S.full.w * 0.84
      const rect = { x: (S.w - w) / 2, y: S.full.y, w, h }
      // A semicircular head on a rectangle: the whole of an arch.
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(rect.x, rect.y + rect.h)
      ctx.lineTo(rect.x, rect.y + rect.w / 2)
      ctx.arc(rect.x + rect.w / 2, rect.y + rect.w / 2, rect.w / 2, Math.PI, 0)
      ctx.lineTo(rect.x + rect.w, rect.y + rect.h)
      ctx.closePath()
      ctx.clip()
      P.photoFill(ctx, S, rect)
      ctx.restore()
    },
  },
  {
    id: 'film',
    name: 'Film',
    photo: true,
    pal: {
      bg: '#0e0e0e',
      ink: '#f4f1e8',
      ink2: '#98948a',
      accent: '#e8b33c',
      accentInk: '#1a1305',
      line: 'rgba(244,241,232,0.3)',
      panel: 'rgba(244,241,232,0.06)',
    },
    display: 'mono',
    displayWeight: 700,
    body: 'mono',
    align: 'left',
    chip: 'outline',
    grain: 0.16,
    boxFor(S) {
      const h = S.h * (S.mode === 'list' ? 0.3 : 0.44)
      return below(S, h + 80)
    },
    paint(ctx, S) {
      ctx.fillStyle = '#0e0e0e'
      ctx.fillRect(0, 0, S.w, S.h)
      const h = S.h * (S.mode === 'list' ? 0.3 : 0.44)
      const frame = { x: 0, y: 48, w: S.w, h: h - 48 }
      P.photoFill(ctx, S, { x: 58, y: frame.y + 46, w: S.w - 116, h: frame.h - 92 })
      P.filmEdge(ctx, frame, 'rgba(244,241,232,0.75)')
      P.line(ctx, 0, h + 10, S.w, h + 10, 'rgba(244,241,232,0.2)', 2)
    },
  },
  {
    id: 'zine',
    name: 'Cut-out',
    photo: true,
    pal: {
      bg: '#efece3',
      ink: '#111111',
      ink2: '#4a4a4a',
      accent: '#ff3b30',
      accentInk: '#ffffff',
      line: 'rgba(17,17,17,0.6)',
      panel: 'rgba(17,17,17,0.1)',
    },
    display: 'impact',
    displayWeight: 400,
    body: 'condensed',
    bodyWeight: 700,
    align: 'left',
    grain: 0.22,
    boxFor(S) {
      const h = S.h * (S.mode === 'list' ? 0.32 : 0.45)
      return below(S, h + 74)
    },
    paint(ctx, S) {
      ctx.fillStyle = '#efece3'
      ctx.fillRect(0, 0, S.w, S.h)
      const h = S.h * (S.mode === 'list' ? 0.32 : 0.45)
      // Torn out and stuck down crooked, which is the entire idea.
      ctx.save()
      ctx.translate(S.w / 2, h / 2)
      ctx.rotate(-0.025)
      ctx.translate(-S.w / 2, -h / 2)
      const rect = { x: 34, y: 30, w: S.w - 68, h: h - 60 }
      ctx.fillStyle = '#111111'
      ctx.fillRect(rect.x + 14, rect.y + 16, rect.w, rect.h)
      P.photoFill(ctx, S, rect)
      P.dots(ctx, { w: S.w, h, pal: S.pal }, { step: 11, r: 1.6, color: '#111111', amount: 0.12 })
      ctx.restore()
      ctx.fillStyle = '#ff3b30'
      ctx.fillRect(0, h + 24, S.w, 14)
    },
  },
  {
    id: 'wash',
    name: 'Wash',
    photo: true,
    pal: {
      bg: '#101820',
      ink: '#ffffff',
      ink2: '#9fb2c4',
      accent: '#6ee7d8',
      accentInk: '#04241f',
      line: 'rgba(255,255,255,0.24)',
      panel: 'rgba(255,255,255,0.07)',
    },
    display: 'grotesk',
    displayWeight: 800,
    displayCaps: false,
    displayTracking: -0.02,
    boxFor: (S) => S.full,
    paint(ctx, S) {
      const full = { x: 0, y: 0, w: S.w, h: S.h }
      ctx.fillStyle = '#101820'
      ctx.fillRect(0, 0, S.w, S.h)
      // Faded far back, so a busy photograph becomes a texture instead of a
      // competitor. This is the style for the picture that isn't quite good
      // enough to be the poster.
      P.photoFill(ctx, S, full, { fade: 0.32 })
      P.scrim(ctx, full, [
        [0, 'rgba(16,24,32,0.55)'],
        [0.5, 'rgba(16,24,32,0.35)'],
        [1, 'rgba(16,24,32,0.8)'],
      ])
      P.blob(ctx, S.w * 0.8, S.h * 0.14, S.w * 0.7, '#6ee7d8', 0.14)
    },
  },
  {
    id: 'framed',
    name: 'Framed',
    photo: true,
    pal: {
      bg: '#1d1a16',
      ink: '#ffffff',
      ink2: '#cfc6b8',
      accent: '#f5f0e6',
      accentInk: '#1d1a16',
      line: 'rgba(255,255,255,0.45)',
      panel: 'rgba(0,0,0,0.45)',
    },
    display: 'humanist',
    displayWeight: 700,
    displayTracking: 0.05,
    boxFor: (S) => lower(S, S.mode === 'list' ? 0.7 : 0.52),
    paint(ctx, S) {
      const inset = 62
      ctx.fillStyle = '#1d1a16'
      ctx.fillRect(0, 0, S.w, S.h)
      P.photoFill(ctx, S, { x: 0, y: 0, w: S.w, h: S.h })
      P.scrim(ctx, { x: 0, y: 0, w: S.w, h: S.h }, [
        [0, 'rgba(29,26,22,0.2)'],
        [0.45, 'rgba(29,26,22,0.45)'],
        [1, 'rgba(29,26,22,0.92)'],
      ])
      // A mount, drawn as four bars rather than a stroke so the corners are
      // square at any width.
      ctx.fillStyle = '#f5f0e6'
      ctx.fillRect(0, 0, S.w, inset)
      ctx.fillRect(0, S.h - inset, S.w, inset)
      ctx.fillRect(0, 0, inset, S.h)
      ctx.fillRect(S.w - inset, 0, inset, S.h)
      P.strokeRound(ctx, inset, inset, S.w - inset * 2, S.h - inset * 2, 0, 'rgba(29,26,22,0.35)', 2)
    },
  },
  {
    id: 'halftone',
    name: 'Halftone',
    photo: true,
    pal: {
      bg: '#fff1d6',
      ink: '#111111',
      ink2: '#4a4a4a',
      accent: '#ff5a1f',
      accentInk: '#fff1d6',
      line: 'rgba(17,17,17,0.6)',
      panel: 'rgba(17,17,17,0.1)',
    },
    display: 'condensed',
    displayWeight: 800,
    body: 'grotesk',
    bodyWeight: 700,
    align: 'left',
    grain: 0.14,
    well(S) {
      const h = wellHeight(S, S.full.h * (S.mode === 'list' ? 0.4 : 0.62))
      return { x: 0, y: 0, w: S.w, h: S.full.y + h }
    },
    boxFor(S) {
      return below(S, this.well(S).h + 56)
    },
    paint(ctx, S) {
      ctx.fillStyle = '#fff1d6'
      ctx.fillRect(0, 0, S.w, S.h)
      const rect = this.well(S)
      P.photoFill(ctx, S, rect)
      // Newsprint reproduction: no greys, just how much black is in each cell.
      ctx.save()
      ctx.beginPath()
      ctx.rect(rect.x, rect.y, rect.w, rect.h)
      ctx.clip()
      for (const [mode, color] of [
        ['saturation', '#808080'],
        ['multiply', '#ff5a1f'],
      ]) {
        ctx.globalCompositeOperation = mode
        ctx.fillStyle = color
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
      }
      ctx.globalCompositeOperation = 'source-over'
      P.dots(ctx, { w: S.w, h: rect.h, pal: S.pal }, { step: 8, r: 2.6, color: '#111111', amount: 0.3 })
      ctx.restore()
      ctx.fillStyle = '#111111'
      ctx.fillRect(0, rect.h, S.w, 12)
    },
  },
  {
    id: 'slices',
    name: 'Slices',
    photo: true,
    pal: {
      bg: '#0d1117',
      ink: '#f6f8fa',
      ink2: '#9aa7b4',
      accent: '#ff7a45',
      accentInk: '#2a0e00',
      line: 'rgba(246,248,250,0.3)',
      panel: 'rgba(246,248,250,0.07)',
    },
    display: 'grotesk',
    displayWeight: 800,
    displayTracking: -0.01,
    align: 'left',
    well(S) {
      return { x: 0, y: 0, w: S.w, h: wellHeight(S, S.full.h * (S.mode === 'list' ? 0.4 : 0.66)) + S.full.y }
    },
    boxFor(S) {
      return below(S, this.well(S).h + 60)
    },
    paint(ctx, S) {
      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, S.w, S.h)
      const rect = this.well(S)
      // One photograph seen through three windows, so the bands line up into a
      // picture rather than reading as three different crops.
      const gap = 16
      const bandH = (rect.h - gap * 2) / 3
      ctx.save()
      ctx.beginPath()
      for (let i = 0; i < 3; i += 1) ctx.rect(0, i * (bandH + gap), S.w, bandH)
      ctx.clip()
      P.photoFill(ctx, S, rect)
      ctx.restore()
      P.line(ctx, 0, rect.h + 26, S.w, rect.h + 26, '#ff7a45', 8)
    },
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    photo: true,
    pal: {
      bg: '#151021',
      ink: '#fdf7ff',
      ink2: '#b4a3c8',
      accent: '#ffc857',
      accentInk: '#2a1c00',
      line: 'rgba(253,247,255,0.3)',
      panel: 'rgba(253,247,255,0.07)',
    },
    display: 'serif',
    displayWeight: 700,
    displayTracking: 0.02,
    chip: 'outline',
    well(S) {
      const d = Math.min(S.full.w, wellHeight(S, S.full.h * (S.mode === 'list' ? 0.34 : 0.56)))
      return { x: (S.w - d) / 2, y: S.full.y, w: d, h: d }
    },
    boxFor(S) {
      const rect = this.well(S)
      return below(S, rect.y + rect.h + 54)
    },
    paint(ctx, S) {
      ctx.fillStyle = P.linear(ctx, 0, 0, 0, S.h, [
        [0, '#231a38'],
        [1, '#100c1a'],
      ])
      ctx.fillRect(0, 0, S.w, S.h)
      const rect = this.well(S)
      const r = rect.w / 2
      P.rays(ctx, rect.x + r, rect.y + r, { count: 18, color: '#ffc857', amount: 0.06 })
      ctx.save()
      ctx.beginPath()
      ctx.arc(rect.x + r, rect.y + r, r, 0, Math.PI * 2)
      ctx.clip()
      P.photoFill(ctx, S, rect)
      ctx.restore()
      ctx.strokeStyle = 'rgba(255,200,87,0.7)'
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.arc(rect.x + r, rect.y + r, r, 0, Math.PI * 2)
      ctx.stroke()
    },
  },
  {
    id: 'card',
    name: 'Card',
    photo: true,
    pal: {
      bg: '#0a0f14',
      ink: '#ffffff',
      ink2: '#c2ced9',
      accent: '#6ee7b7',
      accentInk: '#04231a',
      line: 'rgba(255,255,255,0.35)',
      panel: 'rgba(12,18,24,0.62)',
    },
    display: 'rounded',
    displayWeight: 800,
    displayCaps: false,
    displayTracking: -0.015,
    body: 'rounded',
    radius: 24,
    boxFor: (S) => lower(S, S.mode === 'list' ? 0.7 : 0.5),
    paint(ctx, S) {
      const full = { x: 0, y: 0, w: S.w, h: S.h }
      ctx.fillStyle = '#0a0f14'
      ctx.fillRect(0, 0, S.w, S.h)
      P.photoFill(ctx, S, full)
      P.scrim(ctx, full, [
        [0, 'rgba(10,15,20,0.1)'],
        [1, 'rgba(10,15,20,0.6)'],
      ])
      /* A panel with a hard edge rather than a gradient: the picture stays a
         picture right up to the line, and the words sit on something solid. */
      const pad = 40
      const card = {
        x: Math.max(S.box.x - pad, 26),
        y: Math.max(S.box.y - pad, 26),
      }
      card.w = S.w - card.x * 2
      card.h = S.h - card.y - Math.max(S.h - (S.box.y + S.box.h) - pad, 26)
      P.fillRound(ctx, card.x, card.y, card.w, card.h, 34, 'rgba(10,15,20,0.72)')
      P.strokeRound(ctx, card.x, card.y, card.w, card.h, 34, 'rgba(255,255,255,0.18)', 2)
    },
  },
  {
    id: 'wedge',
    name: 'Wedge',
    photo: true,
    pal: {
      bg: '#101010',
      ink: '#fafafa',
      ink2: '#a0a0a0',
      accent: '#d7ff3e',
      accentInk: '#1b2200',
      line: 'rgba(250,250,250,0.3)',
      panel: 'rgba(250,250,250,0.07)',
    },
    display: 'condensed',
    displayWeight: 800,
    align: 'left',
    chip: 'solid',
    well(S) {
      return { x: 0, y: 0, w: S.w, h: wellHeight(S, S.full.h * (S.mode === 'list' ? 0.4 : 0.6)) + S.full.y }
    },
    boxFor(S) {
      // Below the low corner of the diagonal, or the type sits in the slope.
      return below(S, this.well(S).h + 64)
    },
    paint(ctx, S) {
      ctx.fillStyle = '#101010'
      ctx.fillRect(0, 0, S.w, S.h)
      const rect = this.well(S)
      const rise = rect.h * 0.16
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(S.w, 0)
      ctx.lineTo(S.w, rect.h - rise)
      ctx.lineTo(0, rect.h)
      ctx.closePath()
      ctx.clip()
      P.photoFill(ctx, S, rect)
      ctx.restore()
      ctx.strokeStyle = '#d7ff3e'
      ctx.lineWidth = 9
      ctx.beginPath()
      ctx.moveTo(0, rect.h)
      ctx.lineTo(S.w, rect.h - rise)
      ctx.stroke()
    },
  },
  {
    id: 'column',
    name: 'Column',
    photo: true,
    pal: {
      bg: '#1a1f1c',
      ink: '#f4f7f2',
      ink2: '#a3b0a6',
      accent: '#ffb648',
      accentInk: '#2a1800',
      line: 'rgba(244,247,242,0.3)',
      panel: 'rgba(244,247,242,0.07)',
    },
    display: 'condensed',
    displayWeight: 800,
    align: 'left',
    chip: 'solid',
    /**
     * The only composition here that is side by side. A list can't use it — nine
     * rows in 56% of the width would be nine ellipses — so in list mode it falls
     * back to a band and behaves like the others.
     */
    boxFor(S) {
      if (S.mode === 'list') return below(S, S.h * 0.3 + 64)
      return { x: S.full.x, y: S.full.y, w: S.full.w * 0.56, h: S.full.h }
    },
    paint(ctx, S) {
      ctx.fillStyle = '#1a1f1c'
      ctx.fillRect(0, 0, S.w, S.h)
      const rect =
        S.mode === 'list'
          ? { x: 0, y: 0, w: S.w, h: S.h * 0.3 }
          : { x: S.w * 0.63, y: 0, w: S.w * 0.37, h: S.h }
      P.photoFill(ctx, S, rect)
      ctx.fillStyle = '#ffb648'
      if (S.mode === 'list') ctx.fillRect(0, rect.h, S.w, 9)
      else ctx.fillRect(rect.x - 9, 0, 9, S.h)
    },
  },
]

/** Filled in from BASE so a theme can stay as short as its idea. */
export const templates = [...THEMES, ...PHOTO_THEMES].map((theme) => ({
  ...BASE,
  photo: false,
  ...theme,
  pal: { hot: theme.pal.accent, ...theme.pal },
}))

export const templateIds = templates.map((template) => template.id)

export function templateById(id) {
  return templates.find((template) => template.id === id) || templates[0]
}

/** Styles that do something with a picture, and styles that are type alone. */
export const photoTemplates = templates.filter((template) => template.photo)
export const plainTemplates = templates.filter((template) => !template.photo)

/**
 * The next look along, for the shuffle button. Never the one already on screen,
 * and only from what the strip is currently offering — shuffling to a photo
 * style when there is no photo would be a dead end.
 */
export function nextTemplate(currentId, pool = templates, random = Math.random) {
  const others = pool.filter((template) => template.id !== currentId)
  return others[Math.floor(random() * others.length)]?.id || pool[0]?.id || templateIds[0]
}
