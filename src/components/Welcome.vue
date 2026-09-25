<script setup>
/**
 * Shown once, after a first sign-in. Without it the app opens on a month grid
 * that looks like any other calendar, and nothing says that the ▣ button or the
 * website calendar exist.
 *
 * The questions are the tools' own settings components, so this screen knows
 * no more about any tool than the ⚙ sheet does, and a new tool with a setting
 * turns up here without anyone editing this file.
 */
import { toolsWithSettings } from '../tools/registry'
import SheetModal from './SheetModal.vue'

const emit = defineEmits(['close', 'changed'])
</script>

<template>
  <SheetModal title="Welcome to Gig Calendar" label="Getting started" @close="emit('close')">
    <ul class="what">
      <li>
        <strong>All your Google calendars</strong>, in a month grid or an agenda,
        with create, edit and delete.
      </li>
      <li>
        <strong>▣ Posts for your gigs</strong> — one night, this week or this
        month, as an image for Instagram stories or feed.
      </li>
      <li>
        <strong>♪ Publish to your website</strong>, if yours lists gigs from a
        Google Calendar. Skip it if not.
      </li>
    </ul>

    <p class="muted note">Two quick questions. Both can be changed later under ⚙.</p>

    <section v-for="tool in toolsWithSettings" :key="tool.id" class="block">
      <component :is="tool.settings" @changed="emit('changed')" />
    </section>

    <template #footer>
      <button class="btn btn-primary btn-block" @click="emit('close')">Get started</button>
    </template>
  </SheetModal>
</template>

<style scoped>
.what {
  margin: 0;
  padding-left: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: var(--ink-2);
  font-size: 0.92rem;
}

.what strong {
  color: var(--ink);
}

.note {
  margin: 0;
  font-size: 0.85rem;
}

.block {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  border-top: 1px solid var(--line);
  padding-top: 1rem;
}
</style>
