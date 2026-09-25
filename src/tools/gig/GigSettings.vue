<script setup>
import { ref } from 'vue'
import { writableCalendars } from '../../lib/store.js'
import { gigCalendarId, setGigCalendarId } from './tool.js'

const emit = defineEmits(['changed'])

const chosen = ref(gigCalendarId())

function choose(id) {
  chosen.value = id
  setGigCalendarId(id)
  emit('changed')
}
</script>

<template>
  <label class="field">
    <span class="label">Website calendar</span>
    <select :value="chosen" @change="choose($event.target.value)">
      <option value="">None — I don't have one</option>
      <option v-for="calendar in writableCalendars" :key="calendar.id" :value="calendar.id">
        {{ calendar.summary }}
      </option>
    </select>
    <span class="hint muted">
      Optional. If your website lists gigs from a Google Calendar, choose it
      here and every event gets a button to put it on the site. Nothing else
      in this app writes to it.
    </span>
  </label>
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

.hint {
  font-size: 0.82rem;
}
</style>
