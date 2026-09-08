<script setup>
import { computed } from 'vue'
import { timeLabel, isPast } from '../lib/events'
import { colorOf, calendarName } from '../lib/store'
import { badgesFor } from '../tools/registry'

const props = defineProps({
  event: { type: Object, required: true },
  /** Which day this row appears under — a multi-day event reads differently. */
  day: { type: Date, default: null },
  toolStates: { type: Object, default: () => ({}) },
  showCalendar: { type: Boolean, default: false },
})

defineEmits(['open'])

const badges = computed(() => badgesFor(props.event, props.toolStates))
</script>

<template>
  <button class="row" :class="{ past: isPast(event) }" @click="$emit('open', event)">
    <span class="stripe" :style="{ background: colorOf(event) }" aria-hidden="true"></span>
    <span class="time">{{ timeLabel(event, day) }}</span>
    <span class="body">
      <span class="title">{{ event.summary || '(no title)' }}</span>
      <span v-if="event.location" class="sub muted">{{ event.location.split(',')[0] }}</span>
      <span v-else-if="showCalendar" class="sub muted">{{ calendarName(event.calendarId) }}</span>
    </span>
    <span v-if="badges.length" class="badges">
      <span v-for="badge in badges" :key="badge.tool" class="chip" :class="`chip-${badge.tone}`">
        {{ badge.label }}
      </span>
    </span>
  </button>
</template>

<style scoped>
.row {
  position: relative;
  display: grid;
  grid-template-columns: 5.2rem 1fr auto;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  min-height: var(--tap);
  padding: 0.6rem 1rem 0.6rem 1.1rem;
  text-align: left;
  border-top: 1px solid var(--line);
  background: var(--surface);
}

/* The calendar's colour, as a hairline down the left edge: enough to tell two
   calendars apart at a glance without painting the whole row. */
.stripe {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}

.row:active {
  background: var(--surface-2);
}

/* Past events stay in the list — you still act on them after the fact — but
   they shouldn't compete with what's coming up. */
.row.past {
  opacity: 0.5;
}

.time {
  font-size: 0.76rem;
  font-variant-numeric: tabular-nums;
  color: var(--ink-2);
  line-height: 1.35;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  min-width: 0;
}

.title,
.sub {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title {
  font-weight: 500;
}

.sub {
  font-size: 0.78rem;
}

.badges {
  display: flex;
  gap: 0.3rem;
  justify-content: flex-end;
}

@media (hover: hover) {
  .row:hover {
    background: var(--surface-2);
  }
}

@media (min-width: 640px) {
  .row {
    grid-template-columns: 6.5rem 1fr auto;
  }
}
</style>
