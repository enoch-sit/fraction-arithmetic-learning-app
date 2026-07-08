import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Build one page at a time (vite-plugin-singlefile requires single input)
// Set VITE_PAGE env var to select which page: index, expanding, addition, subtraction, multiplication, division, comparison
const page = process.env.VITE_PAGE || 'index'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'docs',
    emptyOutDir: false, // handled by build-all.mjs
    rollupOptions: {
      input: `${page}.html`,
    },
  },
})
