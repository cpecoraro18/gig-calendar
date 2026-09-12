<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { listEvents, AuthError } from '../../lib/calendar.js'
import { addDays, startOfDay } from '../../lib/dates.js'
import { sortEvents } from '../../lib/events.js'
import { readPref, writePref } from '../../lib/prefs.js'
import SheetModal from '../../components/SheetModal.vue'
import { gigCalendarId } from '../gig/tool.js'
import { privateProps, SRC_EVENT_ID } from '../gig/gigs.js'
import { templateById, photoTemplates, plainTemplates, nextTemplate } from './themes.js'
import { SIZES, renderPoster, toPngBlob } from './render.js'
import {
  SCOPES,
  scopeWindow,
  gigsIn,
  isUpcoming,
  cardFor,
  defaultCopy,
  fileName,
} from './posters.js'

const props = defineProps({
  /** The gig the studio was opened from, if it was opened from one at all. */
  event: { type: Object, default: null },
  /** Unused — the studio loads its own gigs. Declared so it isn't an attribute. */
  state: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const PREF = {
  template: 'tool.poster.template',
  size: 'tool.poster.size',
  footer: 'tool.poster.footer',
}

/** Far enough forward to cover the rest of any month, and a picker worth having. */
const LOOKAHEAD_DAYS = 70

/**
 * Every photo is resampled to this before it is used. Redrawn across twenty-five
 * thumbnails on every keystroke, a twelve-megapixel original is the one thing
 * here heavy enough to drop frames — and no poster is 4000px across anyway.
 */
const MAX_PHOTO_EDGE = 1800

const keyOf = (event) => `${event.calendarId}|${event.id}`

const gigs = ref([])
const loading = ref(true)
const loadError = ref('')
const exporting = ref(false)
const exportError = ref('')

const scope = ref('one')
const chosen = ref(props.event ? keyOf(props.event) : '')
const dropped = ref(new Set())

/** A remembered choice has to be checked, not trusted: styles come and go. */
const remembered = (key, options, fallback) => {
  const saved = readPref(key)
  return options.some((option) => option.id === saved) ? saved : fallback
}

const template = ref(remembered(PREF.template, plainTemplates, plainTemplates[0].id))
const size = ref(remembered(PREF.size, SIZES, SIZES[0].id))
const copy = ref({ kicker: '', heading: '', subheading: '', footer: '' })

/** Shallow on purpose: this holds a canvas, which must reach drawImage as the
    real thing rather than as anything Vue has wrapped around it. */
const photo = shallowRef(null)
const photoError = ref('')
const focus = ref(0.5)

const preview = ref(null)
/** Deliberately not reactive: these are filled in during render, and writing to
    a reactive object from a template ref would re-trigger the render doing it. */
const thumbs = {}

/* ----------------------------------------------------------------- the gigs */

/**
 * The gigs calendar is the right source for a poster: it holds exactly what the
 * website already says, so a post and the site can't disagree. The event the
 * studio was opened from is added on top, because you often want to announce a
 * night before you have got round to publishing it.
 */
async function loadGigs() {
  const calendarId = gigCalendarId()
  if (!calendarId) {
    loading.value = false
    return
  }
  const from = startOfDay(new Date())
  try {
    const items = await listEvents(calendarId, {
      timeMin: from.toISOString(),
      timeMax: addDays(from, LOOKAHEAD_DAYS).toISOString(),
    })
    gigs.value = items.map((item) => ({ ...item, calendarId }))
  } catch (error) {
    loadError.value =
      error instanceof AuthError ? 'Your Google session expired.' : error.message
  } finally {
    loading.value = false
  }
}

/** The published listing made from this event, if there is one. */
function publishedFrom(event) {
  return gigs.value.find((gig) => privateProps(gig)[SRC_EVENT_ID] === event.id)
}

const pool = computed(() => {
  const list = gigs.value.filter(isUpcoming)
  const seed = props.event
  // A source event and its own listing are the same night twice. The listing
  // wins: it holds the words that are already on the site.
  if (seed && isUpcoming(seed) && !publishedFrom(seed) && !list.some((g) => keyOf(g) === keyOf(seed))) {
    list.push(seed)
  }
  return sortEvents(list)
})

const range = computed(() => scopeWindow(scope.value))

const scoped = computed(() => {
  if (scope.value === 'one') {
    const found = pool.value.find((gig) => keyOf(gig) === chosen.value)
    return found ? [found] : pool.value.slice(0, 1)
  }
  return gigsIn(pool.value, range.value)
})

const included = computed(() => scoped.value.filter((gig) => !dropped.value.has(keyOf(gig))))
const cards = computed(() => included.value.map((gig) => cardFor(gig)))

const spec = computed(() => ({
  template: template.value,
  size: size.value,
  cards: cards.value,
  photo: photo.value,
  focus: focus.value,
  ...copy.value,
}))

/**
 * Photo styles are only offered once there is a photo — nine placeholder wells
 * in the strip would be nine things that don't work yet. Adding one puts them
 * at the front, which is also how you find out they exist.
 */
const strip = computed(() =>
  photo.value ? [...photoTemplates, ...plainTemplates] : plainTemplates
)

const ready = computed(() => cards.value.length > 0)
const sizeLabel = computed(() => SIZES.find((s) => s.id === size.value) || SIZES[0])

/* -------------------------------------------------------------------- copy */

/**
 * The wording follows the scope until you type over it. Re-seeding on every
 * scope change is what makes the common post two taps; leaving the footer alone
 * is what stops it wiping the handle you set last week.
 */
function reseed() {
  const defaults = defaultCopy(scope.value, cards.value)
  copy.value = { ...copy.value, ...defaults }
}

watch([scope, chosen], () => {
  // Gigs left out of last week's post shouldn't stay left out of this month's.
  dropped.value = new Set()
  reseed()
})

watch(
  () => copy.value.footer,
  (value) => writePref(PREF.footer, value)
)
watch(template, (value) => writePref(PREF.template, value))
watch(size, (value) => writePref(PREF.size, value))

function toggle(gig) {
  const next = new Set(dropped.value)
  const key = keyOf(gig)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  dropped.value = next
}

/* ------------------------------------------------------------------ a photo */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('unreadable'))
    image.src = src
  })
}

async function onFile(event) {
  const file = event.target.files?.[0]
  // Cleared so that picking the same file again still counts as a change.
  event.target.value = ''
  if (!file) return
  photoError.value = ''
  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(Math.round(image.width * scale), 1)
    canvas.height = Math.max(Math.round(image.height * scale), 1)
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
    photo.value = canvas
    // Adding a photo to a style that ignores pictures would look like nothing
    // happened, so move to one that uses it.
    if (!templateById(template.value).photo) template.value = photoTemplates[0].id
  } catch {
    photoError.value = 'That image could not be read.'
  } finally {
    // Safe now: the pixels live in a canvas of our own.
    URL.revokeObjectURL(url)
  }
}

function clearPhoto() {
  photo.value = null
  focus.value = 0.5
  photoError.value = ''
  if (templateById(template.value).photo) template.value = plainTemplates[0].id
}

function shuffle() {
  template.value = nextTemplate(template.value, strip.value)
  document.getElementById(`poster-thumb-${template.value}`)?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center',
  })
}

/* ------------------------------------------------------------------ drawing */

let frame = 0
let thumbTimer = 0

function drawPreview() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => {
    if (preview.value) renderPoster(preview.value, spec.value)
  })
}

/**
 * Every miniature costs a full layout pass, which is too much to do on every
 * keystroke and too little to be worth a worker. A short wait after you stop
 * typing puts it in the gap where nobody is looking.
 */
function drawThumbs() {
  clearTimeout(thumbTimer)
  thumbTimer = setTimeout(() => {
    for (const item of strip.value) {
      const canvas = thumbs[item.id]
      if (canvas) renderPoster(canvas, { ...spec.value, template: item.id }, 0.08)
    }
  }, 240)
}

watch(spec, () => {
  drawPreview()
  drawThumbs()
})

/* ------------------------------------------------------------------- export */

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

async function run(share) {
  if (!preview.value || !ready.value) return
  exporting.value = true
  exportError.value = ''
  try {
    renderPoster(preview.value, spec.value)
    const blob = await toPngBlob(preview.value)
    const name = fileName(spec.value, cards.value)
    const file = new File([blob], name, { type: 'image/png' })
    // Sharing the file straight into Instagram is the whole point on a phone;
    // a download is the fallback for a desktop browser that can't.
    if (share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: copy.value.heading || name })
    } else {
      saveBlob(blob, name)
    }
  } catch (error) {
    // Dismissing the share sheet is a cancel, not a failure.
    if (error?.name !== 'AbortError') exportError.value = error.message || 'That did not work.'
  } finally {
    exporting.value = false
  }
}

onMounted(async () => {
  // No default: a poster says nothing at the bottom unless you put it there.
  copy.value.footer = readPref(PREF.footer) ?? ''
  await loadGigs()
  if (!chosen.value || !pool.value.some((gig) => keyOf(gig) === chosen.value)) {
    const seed = (props.event && publishedFrom(props.event)) || pool.value[0]
    chosen.value = seed ? keyOf(seed) : ''
  }
  reseed()
  await nextTick()
  drawPreview()
  drawThumbs()
})

onUnmounted(() => {
  cancelAnimationFrame(frame)
  clearTimeout(thumbTimer)
})
</script>

<template>
  <SheetModal title="Make a post" label="Gig post" @close="emit('close')">
    <div class="stage">
      <canvas
        ref="preview"
        class="preview"
        :class="{ tall: size === 'story' }"
        aria-label="Poster preview"
      ></canvas>
    </div>

    <p v-if="loading" class="muted centre">Loading gigs…</p>
    <p v-else-if="loadError" class="error" role="alert">{{ loadError }}</p>

    <p v-else-if="!pool.length" class="note">
      No upcoming gigs to post about. Publish a gig, or choose the gigs calendar
      under <strong>⚙</strong>.
    </p>

    <template v-else>
      <div class="seg" role="group" aria-label="What the post covers">
        <button
          v-for="option in SCOPES"
          :key="option.id"
          class="seg-btn"
          :class="{ on: scope === option.id }"
          :aria-pressed="scope === option.id"
          @click="scope = option.id"
        >
          {{ option.label }}
        </button>
      </div>

      <label v-if="scope === 'one'" class="field">
        <span class="label">Gig</span>
        <select v-model="chosen">
          <option v-for="gig in pool" :key="keyOf(gig)" :value="keyOf(gig)">
            {{ cardFor(gig).dateShort }} — {{ gig.summary || '(no title)' }}
          </option>
        </select>
      </label>

      <div v-else class="field">
        <span class="label">{{ scoped.length }} in range · tap to leave one out</span>
        <p v-if="!scoped.length" class="note">
          Nothing booked in that stretch. Try another range, or post a single gig.
        </p>
        <ul v-else class="picks">
          <li v-for="gig in scoped" :key="keyOf(gig)">
            <button
              class="pick"
              :class="{ off: dropped.has(keyOf(gig)) }"
              :aria-pressed="!dropped.has(keyOf(gig))"
              @click="toggle(gig)"
            >
              <span class="tick" aria-hidden="true">{{ dropped.has(keyOf(gig)) ? '' : '✓' }}</span>
              <span class="pick-when">{{ cardFor(gig).dateShort }}</span>
              <span class="pick-what">{{ gig.summary || '(no title)' }}</span>
            </button>
          </li>
        </ul>
      </div>

      <div class="field">
        <span class="label">Photo</span>
        <div class="photo-row">
          <label class="btn btn-quiet file">
            {{ photo ? 'Change photo' : 'Add a photo' }}
            <input type="file" accept="image/*" @change="onFile" />
          </label>
          <button v-if="photo" class="btn btn-quiet" @click="clearPhoto">Remove</button>
        </div>
        <span v-if="!photo" class="hint muted">
          Adds {{ photoTemplates.length }} more styles built around a picture.
        </span>
        <p v-if="photoError" class="error" role="alert">{{ photoError }}</p>
      </div>

      <label v-if="photo" class="field">
        <span class="label">Crop — what stays in frame</span>
        <input v-model.number="focus" class="slider" type="range" min="0" max="1" step="0.01" />
        <span class="hint muted">Left keeps the top of the photo, right the bottom.</span>
      </label>

      <div class="field">
        <span class="label">Style</span>
        <div class="strip">
          <button
            v-for="item in strip"
            :id="`poster-thumb-${item.id}`"
            :key="item.id"
            class="thumb"
            :class="{ on: template === item.id }"
            :aria-pressed="template === item.id"
            @click="template = item.id"
          >
            <canvas :ref="(el) => (thumbs[item.id] = el)" class="thumb-art"></canvas>
            <span class="thumb-name">{{ item.name }}</span>
          </button>
        </div>
        <button class="btn btn-quiet shuffle" @click="shuffle">↺ Shuffle style</button>
      </div>

      <div class="seg" role="group" aria-label="Shape">
        <button
          v-for="option in SIZES"
          :key="option.id"
          class="seg-btn"
          :class="{ on: size === option.id }"
          :aria-pressed="size === option.id"
          @click="size = option.id"
        >
          {{ option.label }} · {{ option.ratio }}
        </button>
      </div>

      <label v-if="cards.length <= 1" class="field">
        <span class="label">Kicker</span>
        <input v-model="copy.kicker" type="text" placeholder="Tonight" />
      </label>

      <template v-else>
        <label class="field">
          <span class="label">Headline</span>
          <input v-model="copy.heading" type="text" placeholder="This Week" />
        </label>
        <label class="field">
          <span class="label">Under it</span>
          <input v-model="copy.subheading" type="text" placeholder="Sep 12 – Sep 18" />
        </label>
      </template>

      <label class="field">
        <span class="label">Footer</span>
        <input v-model="copy.footer" type="text" placeholder="@yourhandle · yoursite.com" />
        <span class="hint muted">
          Remembered for next time. The venue and the date come from the gig itself.
        </span>
      </label>

      <p v-if="exportError" class="error" role="alert">{{ exportError }}</p>
    </template>

    <template #footer>
      <button
        class="btn btn-primary btn-block"
        :disabled="!ready || exporting"
        @click="run(true)"
      >
        {{ exporting ? 'Working…' : `Share ${sizeLabel.label.toLowerCase()}` }}
      </button>
      <button class="btn btn-block" :disabled="!ready || exporting" @click="run(false)">
        Save image
      </button>
    </template>
  </SheetModal>
</template>

<style scoped>
.stage {
  display: flex;
  justify-content: center;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 0.7rem;
}

/* The canvas is 1080 across whatever the shape, so height is what has to be
   held back — a full-height story preview would push every control off screen. */
.preview {
  display: block;
  max-width: 100%;
  max-height: 42vh;
  width: auto;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.5);
}

.preview.tall {
  max-height: 46vh;
}

.centre {
  text-align: center;
  margin: 0;
}

.note {
  margin: 0;
  padding: 0.7rem 0.85rem;
  border-radius: 10px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  color: var(--ink-2);
  font-size: 0.88rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.hint {
  font-size: 0.8rem;
}

/* A segmented control, which is the honest shape for "pick exactly one of these
   three" and costs less height than three rows of radio buttons. */
.seg {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 12px;
}

.seg-btn {
  flex: 1;
  min-height: 38px;
  padding: 0 0.5rem;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink-2);
}

.seg-btn.on {
  background: var(--accent);
  color: var(--accent-ink);
}

.picks {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.pick {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  min-height: var(--tap);
  padding: 0.35rem 0.6rem;
  text-align: left;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface-2);
  font-size: 0.88rem;
}

.pick.off {
  opacity: 0.45;
}

.tick {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 700;
}

.pick-when {
  flex: none;
  font-variant-numeric: tabular-nums;
  color: var(--ink-2);
  font-weight: 600;
}

.pick-what {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-row {
  display: flex;
  gap: 0.5rem;
}

.photo-row .btn {
  flex: 1;
  min-height: 42px;
  font-size: 0.88rem;
}

/* The control is the label; the input itself is only there to open the picker. */
.file input[type='file'] {
  display: none;
}

/* The shared field styling is for boxes you type in, and turns a range input
   into a bordered slab with the thumb floating in the middle of it. */
.field input.slider {
  min-height: 2rem;
  padding: 0;
  border: none;
  background: transparent;
  accent-color: var(--accent);
}

/* Twenty-five looks don't fit on a phone, and a grid of them would push the
   preview off screen. A scroller keeps the whole set one flick away. */
.strip {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0.15rem 0.15rem 0.35rem;
  scroll-snap-type: x proximity;
}

.thumb {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem;
  border-radius: 10px;
  border: 1px solid transparent;
  scroll-snap-align: center;
}

.thumb.on {
  border-color: var(--accent);
  background: var(--surface-2);
}

.thumb-art {
  display: block;
  width: 62px;
  height: auto;
  border-radius: 5px;
  background: var(--surface-3);
}

.thumb-name {
  font-size: 0.68rem;
  color: var(--ink-2);
  max-width: 66px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thumb.on .thumb-name {
  color: var(--ink);
}

.shuffle {
  align-self: flex-start;
  min-height: 38px;
  font-size: 0.85rem;
}
</style>
