<script setup>
defineProps({
  calendars: { type: Array, required: true },
  sourceId: { type: String, default: '' },
  destId: { type: String, default: '' },
  /** First run has nothing chosen yet, so there is nothing to go back to. */
  dismissable: { type: Boolean, default: true },
})

const emit = defineEmits(['update:sourceId', 'update:destId', 'close'])

/** Only calendars you can write to can receive a gig. */
const WRITABLE = ['owner', 'writer']
const canWrite = (calendar) => WRITABLE.includes(calendar.accessRole)
</script>

<template>
  <div class="settings">
    <header>
      <h2>Calendars</h2>
      <button v-if="dismissable" class="btn" @click="emit('close')">Done</button>
    </header>

    <label class="field">
      <span class="label">Browse</span>
      <select
        :value="sourceId"
        @change="emit('update:sourceId', $event.target.value)"
      >
        <option value="" disabled>Choose a calendar…</option>
        <option v-for="calendar in calendars" :key="calendar.id" :value="calendar.id">
          {{ calendar.summary }}
        </option>
      </select>
      <span class="hint muted">The calendar you look through — invites included.</span>
    </label>

    <label class="field">
      <span class="label">Publish to</span>
      <select
        :value="destId"
        @change="emit('update:destId', $event.target.value)"
      >
        <option value="" disabled>Choose a calendar…</option>
        <option
          v-for="calendar in calendars"
          :key="calendar.id"
          :value="calendar.id"
          :disabled="!canWrite(calendar)"
        >
          {{ calendar.summary }}{{ canWrite(calendar) ? '' : ' — read only' }}
        </option>
      </select>
      <span class="hint muted">
        The calendar chrispecmusic.com reads. Creating a gig writes here.
      </span>
    </label>

    <p v-if="sourceId && sourceId === destId" class="warning">
      Browsing and publishing to the same calendar means every gig you create
      shows up again as a new event to review. Pick a separate gigs calendar.
    </p>
  </div>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  padding: 1.25rem;
  max-width: 34rem;
  margin: 0 auto;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

h2 {
  font-size: 1.15rem;
  margin: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.label {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.hint {
  font-size: 0.85rem;
}

.warning {
  margin: 0;
  padding: 0.7rem 0.85rem;
  border-radius: 10px;
  background: var(--warn-soft);
  border: 1px solid #4a3a1c;
  color: var(--warn);
  font-size: 0.88rem;
}
</style>
