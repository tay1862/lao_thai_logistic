import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'

const rootDir = process.cwd()
const standaloneDir = resolve(rootDir, '.next/standalone')
const standaloneServer = resolve(standaloneDir, 'server.js')
const standaloneNextDir = resolve(standaloneDir, '.next')
const staticSource = resolve(rootDir, '.next/static')
const staticTarget = resolve(standaloneNextDir, 'static')
const publicSource = resolve(rootDir, 'public')
const publicTarget = resolve(standaloneDir, 'public')

if (!existsSync(standaloneServer)) {
  console.error('Missing standalone build output. Run "npm run build" before "npm run start".')
  process.exit(1)
}

mkdirSync(standaloneNextDir, { recursive: true })

if (existsSync(staticSource)) {
  rmSync(staticTarget, { recursive: true, force: true })
  cpSync(staticSource, staticTarget, { recursive: true })
}

if (existsSync(publicSource)) {
  rmSync(publicTarget, { recursive: true, force: true })
  cpSync(publicSource, publicTarget, { recursive: true })
}

const args = process.argv.slice(2)
const env = { ...process.env }

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  const nextArg = args[index + 1]

  if (arg === '--port' && nextArg) {
    env.PORT = nextArg
    index += 1
    continue
  }

  if (arg === '--hostname' && nextArg) {
    env.HOSTNAME = nextArg
    index += 1
  }
}

const child = spawn(process.execPath, [standaloneServer], {
  cwd: standaloneDir,
  env,
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
