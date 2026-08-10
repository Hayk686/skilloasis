import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const standalone = resolve(root, '.next', 'standalone')
if (!existsSync(standalone)) {
  throw new Error('Missing .next/standalone. Ensure output="standalone" is enabled.')
}

const standaloneNext = resolve(standalone, '.next')
mkdirSync(standaloneNext, { recursive: true })
cpSync(resolve(root, '.next', 'static'), resolve(standaloneNext, 'static'), {
  recursive: true,
})
cpSync(resolve(root, 'public'), resolve(standalone, 'public'), { recursive: true })
