<script setup>
import { computed } from 'vue'
import { startOf, dayKey, formatDayHeading, formatMonth, formatTimeRange, isToday, isPast } from '../lib/dates'
import { gigState, STATE } from '../lib/gigs'

const props = defineProps({
  events: { type: Array, required: true },
  gigsBySource: { type: Map, required: true },
})

defineEmits(['select'])

/**
 * An agenda rather than a month grid: gigs are sparse, and a chronological list
 * shows more on a phone than a grid you have to pinch into.
 */
const days = computed(() => {
  const groups = []
  let currentDay = null
  let lastMonth = null

  for (const event of props.events) {
    const start = startOf(event)
    if (!start) continue
    const key = dayKey(start)

    if (!currentDay || currentDay.key !== key) {
      const month = `${start.getFullYear()}-${start.getMonth()}`
      currentDay = {
        key,
        date: start,
        // Only the first day of a month carries the month label, so the list
        // stays scannable instead of repeating "October 2026" thirty times.
        month: month === lastMonth ? null : formatMonth(start),
        events: [],
      }
      lastMonth = month
      groups.push(currentDay)
    }
    currentDay.events.push(event)
  }
  return groups
})

function stateOf(event) {
  return gigState(event, props.gigsBySource.get(event.id))
}
</script>

<template>
  <div class="agenda">
    <section v-for="day in days" :key="day.key" class="day">
      <h2 v-if="day.month" class="month">{{ day.month }}</h2>

      <h3 class="heading" :class="{ today: isToday(day.date) }">
        {{ formatDayHeading(day.date) }}
        <span v-if="isToday(day.date)" class="today-tag">Today</span>
      </h3>

      <ul class="rows">
        <li v-for="event in day.events" :key="event.id">
          <button
            class="row"
            :class="{ past: isPast(event) }"
            @click="$emit('select', event)"
          >
            <span class="time">{{ formatTimeRange(event) }}</span>
            <span class="body">
              <span class="title">{{ event.summary || '(no title)' }}</span>
              <span v-if="event.location" class="location muted">
                {{ event.location.split(',')[0] }}
              </span>
            </span>
            <span class="status">
              <span v-if="stateOf(event) === STATE.published" class="chip chip-live">On site</span>
              <span v-else-if="stateOf(event) === STATE.drifted" class="chip chip-warn">Changed</span>
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.agenda {
  padding: 0 0 5rem;
}

.month {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 2rem 1rem 0.25rem;
}

.day:first-child .month {
  margin-top: 0.75rem;
}

.heading {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ink-2);
  margin: 1.1rem 1rem 0.35rem;
}

.heading.today {
  color: var(--ink);
}

.today-tag {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--accent);
}

.rows {
  list-style: none;
  margin: 0;
  padding: 0;
}

.row {
  display: grid;
  grid-template-columns: 5.4rem 1fr auto;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  min-height: var(--tap);
  padding: 0.7rem 1rem;
  text-align: left;
  border-top: 1px solid var(--line);
  background: var(--surface);
}

.rows li:last-child .row {
  border-bottom: 1px solid var(--line);
}

.row:hover {
  background: var(--surface-2);
}

/* Past events stay in the list — you still publish gigs after playing them —
   but they shouldn't compete with what's coming up. */
.row.past {
  opacity: 0.55;
}

.time {
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
  color: var(--ink-2);
  line-height: 1.3;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.title {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location {
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status {
  display: flex;
  justify-content: flex-end;
}

@media (min-width: 640px) {
  .row {
    grid-template-columns: 7rem 1fr auto;
    border-radius: 0;
  }
}
</style>
