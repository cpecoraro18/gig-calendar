import { createApp } from 'vue'
import App from './App.vue'
import { registerServiceWorker } from './lib/pwa'
import './style.css'
import './lib/theme'

createApp(App).mount('#app')
registerServiceWorker()
