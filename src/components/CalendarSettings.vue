<script setup>
import {
  calendars,
  visible,
  defaultCalendarId,
  writableCalendars,
  toggleCalendar,
  setDefaultCalendar,
} from '../lib/store'
import { toolsWithSettings } from '../tools/registry'
import SheetModal from './SheetModal.vue'
import { ref } from 'vue'

const emit = defineEmits(['close', 'changed', 'sign-out'])

const error = ref('')

/** Ticking a calendar fetches it, and a fetch can fail — say so, here. */
async function show(id) {
  error.value = ''
  try {
    await toggleCalendar(id)
    emit('changed')
  } catch (failure) {
    error.value = failure.message || 'That calendar could not be loaded.'
  }
}
</script>

<template>
  <SheetModal title="Calendars" label="Calendars and tools" @close="emit('close')">
    <section class="block">
      <p class="muted note">
        Tick what you want to see. This is only what this app shows — it changes
        nothing in Google Calendar.
      </p>
      <ul class="list">
        <li v-for="calendar in calendars" :key="calendar.id">
          <label class="cal">
            <input
              type="checkbox"
              :checked="visible[calendar.id]"
              @change="show(calendar.id)"
            />
            <span class="swatch" :style="{ background: calendar.backgroundColor }"></span>
            <span class="name">
              {{ calendar.summary }}
              <span v-if="calendar.primary" class="muted tag">yours</span>
              <span v-else-if="!['owner', 'writer'].includes(calendar.accessRole)" class="muted tag">
                read only
              </span>
            </span>
          </label>
        </li>
      </ul>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </section>

    <section class="block">
      <h3>New events</h3>
      <label class="field">
        <span class="label">Default calendar</span>
        <select :value="defaultCalendarId" @change="setDefaultCalendar($event.target.value)">
          <option v-for="calendar in writableCalendars" :key="calendar.id" :value="calendar.id">
            {{ calendar.summary }}
          </option>
        </select>
        <span class="hint muted">Where the + button puts things unless you change it.</span>
      </label>
    </section>

    <!-- Each tool contributes its own settings, so adding a tool never means
         editing this file. -->
    <section v-for="tool in toolsWithSettings" :key="tool.id" class="block">
      <h3>{{ tool.icon }} {{ tool.title }}</h3>
      <component :is="tool.settings" @changed="emit('changed')" />
    </section>

    <template #footer>
      <button class="btn btn-block" @click="emit('sign-out')">Sign out</button>
    </template>
  </SheetModal>
</template>

<style scoped>
.block {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.block + .block {
  border-top: 1px solid var(--line);
  padding-top: 1rem;
}

h3 {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin: 0;
}

.note {
  margin: 0;
  font-size: 0.85rem;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.cal {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-height: var(--tap);
  cursor: pointer;
}

.cal input {
  width: 1.15rem;
  height: 1.15rem;
  accent-color: var(--accent);
  flex: none;
}

.swatch {
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 999px;
  flex: none;
}

.name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.95rem;
}

.tag {
  font-size: 0.72rem;
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
  font-size: 0.82rem;
}
</style>
