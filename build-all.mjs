// Build all 6 pages individually (vite-plugin-singlefile requires single input per build)
import { execSync } from 'child_process'
import { rmSync, mkdirSync } from 'fs'

// Clean dist/
try { rmSync('dist', { recursive: true }) } catch {}
mkdirSync('dist', { recursive: true })

const pages = ['index', 'expanding', 'addition', 'subtraction', 'multiplication', 'division']

for (const page of pages) {
  console.log(`\n--- Building ${page} ---`)
  execSync('npx vite build', {
    env: { ...process.env, VITE_PAGE: page },
    stdio: 'inherit',
  })
}

console.log('\n✅ All pages built successfully.')
