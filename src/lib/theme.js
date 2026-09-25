/**
 * Light or dark. Dark is what a phone wants in a venue at eleven at night;
 * light is what it wants at a bus stop at noon. Following the system gets both
 * right without a setting, and the setting is there for the phone that's wrong.
 *
 * The resolved choice lands on <html data-theme>, which is all the stylesheet
 * reads. index.html sets it once before the bundle loads, so a light phone
 * doesn't flash dark on launch.
 */
import { computed, ref } from 'vue'
import { readPref, writePref } from './prefs.js'

const KEY = 'app.theme'

export const THEMES = [
  { id: 'system', label: 'Match this device' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

const query = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: light)') : null
const systemLight = ref(Boolean(query?.matches))
query?.addEventListener?.('change', (event) => {
  systemLight.value = event.matches
  apply()
})

export const themeChoice = ref(THEMES.some((t) => t.id === readPref(KEY)) ? readPref(KEY) : 'system')

export const isLight = computed(() =>
  themeChoice.value === 'system' ? systemLight.value : themeChoice.value === 'light'
)

function apply() {
  const light = isLight.value
  document.documentElement.dataset.theme = light ? 'light' : 'dark'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#f6f7f9' : '#0f1216')
}

export function setTheme(id) {
  themeChoice.value = id
  writePref(KEY, id)
  apply()
}

apply()
