// Build all 6 pages individually (vite-plugin-singlefile requires single input per build)
import { execSync } from 'child_process'
import { rmSync, mkdirSync } from 'fs'

// Clean docs/
try { rmSync('docs', { recursive: true }) } catch {}
mkdirSync('docs', { recursive: true })

const pages = ['index', 'expanding', 'addition', 'subtraction', 'multiplication', 'division', 'comparison', 'equivalent', 'intfracconv']

for (const page of pages) {
  console.log(`\n--- Building ${page} ---`)
  execSync('npx vite build', {
    env: { ...process.env, VITE_PAGE: page },
    stdio: 'inherit',
  })
}

console.log('\n✅ All pages built successfully.')
