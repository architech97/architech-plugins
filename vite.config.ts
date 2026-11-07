import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Staging is served from https://<user>.github.io/architech-plugins/ ; a custom domain later sets BASE=/.
const base = process.env.BASE ?? '/architech-plugins/'

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
  },
})
