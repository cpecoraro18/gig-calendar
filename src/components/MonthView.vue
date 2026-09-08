<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  monthGrid,
  weekdayNames,
  ymd,
  formatTime,
  isToday,
  isSameDay,
  isSameMonth,
  formatLongDay,
} from '../lib/dates'
import { sortEvents, isAllDay, eventStart } from '../lib/events'
import { eventsByDay, colorOf } from '../lib/store'
import { tint, readable } from '../lib/colors'
import EventRow from './EventRow.vue'

const props = defineProps({
  month: { type: Date, required: true },
  selected: { type: Date, required: true },
  toolStates: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['select-day', 'open-event', 'step-month'])

const weekdays = weekdayNames()

/**
 * How many titles fit in a day before the cell stops being a calendar and
 * becomes a wall of text. Three is what a phone can hold at a readable size;
 * a wider screen has room for more.
 */
const wide = ref(false)
let media = null

function trackWidth(event) {
  wide.value = event.matches
}

onMounted(() => {
  media = window.matchMedia('(min-width: 640px)')
  wide.value = media.matches
  media.addEventListener('change', trackWidth)
})

onUnmounted(() => media?.removeEventListener('change', trackWidth))

const perCell = computed(() => (wide.value ? 5 : 3))

/**
 * The whole grid, resolved once. Each cell asks the same three questions, and
 * asking them in the template would re-sort forty-two days on every render.
 */
const weeks = computed(() =>
  monthGrid(props.month).map((week) =>
    week.map((day) => {
      const events = sortEvents(eventsByDay.value.get(ymd(day)) || [])
      return {
        day,
        key: ymd(day),
        shown: events.slice(0, perCell.value),
        extra: Math.max(events.length - perCell.value, 0),
        count: events.length,
      }
    })
  )
)

const dayEvents = computed(() => sortEvents(eventsByDay.value.get(ymd(props.selected)) || []))

/**
 * All-day events get the filled chip and timed ones a dot, which is the shape
 * every calendar uses — the block is the thing that owns the day, the dot is
 * the thing that happens at a moment in it.
 */
function chipStyle(event) {
  const color = colorOf(event)
  return isAllDay(event)
    ? { background: tint(color), color: readable(color) }
    : { color: 'var(--ink-2)' }
}

/**
 * On a wide screen a timed event leads with its hour, the way it reads on a
 * paper calendar. In a phone-width column the time would eat the title, and
 * the title is the thing you're scanning for — the day list below has the
 * times.
 */
function chipText(event) {
  const title = event.summary || '(no title)'
  if (isAllDay(event) || !wide.value) return title
  const start = eventStart(event)
  return start ? `${formatTime(start)} ${title}` : title
}

/**
 * Swipe between months. A horizontal drag that beats the threshold and stays
 * roughly horizontal counts — anything steeper is the page being scrolled, and
 * stealing that gesture makes the grid feel broken.
 */
const touch = ref(null)

function onTouchStart(event) {
  const point = event.changedTouches[0]
  touch.value = { x: point.clientX, y: point.clientY }
}

function onTouchEnd(event) {
  if (!touch.value) return
  const point = event.changedTouches[0]
  const dx = point.clientX - touch.value.x
  const dy = point.clientY - touch.value.y
  touch.value = null
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    emit('step-month', dx < 0 ? 1 : -1)
  }
}
</script>

<template>
  <div class="month">
    <div class="grid" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
      <div class="weekdays">
        <span v-for="(name, i) in weekdays" :key="i">{{ name }}</span>
      </div>

      <div v-for="(week, w) in weeks" :key="w" class="week">
        <button
          v-for="cell in week"
          :key="cell.key"
          class="cell"
          :class="{
            outside: !isSameMonth(cell.day, month),
            today: isToday(cell.day),
            chosen: isSameDay(cell.day, selected),
          }"
          :aria-label="`${formatLongDay(cell.day)}, ${cell.count} events`"
          :aria-pressed="isSameDay(cell.day, selected)"
          @click="emit('select-day', cell.day)"
        >
          <span class="num">{{ cell.day.getDate() }}</span>

          <span class="stack">
            <span
              v-for="event in cell.shown"
              :key="`${event.calendarId}|${event.id}`"
              class="ev"
              :class="{ timed: !isAllDay(event) }"
              :style="chipStyle(event)"
            >
              <span
                v-if="!isAllDay(event)"
                class="bullet"
                :style="{ background: colorOf(event) }"
                aria-hidden="true"
              ></span>
              <span class="ev-text">{{ chipText(event) }}</span>
            </span>
            <span v-if="cell.extra" class="more">+{{ cell.extra }}</span>
          </span>
        </button>
      </div>
    </div>

    <section class="day-detail">
      <h2 class="day-heading">
        {{ formatLongDay(selected) }}
        <span v-if="isToday(selected)" class="today-tag">Today</span>
      </h2>

      <p v-if="!dayEvents.length" class="empty muted">Nothing scheduled.</p>
      <ul v-else class="rows">
        <li v-for="event in dayEvents" :key="`${event.calendarId}|${event.id}`">
          <EventRow
            :event="event"
            :day="selected"
            :tool-states="toolStates"
            show-calendar
            @open="emit('open-event', $event)"
          />
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.month {
  padding-bottom: 6rem;
}

.grid {
  padding: 0 0.3rem 0.5rem;
  /* The swipe is horizontal, the page scrolls vertically: telling the browser
     so means the grid never eats a scroll it was going to lose anyway. */
  touch-action: pan-y;
}

.weekdays,
.week {
  display: grid;
  /* minmax(0, 1fr), not 1fr: an auto minimum lets one long title widen its
     column and knock the other six out of line. */
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.weekdays {
  padding: 0.2rem 0 0.3rem;
}

.weekdays span {
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--ink-3);
}

.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  /* Titles have to be allowed to be too long for the column, or a grid cell
     stretches to fit its longest event and the seven columns stop lining up. */
  min-width: 0;
  padding: 0.25rem 0.1rem 0.3rem;
  min-height: 4.9rem;
  border-radius: 10px;
  border: 1px solid transparent;
}

.num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-variant-numeric: tabular-nums;
  flex: none;
}

/* Days from the neighbouring months stay visible but recede — the grid keeps
   its shape, and the month you're in is still obvious. */
.outside {
  opacity: 0.45;
}

.today .num {
  color: var(--accent);
  font-weight: 700;
}

.chosen {
  background: var(--surface);
  border-color: var(--line);
}

.chosen .num {
  background: var(--accent);
  color: var(--accent-ink);
  font-weight: 700;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
  min-width: 0;
}

.ev {
  display: flex;
  align-items: center;
  gap: 2px;
  width: 100%;
  min-width: 0;
  padding: 1px 3px;
  border-radius: 3px;
  font-size: 0.58rem;
  line-height: 1.35;
  text-align: left;
}

.ev-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.bullet {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  flex: none;
}

.more {
  padding-left: 3px;
  font-size: 0.56rem;
  color: var(--ink-3);
  text-align: left;
}

.day-detail {
  border-top: 1px solid var(--line);
  padding-top: 0.2rem;
}

.day-heading {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink-2);
  margin: 0.9rem 1rem 0.4rem;
}

.today-tag {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--accent);
}

.empty {
  margin: 0;
  padding: 1.2rem 1rem 2rem;
  font-size: 0.9rem;
}

.rows {
  list-style: none;
  margin: 0;
  padding: 0;
}

.rows li:last-child :deep(.row) {
  border-bottom: 1px solid var(--line);
}

@media (min-width: 640px) {
  .cell {
    min-height: 7rem;
    padding: 0.35rem 0.25rem 0.4rem;
  }

  .ev {
    font-size: 0.72rem;
    padding: 1px 5px;
    gap: 4px;
  }

  .more {
    font-size: 0.68rem;
  }
}
</style>
