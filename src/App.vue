<script setup>
import { ref, computed, onMounted } from 'vue'
import { GOOGLE_CLIENT_ID, WINDOW_BACK_DAYS, WINDOW_FORWARD_DAYS, STORAGE } from './config'
import { initAuth, isSignedIn, signIn, clearToken } from './lib/google'
import { listCalendars, listEvents, createEvent, patchEvent, deleteEvent, AuthError } from './lib/calendar'
import { windowBounds } from './lib/dates'
import { buildGig, indexGigs, sortByStart, SRC_HASH, sourceHash } from './lib/gigs'
import SetupNotice from './components/SetupNotice.vue'
import CalendarSettings from './components/CalendarSettings.vue'
import AgendaList from './components/AgendaList.vue'
import GigPanel from './components/GigPanel.vue'

const configured = Boolean(GOOGLE_CLIENT_ID)
const ready = ref(false)
const signedIn = ref(false)
const authError = ref('')

const calendars = ref([])
const sourceId = ref(localStorage.getItem(STORAGE.source) || '')
const destId = ref(localStorage.getItem(STORAGE.dest) || '')
const showSettings = ref(false)

const events = ref([])
const gigsBySource = ref(new Map())
const loading = ref(false)
const loadError = ref('')

const selected = ref(null)
const panelBusy = ref(false)
const panelError = ref('')

const chosen = computed(() => Boolean(sourceId.value && destId.value))
const sourceCalendar = computed(() => calendars.value.find((c) => c.id === sourceId.value))
const sourceName = computed(() => sourceCalendar.value?.summary || '')

/**
 * What gets recorded on a gig as the calendar it came from.
 *
 * Google uses your email address as the id of your primary calendar, and a
 * published gig is world-readable: the website reads this calendar through a
 * Lambda that returns the raw event resource, extended properties included, so
 * anything stored here is served publicly. "primary" says the same thing
 * without publishing the address. Secondary calendar ids are already
 * impersonal (…@group.calendar.google.com) and pass through unchanged.
 */
const sourceRef = computed(() =>
  sourceCalendar.value?.primary ? 'primary' : sourceId.value
)
/** The panel needs the live gig record, not the one captured when it opened. */
const selectedGig = computed(() =>
  selected.value ? gigsBySource.value.get(selected.value.id) || null : null
)

function persistChoice(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* private mode: the choice just won't survive a reload */
  }
}

function setSource(id) {
  sourceId.value = id
  persistChoice(STORAGE.source, id)
  refresh()
}

function setDest(id) {
  destId.value = id
  persistChoice(STORAGE.dest, id)
  refresh()
}

/** One place decides that a failure means "sign in again" rather than "retry". */
function handle(error, assign) {
  if (error instanceof AuthError) {
    signedIn.value = false
    authError.value = error.message
    return
  }
  assign(error.message || 'Something went wrong.')
}

async function loadCalendars() {
  calendars.value = await listCalendars()
  // A first run with nothing chosen: default to the calendar Google calls
  // primary, and leave the gigs calendar for you to pick — guessing which
  // calendar feeds a public website is not a guess worth making.
  if (!sourceId.value) {
    const primary = calendars.value.find((c) => c.primary)
    if (primary) {
      sourceId.value = primary.id
      persistChoice(STORAGE.source, primary.id)
    }
  }
}

async function refresh() {
  if (!chosen.value || !signedIn.value) return
  loading.value = true
  loadError.value = ''
  try {
    const bounds = windowBounds(WINDOW_BACK_DAYS, WINDOW_FORWARD_DAYS)
    // Both calendars over the same window, in parallel. Reading the gigs
    // calendar too is what makes this safe to re-open: it always knows which
    // events already have a listing.
    const [sourceEvents, gigEvents] = await Promise.all([
      listEvents(sourceId.value, bounds),
      listEvents(destId.value, bounds),
    ])
    events.value = sortByStart(sourceEvents.filter((e) => e.status !== 'cancelled'))
    gigsBySource.value = indexGigs(gigEvents.filter((e) => e.status !== 'cancelled'))
  } catch (error) {
    handle(error, (message) => (loadError.value = message))
  } finally {
    loading.value = false
  }
}

async function boot() {
  try {
    await initAuth()
    signedIn.value = isSignedIn()
    if (signedIn.value) {
      await loadCalendars()
      await refresh()
    }
  } catch (error) {
    handle(error, (message) => (authError.value = message))
  } finally {
    ready.value = true
  }
}

async function doSignIn() {
  authError.value = ''
  try {
    await signIn()
    signedIn.value = true
    await loadCalendars()
    await refresh()
  } catch (error) {
    authError.value = error.message
  }
}

function doSignOut() {
  clearToken()
  signedIn.value = false
  events.value = []
  gigsBySource.value = new Map()
  selected.value = null
}

function setGig(sourceEventId, gig) {
  const next = new Map(gigsBySource.value)
  if (gig) next.set(sourceEventId, gig)
  else next.delete(sourceEventId)
  gigsBySource.value = next
}

function openEvent(event) {
  selected.value = event
  panelError.value = ''
}

async function withPanel(action) {
  panelBusy.value = true
  panelError.value = ''
  try {
    await action()
  } catch (error) {
    handle(error, (message) => (panelError.value = message))
  } finally {
    panelBusy.value = false
  }
}

function createGig(form) {
  return withPanel(async () => {
    const source = selected.value
    const created = await createEvent(destId.value, buildGig(source, sourceRef.value, form))
    setGig(source.id, created)
    selected.value = null
  })
}

function updateGig(form) {
  return withPanel(async () => {
    const source = selected.value
    const gig = selectedGig.value
    if (!gig) throw new Error('That gig is no longer on the site.')
    const updated = await patchEvent(destId.value, gig.id, {
      summary: form.summary.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      start: source.start,
      end: source.end,
      // Re-stamping the hash is what clears the "source changed" flag: you have
      // now seen the new version and decided what the site should say.
      extendedProperties: {
        private: { ...gig.extendedProperties?.private, [SRC_HASH]: sourceHash(source) },
      },
    })
    setGig(source.id, updated)
    selected.value = null
  })
}

function removeGig() {
  return withPanel(async () => {
    const source = selected.value
    const gig = selectedGig.value
    if (gig) await deleteEvent(destId.value, gig.id)
    setGig(source.id, null)
    selected.value = null
  })
}

onMounted(boot)
</script>

<template>
  <SetupNotice v-if="!configured" />

  <div v-else-if="!ready" class="centre muted">Loading…</div>

  <div v-else-if="!signedIn" class="centre signin">
    <h1>Gig Scheduler</h1>
    <p class="muted">Sign in with the Google account that owns your calendars.</p>
    <button class="btn btn-primary" @click="doSignIn">Sign in with Google</button>
    <p v-if="authError" class="error" role="alert">{{ authError }}</p>
  </div>

  <template v-else>
    <header class="bar">
      <div class="bar-what">
        <strong>Gig Scheduler</strong>
        <span v-if="sourceName" class="muted bar-sub">{{ sourceName }}</span>
      </div>
      <div class="bar-actions">
        <button class="btn icon" :disabled="loading" title="Refresh" @click="refresh">
          <span aria-hidden="true">↻</span><span class="sr-only">Refresh</span>
        </button>
        <button class="btn icon" title="Calendars" @click="showSettings = !showSettings">
          <span aria-hidden="true">⚙</span><span class="sr-only">Calendars</span>
        </button>
        <button class="btn icon" title="Sign out" @click="doSignOut">
          <span aria-hidden="true">⏻</span><span class="sr-only">Sign out</span>
        </button>
      </div>
    </header>

    <main>
      <CalendarSettings
        v-if="showSettings || !chosen"
        :calendars="calendars"
        :source-id="sourceId"
        :dest-id="destId"
        :dismissable="chosen"
        @update:source-id="setSource"
        @update:dest-id="setDest"
        @close="showSettings = false"
      />

      <template v-else>
        <p v-if="loadError" class="centre error" role="alert">{{ loadError }}</p>
        <p v-else-if="loading && !events.length" class="centre muted">Loading your calendar…</p>
        <p v-else-if="!events.length" class="centre muted">
          Nothing on this calendar in the next year.
        </p>
        <AgendaList
          v-else
          :events="events"
          :gigs-by-source="gigsBySource"
          @select="openEvent"
        />
      </template>
    </main>

    <GigPanel
      v-if="selected"
      :event="selected"
      :gig="selectedGig"
      :busy="panelBusy"
      :error="panelError"
      @close="selected = null"
      @create="createGig"
      @update="updateGig"
      @remove="removeGig"
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
  gap: 1rem;
  padding: 0.6rem 0.85rem;
  padding-top: calc(0.6rem + env(safe-area-inset-top));
  background: var(--bg);
  border-bottom: 1px solid var(--line);
}

.bar-what {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.bar-sub {
  font-size: 0.78rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-actions {
  display: flex;
  gap: 0.4rem;
}

.icon {
  min-height: 38px;
  min-width: 38px;
  padding: 0;
  font-size: 1rem;
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

.error {
  color: var(--danger);
}
</style>
