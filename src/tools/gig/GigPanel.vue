<script setup>
import { computed, ref, watch } from 'vue'
import { createEvent, patchEvent, deleteEvent, AuthError } from '../../lib/calendar.js'
import { calendarsById, calendarName } from '../../lib/store.js'
import SheetModal from '../../components/SheetModal.vue'
import { buildGig, gigState, sourceHash, STATE, SRC_HASH } from './gigs.js'

const props = defineProps({
  /** The calendar event this gig would be made from. */
  event: { type: Object, required: true },
  /** From the tool's loader: the gigs calendar, and what's already published. */
  state: { type: Object, required: true },
})

const emit = defineEmits(['close', 'changed'])

const form = ref({ summary: '', location: '', description: '' })
const confirming = ref(false)
const busy = ref(false)
const error = ref('')

const gig = computed(() => props.state.bySource.get(props.event.id) || null)
const status = computed(() => gigState(props.event, gig.value))
const published = computed(() => status.value !== STATE.unpublished)

/**
 * The published listing wins when there is one: you're looking at what the site
 * currently says, not at the source event you have since edited away from.
 */
watch(
  [() => props.event.id, () => gig.value?.id],
  () => {
    const seed = gig.value || props.event
    form.value = {
      summary: seed.summary || '',
      location: seed.location || '',
      description: seed.description || '',
    }
    confirming.value = false
  },
  { immediate: true }
)

/**
 * What gets recorded on a gig as the calendar it came from.
 *
 * Google uses your email address as the id of your primary calendar, and a
 * published gig is world-readable: the website reads the gigs calendar through
 * a Lambda that returns the raw event resource, extended properties included.
 * "primary" says the same thing without publishing the address. Secondary
 * calendar ids are already impersonal and pass through unchanged.
 */
const sourceRef = computed(() =>
  calendarsById.value[props.event.calendarId]?.primary ? 'primary' : props.event.calendarId
)

const canSave = computed(() => form.value.summary.trim().length > 0 && !busy.value)

/** Offers the source's current text when it has moved on since you published. */
function takeSourceText() {
  form.value = {
    summary: props.event.summary || '',
    location: props.event.location || '',
    description: props.event.description || '',
  }
}

async function run(action) {
  busy.value = true
  error.value = ''
  try {
    await action()
    emit('changed')
    emit('close')
  } catch (err) {
    error.value = err instanceof AuthError ? 'Your Google session expired.' : err.message
  } finally {
    busy.value = false
  }
}

function create() {
  return run(() =>
    createEvent(props.state.calendarId, buildGig(props.event, sourceRef.value, form.value))
  )
}

function update() {
  return run(() =>
    patchEvent(props.state.calendarId, gig.value.id, {
      summary: form.value.summary.trim(),
      location: form.value.location.trim(),
      description: form.value.description.trim(),
      start: props.event.start,
      end: props.event.end,
      // Re-stamping the fingerprint is what clears the "source changed" flag:
      // you have now seen the new version and decided what the site should say.
      extendedProperties: {
        private: {
          ...gig.value.extendedProperties?.private,
          [SRC_HASH]: sourceHash(props.event),
        },
      },
    })
  )
}

function remove() {
  return run(() => deleteEvent(props.state.calendarId, gig.value.id))
}
</script>

<template>
  <SheetModal title="Publish as a gig" label="Gig listing" @close="emit('close')">
    <p class="intro muted">
      Creates a listing on <strong>{{ calendarName(state.calendarId) }}</strong
      >, which chrispecmusic.com reads. The date and time come from the event
      itself; the words below are yours.
    </p>

    <p v-if="status === STATE.drifted" class="drift">
      This event was edited on your calendar after you published it. The site
      still shows what you approved.
      <button class="link" @click="takeSourceText">Use the new text</button>
    </p>

    <label class="field">
      <span class="label">Title</span>
      <input v-model="form.summary" type="text" placeholder="Band @ Venue" />
    </label>

    <label class="field">
      <span class="label">Venue</span>
      <input v-model="form.location" type="text" placeholder="The Green Mill, Chicago" />
    </label>

    <label class="field">
      <span class="label">Details</span>
      <textarea v-model="form.description" placeholder="Set times, cover, lineup…"></textarea>
      <span class="hint muted">
        Everything here is public. Clear anything from a band invite you wouldn't
        put on the website — a fee, a phone number, a home address.
      </span>
    </label>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <template #footer>
      <button
        v-if="!published"
        class="btn btn-primary btn-block"
        :disabled="!canSave"
        @click="create"
      >
        {{ busy ? 'Publishing…' : 'Publish gig' }}
      </button>

      <template v-else>
        <button class="btn btn-primary btn-block" :disabled="!canSave" @click="update">
          {{ busy ? 'Saving…' : 'Update listing' }}
        </button>
        <button
          v-if="!confirming"
          class="btn btn-danger btn-block"
          :disabled="busy"
          @click="confirming = true"
        >
          Remove from site
        </button>
        <div v-else class="confirm">
          <span>Take this off the site?</span>
          <div class="confirm-actions">
            <button class="btn" :disabled="busy" @click="confirming = false">Keep</button>
            <button class="btn btn-danger" :disabled="busy" @click="remove">
              {{ busy ? 'Removing…' : 'Remove' }}
            </button>
          </div>
        </div>
      </template>
    </template>
  </SheetModal>
</template>

<style scoped>
.intro {
  margin: 0;
  font-size: 0.88rem;
}

.drift {
  margin: 0;
  padding: 0.7rem 0.85rem;
  border-radius: 10px;
  background: var(--warn-soft);
  border: 1px solid var(--warn-line);
  color: var(--warn);
  font-size: 0.88rem;
}

.link {
  color: var(--accent);
  text-decoration: underline;
  padding: 0;
  font-size: inherit;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
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

.confirm {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.confirm-actions {
  display: flex;
  gap: 0.5rem;
}

.confirm-actions .btn {
  flex: 1;
}
</style>
