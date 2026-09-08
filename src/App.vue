<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { GOOGLE_CLIENT_ID, RANGE, STORAGE } from './config'
import { initAuth, isSignedIn, signIn, clearToken } from './lib/google'
import { AuthError } from './lib/calendar'
import { readPref, writePref } from './lib/prefs'
import {
  addDays,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  isSameMonth,
  formatMonthShort,
  startOfDay,
} from './lib/dates'
import { newDraft, draftFromEvent, toResource, isRecurringInstance } from './lib/events'
import {
  calendars,
  visibleCalendars,
  defaultCalendarId,
  loadCalendars,
  ensureRange,
  initialRange,
  loadedFrom,
  loadedTo,
  refresh as refreshStore,
  loading,
  calendarWarnings,
  saveEvent,
  removeEvent,
  currentEvent,
  resetStore,
} from './lib/store'
import { loadToolStates } from './tools/registry'
import SetupNotice from './components/SetupNotice.vue'
import CalendarSettings from './components/CalendarSettings.vue'
import MonthView from './components/MonthView.vue'
import AgendaView from './components/AgendaView.vue'
import EventSheet from './components/EventSheet.vue'
import EventEditor from './components/EventEditor.vue'

const configured = Boolean(GOOGLE_CLIENT_ID)
const ready = ref(false)
const signedIn = ref(false)
const authError = ref('')
const loadError = ref('')

const view = ref(readPref(STORAGE.view) === 'agenda' ? 'agenda' : 'month')
const month = ref(startOfMonth(new Date()))
const selectedDay = ref(startOfDay(new Date()))

const toolStates = ref({})

/** Which event's sheet is open, held by identity so it tracks edits and deletes. */
const openRef = ref(null)
const openEvent = computed(() => currentEvent(openRef.value))
const editing = ref(null)
const activeTool = ref(null)
const showSettings = ref(false)

const busy = ref(false)
const actionError = ref('')

const title = computed(() =>
  view.value === 'month' ? formatMonthShort(month.value) : 'Agenda'
)

/** One place decides that a failure means "sign in again" rather than "try again". */
function handle(error, assign) {
  if (error instanceof AuthError) {
    signedIn.value = false
    authError.value = error.message
    return
  }
  assign?.(error.message || 'Something went wrong.')
}

/**
 * Tool state is derived from the loaded range, so it is rebuilt whenever the
 * range moves or a tool reports a change — never left to drift.
 */
async function syncTools() {
  toolStates.value = await loadToolStates({ from: loadedFrom.value, to: loadedTo.value })
}

async function load(from, to) {
  loadError.value = ''
  try {
    await ensureRange(from, to)
    await syncTools()
  } catch (error) {
    handle(error, (message) => (loadError.value = message))
  }
}

/** A month grid shows a few days either side, so the fetch has to as well. */
function coverMonth(target) {
  return load(startOfWeek(startOfMonth(target)), addDays(endOfMonth(target), 7))
}

function setView(next) {
  view.value = next
  writePref(STORAGE.view, next)
}

function stepMonth(delta) {
  month.value = addMonths(month.value, delta)
}

function goToday() {
  const today = new Date()
  month.value = startOfMonth(today)
  selectedDay.value = startOfDay(today)
  if (view.value !== 'month') setView('month')
}

function selectDay(day) {
  selectedDay.value = startOfDay(day)
  // Tapping a trailing day is how you leave a month, so follow it.
  if (!isSameMonth(day, month.value)) month.value = startOfMonth(day)
}

watch(month, (value) => {
  if (!signedIn.value) return
  if (!isSameMonth(selectedDay.value, value)) {
    const today = new Date()
    selectedDay.value = isSameMonth(today, value) ? startOfDay(today) : startOfMonth(value)
  }
  coverMonth(value)
})

async function boot() {
  try {
    await initAuth()
    signedIn.value = isSignedIn()
    if (signedIn.value) await start()
  } catch (error) {
    handle(error, (message) => (authError.value = message))
  } finally {
    ready.value = true
  }
}

async function start() {
  await loadCalendars()
  const span = initialRange()
  await load(span.from, span.to)
}

async function doSignIn() {
  authError.value = ''
  try {
    await signIn()
    signedIn.value = true
    await start()
  } catch (error) {
    authError.value = error.message
  }
}

function doSignOut() {
  clearToken()
  signedIn.value = false
  resetStore()
  toolStates.value = {}
  openRef.value = null
  editing.value = null
  showSettings.value = false
}

async function doRefresh() {
  loadError.value = ''
  try {
    await refreshStore()
    await syncTools()
  } catch (error) {
    handle(error, (message) => (loadError.value = message))
  }
}

/** The agenda's "load more": another few months on the far end. */
function extendForward() {
  return load(loadedFrom.value, addDays(loadedTo.value, RANGE.stepDays))
}

/* --------------------------------------------------------------- editing */

function startNew() {
  actionError.value = ''
  // A new event lands on the day you're looking at, at the next half hour —
  // on today, that means now-ish, which is what a quick + almost always means.
  editing.value = { event: null, draft: newDraft(selectedDay.value, defaultCalendarId.value) }
}

function startEdit() {
  actionError.value = ''
  editing.value = { event: openEvent.value, draft: draftFromEvent(openEvent.value) }
}

async function save(form) {
  const existing = editing.value.event
  busy.value = true
  actionError.value = ''
  try {
    const saved = await saveEvent({
      calendarId: form.calendarId,
      eventId: existing?.id,
      resource: toResource(form),
      // Editing one occurrence must not rewrite the series' rule.
      recurrence: isRecurringInstance(existing) ? undefined : form.recurrence,
      movedFrom: existing?.calendarId,
    })
    editing.value = null
    if (form.recurrence && !isRecurringInstance(existing)) {
      // Google answers a repeating event with the series itself, not with the
      // nights it expands into. Reloading is what turns it into rows you can
      // see; showing the series as one row would be a lie about the calendar.
      openRef.value = null
      await doRefresh()
    } else {
      openRef.value = { id: saved.id, calendarId: saved.calendarId }
      await syncTools()
    }
  } catch (error) {
    handle(error, (message) => (actionError.value = message))
  } finally {
    busy.value = false
  }
}

async function remove() {
  busy.value = true
  actionError.value = ''
  try {
    await removeEvent(openEvent.value)
    openRef.value = null
    await syncTools()
  } catch (error) {
    handle(error, (message) => (actionError.value = message))
  } finally {
    busy.value = false
  }
}

function selectEvent(event) {
  actionError.value = ''
  openRef.value = { id: event.id, calendarId: event.calendarId }
}

onMounted(boot)
</script>

<template>
  <SetupNotice v-if="!configured" />

  <div v-else-if="!ready" class="centre muted">Loading…</div>

  <div v-else-if="!signedIn" class="centre signin">
    <h1>Calendar</h1>
    <p class="muted">Sign in with the Google account that owns your calendars.</p>
    <button class="btn btn-primary" @click="doSignIn">Sign in with Google</button>
    <p v-if="authError" class="error" role="alert">{{ authError }}</p>
  </div>

  <template v-else>
    <header class="bar">
      <div class="left">
        <h1 class="title">{{ title }}</h1>
        <template v-if="view === 'month'">
          <button class="btn icon" aria-label="Previous month" @click="stepMonth(-1)">‹</button>
          <button class="btn icon" aria-label="Next month" @click="stepMonth(1)">›</button>
        </template>
      </div>

      <div class="actions">
        <button class="btn small" @click="goToday">Today</button>
        <button
          class="btn icon"
          :aria-label="view === 'month' ? 'Switch to agenda' : 'Switch to month'"
          @click="setView(view === 'month' ? 'agenda' : 'month')"
        >
          <span aria-hidden="true">{{ view === 'month' ? '☰' : '▦' }}</span>
        </button>
        <button class="btn icon" :disabled="loading" aria-label="Refresh" @click="doRefresh">
          <span aria-hidden="true">↻</span>
        </button>
        <button class="btn icon" aria-label="Calendars" @click="showSettings = true">
          <span aria-hidden="true">⚙</span>
        </button>
      </div>
      <div class="progress" :class="{ on: loading }" aria-hidden="true"></div>
    </header>

    <main>
      <p v-if="loadError" class="centre error" role="alert">{{ loadError }}</p>

      <p v-for="warning in calendarWarnings" :key="warning" class="warning">{{ warning }}</p>

      <p v-if="calendars.length && !visibleCalendars.length" class="centre muted">
        No calendars are ticked. Open <strong>⚙</strong> to choose what to show.
      </p>

      <MonthView
        v-else-if="view === 'month'"
        :month="month"
        :selected="selectedDay"
        :tool-states="toolStates"
        @select-day="selectDay"
        @step-month="stepMonth"
        @open-event="selectEvent"
      />

      <AgendaView
        v-else
        :tool-states="toolStates"
        @open-event="selectEvent"
        @extend="extendForward"
      />
    </main>

    <button class="fab" aria-label="New event" @click="startNew">＋</button>

    <EventSheet
      v-if="openEvent && !editing && !activeTool"
      :event="openEvent"
      :tool-states="toolStates"
      :busy="busy"
      :error="actionError"
      @close="openRef = null"
      @edit="startEdit"
      @remove="remove"
      @open-tool="activeTool = $event"
    />

    <EventEditor
      v-if="editing"
      :draft="editing.draft"
      :event="editing.event"
      :busy="busy"
      :error="actionError"
      @close="editing = null"
      @save="save"
    />

    <component
      :is="activeTool.panel"
      v-if="activeTool && openEvent"
      :event="openEvent"
      :state="toolStates[activeTool.id]"
      @close="activeTool = null"
      @changed="syncTools"
    />

    <CalendarSettings
      v-if="showSettings"
      @close="showSettings = false"
      @changed="syncTools"
      @sign-out="doSignOut"
    />
  </template>
</template>

<style scoped>
.bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  padding-top: calc(0.5rem + env(safe-area-inset-top));
  background: var(--bg);
  border-bottom: 1px solid var(--line);
}

.left {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  min-width: 0;
}

.title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0.2rem 0 0.3rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  display: flex;
  gap: 0.25rem;
  flex: none;
}

.icon {
  min-height: 36px;
  min-width: 36px;
  padding: 0;
  font-size: 1rem;
  border-color: transparent;
  background: transparent;
}

.small {
  min-height: 36px;
  padding: 0 0.7rem;
  font-size: 0.82rem;
  border-color: transparent;
  background: transparent;
}

/* A hairline that only appears while something is in flight: a spinner over the
   month would hide the very thing you're waiting to see. */
.progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.progress.on {
  opacity: 1;
  animation: sweep 1.1s linear infinite;
}

@keyframes sweep {
  from {
    transform: translateX(-40%);
  }
  to {
    transform: translateX(40%);
  }
}

.fab {
  position: fixed;
  right: 1rem;
  bottom: calc(1.1rem + env(safe-area-inset-bottom));
  z-index: 15;
  width: 3.4rem;
  height: 3.4rem;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 1.7rem;
  line-height: 1;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
}

.fab:active {
  transform: scale(0.96);
}

.centre {
  text-align: center;
  padding: 3rem 1.5rem;
}

.signin {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  max-width: 24rem;
  margin: 0 auto;
  padding-top: 20vh;
}

.signin h1 {
  font-size: 1.6rem;
  margin: 0;
}

.signin p {
  margin: 0;
}

.warning {
  margin: 0.6rem 1rem;
  padding: 0.6rem 0.8rem;
  border-radius: 10px;
  background: var(--warn-soft);
  border: 1px solid var(--warn-line);
  color: var(--warn);
  font-size: 0.85rem;
}

@media (min-width: 640px) {
  main {
    max-width: 40rem;
    margin: 0 auto;
  }

  .fab {
    right: calc(50vw - 19rem);
  }
}
</style>
