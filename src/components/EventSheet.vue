<script setup>
import { computed, ref } from 'vue'
import { formatLongDay, formatTime, isSameDay } from '../lib/dates'
import { eventStart, eventEnd, isAllDay, repeatLabel, isRecurringInstance } from '../lib/events'
import { colorOf, calendarName, canWrite } from '../lib/store'
import { toolsFor, badgesFor } from '../tools/registry'
import SheetModal from './SheetModal.vue'

const props = defineProps({
  event: { type: Object, required: true },
  toolStates: { type: Object, default: () => ({}) },
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'edit', 'remove', 'open-tool'])

const confirming = ref(false)

const editable = computed(() => canWrite(props.event.calendarId))
const tools = computed(() => toolsFor(props.event, props.toolStates))
const badges = computed(() => badgesFor(props.event, props.toolStates))

/** The one line that answers "when is this", however the event is shaped. */
const when = computed(() => {
  const start = eventStart(props.event)
  const end = eventEnd(props.event)
  if (!start) return ''
  if (isAllDay(props.event)) {
    const last = end ? new Date(end.getTime() - 1) : start
    return isSameDay(start, last)
      ? `${formatLongDay(start)} · all day`
      : `${formatLongDay(start)} → ${formatLongDay(last)}`
  }
  if (!end) return `${formatLongDay(start)} · ${formatTime(start)}`
  return isSameDay(start, end)
    ? `${formatLongDay(start)} · ${formatTime(start)} – ${formatTime(end)}`
    : `${formatLongDay(start)} ${formatTime(start)} → ${formatLongDay(end)} ${formatTime(end)}`
})

const repeats = computed(() => repeatLabel(props.event))
const mapsUrl = computed(
  () => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.event.location)}`
)
</script>

<template>
  <SheetModal label="Event" @close="emit('close')">
    <template #header>
      <div class="what">
        <h2>{{ event.summary || '(no title)' }}</h2>
        <div class="tags">
          <span class="cal">
            <span class="swatch" :style="{ background: colorOf(event) }" aria-hidden="true"></span>
            {{ calendarName(event.calendarId) }}
          </span>
          <span v-for="badge in badges" :key="badge.tool" class="chip" :class="`chip-${badge.tone}`">
            {{ badge.label }}
          </span>
        </div>
      </div>
    </template>

    <dl class="facts">
      <div class="fact">
        <dt>When</dt>
        <dd>
          {{ when }}
          <span v-if="repeats" class="muted"> · {{ repeats }}</span>
        </dd>
      </div>

      <div v-if="event.location" class="fact">
        <dt>Where</dt>
        <dd>
          <a :href="mapsUrl" target="_blank" rel="noreferrer">{{ event.location }}</a>
        </dd>
      </div>

      <div v-if="event.description" class="fact">
        <dt>Notes</dt>
        <dd class="notes">{{ event.description }}</dd>
      </div>

      <div v-if="event.attendees?.length" class="fact">
        <dt>Who</dt>
        <dd class="muted">
          {{ event.attendees.length }} guest{{ event.attendees.length === 1 ? '' : 's' }} — reply in
          Google Calendar
        </dd>
      </div>
    </dl>

    <!-- Tools are what this app has that Google Calendar doesn't, so they get
         their own block rather than hiding in an overflow menu. -->
    <section v-if="tools.length" class="tools">
      <h3>Tools</h3>
      <button
        v-for="tool in tools"
        :key="tool.id"
        class="tool"
        @click="emit('open-tool', tool)"
      >
        <span class="tool-icon" aria-hidden="true">{{ tool.icon }}</span>
        <span class="tool-text">
          <span class="tool-title">{{ tool.title }}</span>
          <span v-if="tool.blurb" class="tool-blurb muted">{{ tool.blurb }}</span>
        </span>
        <span class="chev" aria-hidden="true">›</span>
      </button>
    </section>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <template #footer>
      <p v-if="!editable" class="muted read-only">
        This calendar is shared with you read-only, so its events can't be changed here.
      </p>
      <template v-else-if="!confirming">
        <button class="btn btn-primary btn-block" @click="emit('edit')">Edit event</button>
        <button class="btn btn-danger btn-block" :disabled="busy" @click="confirming = true">
          Delete
        </button>
      </template>
      <div v-else class="confirm">
        <span>
          {{
            isRecurringInstance(event)
              ? 'Delete this one occurrence?'
              : 'Delete this event?'
          }}
        </span>
        <div class="confirm-actions">
          <button class="btn" :disabled="busy" @click="confirming = false">Keep</button>
          <button class="btn btn-danger" :disabled="busy" @click="emit('remove')">
            {{ busy ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </template>
  </SheetModal>
</template>

<style scoped>
.what {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.what h2 {
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.25;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.cal {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: var(--ink-2);
}

.swatch {
  width: 9px;
  height: 9px;
  border-radius: 999px;
}

.facts {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.fact {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

dt {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
}

dd {
  margin: 0;
  font-size: 0.95rem;
}

.notes {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

a {
  color: var(--accent);
}

.tools {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-top: 0.2rem;
}

.tools h3 {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin: 0 0 0.1rem;
}

.tool {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  min-height: var(--tap);
  padding: 0.6rem 0.75rem;
  text-align: left;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface-2);
}

.tool-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 999px;
  background: var(--surface-3);
  color: var(--accent);
  flex: none;
}

.tool-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.tool-title {
  font-weight: 600;
  font-size: 0.92rem;
}

.tool-blurb {
  font-size: 0.78rem;
}

.chev {
  color: var(--ink-3);
  font-size: 1.2rem;
}

.read-only {
  margin: 0;
  font-size: 0.85rem;
  text-align: center;
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
