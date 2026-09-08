<script setup>
import { computed, reactive, ref } from 'vue'
import { REPEATS, syncDraftMode, shiftDraftEnd, isRecurringInstance } from '../lib/events'
import { writableCalendars, calendarName } from '../lib/store'
import SheetModal from './SheetModal.vue'

const props = defineProps({
  /** The draft to edit — already built by the caller, new or from an event. */
  draft: { type: Object, required: true },
  /** Present when editing; absent when creating. */
  event: { type: Object, default: null },
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'save'])

const form = reactive({ ...props.draft })
const lastStart = ref(form.startLocal)

const isNew = computed(() => !props.event)
const partOfSeries = computed(() => isRecurringInstance(props.event))
const canSave = computed(() => form.summary.trim().length > 0 && !props.busy)

function onAllDay() {
  syncDraftMode(form)
}

/** Moving the start drags the end along, the way every calendar app does. */
function onStartChange() {
  shiftDraftEnd(form, lastStart.value)
  lastStart.value = form.startLocal
}

function onStartDayChange() {
  if (form.endDay < form.startDay) form.endDay = form.startDay
}
</script>

<template>
  <SheetModal :title="isNew ? 'New event' : 'Edit event'" label="Event editor" @close="emit('close')">
    <label class="field">
      <span class="label">Title</span>
      <input
        v-model="form.summary"
        type="text"
        placeholder="What is it?"
        enterkeyhint="done"
        autocapitalize="sentences"
      />
    </label>

    <label class="switch">
      <input v-model="form.allDay" type="checkbox" @change="onAllDay" />
      <span>All day</span>
    </label>

    <div class="pair">
      <template v-if="form.allDay">
        <label class="field">
          <span class="label">Starts</span>
          <input v-model="form.startDay" type="date" @change="onStartDayChange" />
        </label>
        <label class="field">
          <span class="label">Ends</span>
          <input v-model="form.endDay" type="date" :min="form.startDay" />
        </label>
      </template>
      <template v-else>
        <label class="field">
          <span class="label">Starts</span>
          <input v-model="form.startLocal" type="datetime-local" @change="onStartChange" />
        </label>
        <label class="field">
          <span class="label">Ends</span>
          <input v-model="form.endLocal" type="datetime-local" />
        </label>
      </template>
    </div>

    <label class="field">
      <span class="label">Where</span>
      <input v-model="form.location" type="text" placeholder="Venue or address" />
    </label>

    <label class="field">
      <span class="label">Notes</span>
      <textarea v-model="form.description" placeholder="Anything worth remembering"></textarea>
    </label>

    <!-- One occurrence of a series can't be moved to another calendar — Google
         refuses it, and the sensible reading of the request is to move the
         whole series, which belongs in Google Calendar. -->
    <label class="field">
      <span class="label">Calendar</span>
      <select v-model="form.calendarId" :disabled="partOfSeries">
        <option v-for="calendar in writableCalendars" :key="calendar.id" :value="calendar.id">
          {{ calendar.summary }}
        </option>
      </select>
      <span v-if="!isNew && form.calendarId !== event.calendarId" class="hint muted">
        Saving moves this event to {{ calendarName(form.calendarId) }}.
      </span>
    </label>

    <!-- Editing one night of a residency shouldn't silently rewrite the series,
         so the repeat control is only offered where it means what it says. -->
    <label v-if="!partOfSeries" class="field">
      <span class="label">Repeat</span>
      <select v-model="form.recurrence">
        <option v-for="option in REPEATS" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </label>
    <p v-else class="hint muted series">
      This is one occurrence of a repeating event. Changes here apply to this
      occurrence only — edit the series in Google Calendar.
    </p>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <template #footer>
      <button class="btn btn-primary btn-block" :disabled="!canSave" @click="emit('save', form)">
        {{ busy ? 'Saving…' : isNew ? 'Create event' : 'Save changes' }}
      </button>
    </template>
  </SheetModal>
</template>

<style scoped>
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

.pair {
  display: grid;
  gap: 0.9rem;
}

.switch {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: var(--tap);
  font-size: 0.95rem;
}

.switch input {
  width: 1.15rem;
  height: 1.15rem;
  accent-color: var(--accent);
}

.hint {
  font-size: 0.8rem;
}

.series {
  margin: 0;
}

@media (min-width: 30rem) {
  .pair {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
