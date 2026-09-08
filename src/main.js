import { createApp } from 'vue'
import App from './App.vue'
import { registerServiceWorker } from './lib/pwa'
import './style.css'

createApp(App).mount('#app')
registerServiceWorker()
