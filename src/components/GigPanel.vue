<script setup>
import { ref, computed, watch } from 'vue'
import { startOf, formatDayHeading, formatTimeRange } from '../lib/dates'
import { gigState, STATE } from '../lib/gigs'

const props = defineProps({
  event: { type: Object, required: true },
  gig: { type: Object, default: null },
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'create', 'update', 'remove'])

const form = ref({ summary: '', location: '', description: '' })
const confirmingRemove = ref(false)

/**
 * The published gig wins when there is one — you're looking at what the site
 * currently says, not at the source event you've already edited away from.
 */
watch(
  () => [props.event?.id, props.gig?.id],
  () => {
    const seed = props.gig || props.event
    form.value = {
      summary: seed.summary || '',
      location: seed.location || '',
      description: seed.description || '',
    }
    confirmingRemove.value = false
  },
  { immediate: true }
)

const state = computed(() => gigState(props.event, props.gig))
const isPublished = computed(() => state.value !== STATE.unpublished)
const when = computed(() => {
  const start = startOf(props.event)
  return start ? `${formatDayHeading(start)} · ${formatTimeRange(props.event)}` : ''
})

/** Nothing on the site should ever be a blank row. */
const canSave = computed(() => form.value.summary.trim().length > 0 && !props.busy)

/** Offers the source's current text when it has moved on since you published. */
function takeSourceText() {
  form.value = {
    summary: props.event.summary || '',
    location: props.event.location || '',
    description: props.event.description || '',
  }
}
</script>

<template>
  <div class="scrim" @click.self="emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" aria-label="Gig details">
      <header>
        <div class="what">
          <span class="when muted">{{ when }}</span>
          <span v-if="state === STATE.published" class="chip chip-live">On site</span>
          <span v-else-if="state === STATE.drifted" class="chip chip-warn">Source changed</span>
        </div>
        <button class="btn close" aria-label="Close" @click="emit('close')">✕</button>
      </header>

      <p v-if="state === STATE.drifted" class="drift">
        This event was edited on your calendar after you published it. The site
        still shows what you approved.
        <button class="link" @click="takeSourceText">Use the new text</button>
      </p>

      <div class="fields">
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
          <span class="hint muted">Shown under the listing on chrispecmusic.com.</span>
        </label>
      </div>

      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <footer>
        <template v-if="!isPublished">
          <button class="btn btn-primary btn-block" :disabled="!canSave" @click="emit('create', form)">
            {{ busy ? 'Creating…' : 'Create gig' }}
          </button>
        </template>

        <template v-else>
          <button class="btn btn-primary btn-block" :disabled="!canSave" @click="emit('update', form)">
            {{ busy ? 'Saving…' : 'Update listing' }}
          </button>

          <button
            v-if="!confirmingRemove"
            class="btn btn-danger btn-block"
            :disabled="busy"
            @click="confirmingRemove = true"
          >
            Remove from site
          </button>
          <div v-else class="confirm">
            <span class="muted">Take this off the site?</span>
            <div class="confirm-actions">
              <button class="btn" :disabled="busy" @click="confirmingRemove = false">Keep</button>
              <button class="btn btn-danger" :disabled="busy" @click="emit('remove')">
                {{ busy ? 'Removing…' : 'Remove' }}
              </button>
            </div>
          </div>
        </template>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.scrim {
  position: fixed;
  inset: 0;
  z-index: 20;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet {
  width: 100%;
  max-width: 34rem;
  max-height: 92vh;
  overflow-y: auto;
  background: var(--surface);
  border-top: 1px solid var(--line);
  border-radius: 16px 16px 0 0;
  padding: 1rem 1.15rem calc(1.15rem + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.what {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.when {
  font-size: 0.9rem;
}

.close {
  min-height: 36px;
  padding: 0 0.7rem;
  border-radius: 8px;
}

.drift {
  margin: 0;
  padding: 0.7rem 0.85rem;
  border-radius: 10px;
  background: var(--warn-soft);
  border: 1px solid #4a3a1c;
  color: var(--warn);
  font-size: 0.88rem;
}

.link {
  color: var(--accent);
  text-decoration: underline;
  padding: 0;
  font-size: inherit;
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.hint {
  font-size: 0.8rem;
}

.error {
  margin: 0;
  padding: 0.7rem 0.85rem;
  border-radius: 10px;
  background: var(--danger-soft);
  border: 1px solid #5a3229;
  color: var(--danger);
  font-size: 0.88rem;
}

footer {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.confirm {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--line);
  border-radius: 10px;
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
