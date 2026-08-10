import { spawnSync } from 'node:child_process'

if (process.env.VERCEL !== '1') {
  process.exit(0)
}

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)
