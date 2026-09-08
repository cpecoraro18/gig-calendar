<script>
/**
 * How many sheets are open, counted across every instance — which is why it
 * lives out here rather than in `setup`, where each sheet would keep its own.
 * One sheet replacing another (the event sheet handing over to a tool) mounts
 * the new one before unmounting the old, so a plain lock/unlock pair would
 * leave the page scrolling behind an open sheet.
 */
let open = 0
</script>

<script setup>
import { onMounted, onUnmounted } from 'vue'

defineProps({
  title: { type: String, default: '' },
  /** What a screen reader announces — the sheets with a custom header have no visible one. */
  label: { type: String, default: 'Details' },
})

const emit = defineEmits(['close'])

/**
 * Every sheet in the app is this component, so Escape, the scrim tap and the
 * locked background scroll are written once. A sheet that lets the page behind
 * it scroll is the single most obvious way a phone web app gives itself away.
 */
function onKey(event) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKey)
  open += 1
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKey)
  open -= 1
  if (open <= 0) document.body.style.overflow = ''
})
</script>

<template>
  <div class="scrim" @click.self="emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" :aria-label="label">
      <div class="grab" aria-hidden="true"></div>
      <header v-if="title || $slots.header" class="sheet-head">
        <slot name="header">
          <h2>{{ title }}</h2>
        </slot>
        <button class="btn close" aria-label="Close" @click="emit('close')">✕</button>
      </header>
      <div class="sheet-body">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="sheet-foot">
        <slot name="footer" />
      </footer>
    </section>
  </div>
</template>

<style scoped>
.scrim {
  position: fixed;
  inset: 0;
  z-index: 30;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fade 0.15s ease;
}

.sheet {
  width: 100%;
  max-width: 34rem;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-top: 1px solid var(--line);
  border-radius: 18px 18px 0 0;
  animation: rise 0.18s cubic-bezier(0.2, 0.8, 0.3, 1);
}

.grab {
  width: 2.2rem;
  height: 4px;
  border-radius: 999px;
  background: var(--surface-3);
  margin: 0.55rem auto 0;
  flex: none;
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 1.15rem 0.4rem;
  flex: none;
}

.sheet-head h2 {
  font-size: 1.05rem;
  margin: 0;
}

.close {
  min-height: 36px;
  min-width: 36px;
  padding: 0;
  border-radius: 999px;
  flex: none;
}

.sheet-body {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0.4rem 1.15rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* The footer holds the actions, so it stays put while the body scrolls. */
.sheet-foot {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.85rem 1.15rem calc(1.1rem + env(safe-area-inset-bottom));
  border-top: 1px solid var(--line);
  background: var(--surface);
}

@keyframes rise {
  from {
    transform: translateY(12%);
  }
}

@keyframes fade {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .scrim,
  .sheet {
    animation: none;
  }
}
</style>
