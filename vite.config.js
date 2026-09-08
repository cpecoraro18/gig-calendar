import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Served from the root of calendar.chrispecmusic.com, so no base path.
export default defineConfig({
  plugins: [vue()],
  server: {
    // Google matches authorised origins exactly, and only :5173 is registered.
    // Without strictPort, a busy port silently moves the dev server to :5174
    // and sign-in fails with an origin error that looks like a config mistake.
    port: 5173,
    strictPort: true,
  },
})
