<script setup>
import { ref } from 'vue'
import { calendars } from '../../lib/store.js'
import { posterCalendarId, setPosterCalendarId } from './tool.js'

const emit = defineEmits(['changed'])

const chosen = ref(posterCalendarId())

function choose(id) {
  chosen.value = id
  setPosterCalendarId(id)
  emit('changed')
}
</script>

<template>
  <label class="field">
    <span class="label">Your gigs are on</span>
    <!-- Every calendar, not just writable ones: a band calendar shared with you
         read-only is a perfectly good place to find gigs. -->
    <select :value="chosen" @change="choose($event.target.value)">
      <option value="" disabled>Choose a calendar</option>
      <option v-for="calendar in calendars" :key="calendar.id" :value="calendar.id">
        {{ calendar.summary }}
      </option>
    </select>
    <span class="hint muted">
      Where posts look for gigs. If they share a calendar with everything else,
      pick it anyway — you can leave events out of any post.
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
