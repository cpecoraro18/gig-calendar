<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { parseYmd, ymd, formatDayHeading, formatMonth, isToday, startOfDay } from '../lib/dates'
import { sortEvents } from '../lib/events'
import { eventsByDay, loading } from '../lib/store'
import EventRow from './EventRow.vue'

defineProps({
  toolStates: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['open-event', 'extend'])

const showingPast = ref(false)
const todayAnchor = ref(null)

/**
 * An agenda skips empty days entirely. A month of blank rows is the reason
 * scrolling a list view usually feels worse than it should.
 */
const days = computed(() => {
  const today = ymd(startOfDay(new Date()))
  const groups = []
  let lastMonth = null

  for (const key of [...eventsByDay.value.keys()].sort()) {
    if (!showingPast.value && key < today) continue
    const date = parseYmd(key)
    const month = `${date.getFullYear()}-${date.getMonth()}`
    groups.push({
      key,
      date,
      // Only the first day of a month carries the month label, so the list
      // stays scannable instead of repeating "October 2026" thirty times.
      month: month === lastMonth ? null : formatMonth(date),
      events: sortEvents(eventsByDay.value.get(key)),
    })
    lastMonth = month
  }
  return groups
})

const hasPast = computed(() => {
  const today = ymd(startOfDay(new Date()))
  return [...eventsByDay.value.keys()].some((key) => key < today)
})

/** Opening on today, not on whatever the earliest loaded day happens to be. */
onMounted(async () => {
  await nextTick()
  todayAnchor.value?.scrollIntoView({ block: 'start' })
})
</script>

<template>
  <div class="agenda">
    <div v-if="hasPast" class="edge">
      <button v-if="!showingPast" class="btn btn-quiet" @click="showingPast = true">
        Show earlier
      </button>
      <button v-else class="btn btn-quiet" @click="showingPast = false">Hide earlier</button>
    </div>

    <p v-if="!days.length && !loading" class="empty muted">
      Nothing on your calendars in this stretch.
    </p>

    <section v-for="day in days" :key="day.key" class="day">
      <h2 v-if="day.month" class="month">{{ day.month }}</h2>

      <h3
        class="heading"
        :class="{ today: isToday(day.date) }"
        :ref="(el) => { if (isToday(day.date)) todayAnchor = el }"
      >
        {{ formatDayHeading(day.date) }}
        <span v-if="isToday(day.date)" class="today-tag">Today</span>
      </h3>

      <ul class="rows">
        <li v-for="event in day.events" :key="`${event.calendarId}|${event.id}`">
          <EventRow
            :event="event"
            :day="day.date"
            :tool-states="toolStates"
            show-calendar
            @open="emit('open-event', $event)"
          />
        </li>
      </ul>
    </section>

    <div class="edge">
      <button class="btn btn-quiet" :disabled="loading" @click="emit('extend')">
        {{ loading ? 'Loading…' : 'Load more' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.agenda {
  padding-bottom: 6rem;
}

.edge {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.month {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 1.8rem 1rem 0.25rem;
}

.day:first-of-type .month {
  margin-top: 0.5rem;
}

.heading {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ink-2);
  margin: 1rem 1rem 0.35rem;
  scroll-margin-top: 3.6rem;
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

.rows li:last-child :deep(.row) {
  border-bottom: 1px solid var(--line);
}

.empty {
  text-align: center;
  padding: 3rem 1.5rem;
}
</style>
