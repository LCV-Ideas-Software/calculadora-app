import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    license: {
      fileName: 'legal/THIRD-PARTY-NOTICES.json'
    },
    rolldownOptions: {
      output: {
        postBanner: '/* Third-party notices: /legal/THIRD-PARTY-NOTICES.json */'
      }
    }
  },
  optimizeDeps: {
    exclude: ['lightningcss']
  }
})
