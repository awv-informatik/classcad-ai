#!/usr/bin/env node
// Starts the ClassCAD MCP server, the npm package @classcad/mcp at the pinned version, on every
// operating system. A plugin's .mcp.json cannot vary by platform; it can start `node`.
//
// The package is installed once, into a folder of its own (~/.classcad-mcp/runtime/<version>), and
// then started straight from there with node. Not through `npx -y` on every start:
//   • a first install can take longer than a host waits for a server to come up (Claude: 30 s,
//     slower on Windows, where every file is scanned). The install runs in a process of its own,
//     detached, so it finishes even when the host gives up; the next start finds it ready;
//   • several sessions starting at once ran several npx installs into one cache folder, which broke
//     it (TAR_ENTRY_ERROR). Here one install runs at a time, under a lock, and the others wait;
//   • an install counts only once it is complete and checked (a marker file written last), so a
//     broken one is replaced by the next start.
// stdin/stdout are passed straight through to the server: this process only waits for it to end.
import { spawn } from 'node:child_process'
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE = '@classcad/mcp@0.3.1'
const NAME = PACKAGE.slice(0, PACKAGE.lastIndexOf('@'))
const VERSION = PACKAGE.slice(PACKAGE.lastIndexOf('@') + 1)

const windows = process.platform === 'win32'
const runtime = join(process.env.CLASSCAD_MCP_HOME || join(homedir(), '.classcad-mcp'), 'runtime')
const dir = join(runtime, VERSION)
const lock = join(runtime, `${VERSION}.lock`)
const marker = join(dir, 'installed.json')
const packageDir = join(dir, 'node_modules', ...NAME.split('/'))
// an install that takes longer than this is taken for dead
const STALE_MS = 10 * 60 * 1000

const say = message => console.error(`[classcad] ${message}`)
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))

/** The installed server's entry, once the install is complete and checked; else null. */
function server() {
  try {
    const installed = JSON.parse(readFileSync(marker, 'utf8'))
    const pkg = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'))
    const bin = typeof pkg.bin === 'string' ? pkg.bin : Object.values(pkg.bin ?? {})[0]
    const entry = bin && join(packageDir, bin)
    if (installed.version === VERSION && pkg.version === VERSION && entry && existsSync(entry)) return entry
  } catch {
    // not installed, or not completely
  }
  return null
}

/** True while another process holds the lock, and it is alive and not stuck. */
function locked() {
  try {
    const { pid, at } = JSON.parse(readFileSync(lock, 'utf8'))
    if (Date.now() - at > STALE_MS) return false
    process.kill(pid, 0)
    return true
  } catch (error) {
    // EPERM: the process exists but belongs to someone else; anything else: no lock, or a dead one
    return error?.code === 'EPERM'
  }
}

// ── The installer: `node launch.mjs --install`, detached, so it outlives a host that gave up ──
async function install() {
  mkdirSync(runtime, { recursive: true })
  let fd
  try {
    fd = openSync(lock, 'wx')
  } catch {
    if (locked()) return // another installer is at it
    rmSync(lock, { force: true })
    try {
      fd = openSync(lock, 'wx')
    } catch {
      return
    }
  }
  try {
    writeFileSync(fd, JSON.stringify({ pid: process.pid, at: Date.now() }))
    closeSync(fd)
    if (server()) return
    // a fresh folder: whatever a broken install left goes first
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'classcad-mcp-runtime', private: true }))
    const code = await new Promise(resolve => {
      const npm = spawn(windows ? 'npm.cmd' : 'npm', ['install', '--no-audit', '--no-fund', '--omit=dev', '--no-package-lock', PACKAGE], {
        cwd: dir,
        stdio: 'ignore',
        // .cmd files only run through the shell on Windows; the arguments are fixed above.
        shell: windows,
        windowsHide: true,
      })
      npm.on('error', () => resolve(1))
      npm.on('exit', resolve)
    })
    if (code !== 0) return
    writeFileSync(marker, JSON.stringify({ version: VERSION, at: new Date().toISOString() }))
    if (!server()) rmSync(marker, { force: true })
    // other versions go once unused for a week (sessions started before an update may still run them)
    for (const name of readdirSync(runtime)) {
      if (name === VERSION || name.endsWith('.lock')) continue
      try {
        const folder = join(runtime, name)
        const used = statSync(existsSync(join(folder, 'installed.json')) ? join(folder, 'installed.json') : folder).mtimeMs
        if (statSync(folder).isDirectory() && Date.now() - used > 7 * 24 * 3600 * 1000) rmSync(folder, { recursive: true, force: true })
      } catch {
        // in use, or gone already
      }
    }
  } finally {
    rmSync(lock, { force: true })
  }
}

// ── The launcher: start the installed server, installing it first where needed ──
async function launch() {
  let entry = server()
  if (!entry) {
    say(`installing ${PACKAGE} (once, into ${dir}) …`)
    const started = Date.now()
    let attempts = 0
    while (!(entry = server())) {
      if (!locked()) {
        // no installer at work: the last one failed, or none ran yet. Three tries, spaced out
        if (attempts === 3 || Date.now() - started > STALE_MS) {
          say(`could not install ${PACKAGE}. Node.js 20 or newer with npm, and access to the npm registry, are required.`)
          process.exit(1)
        }
        if (attempts) await pause(attempts * 3000)
        attempts++
        const installer = spawn(process.execPath, [fileURLToPath(import.meta.url), '--install'], { detached: true, stdio: 'ignore', windowsHide: true })
        installer.unref()
        // until it holds the lock (or is done already)
        for (let i = 0; i < 40 && !locked() && !server(); i++) await pause(250)
      }
      await pause(250)
    }
  }
  const child = spawn(process.execPath, [entry, ...process.argv.slice(2)], { stdio: 'inherit', windowsHide: true })
  child.on('error', err => {
    say(`could not start the server (${err.message}).`)
    process.exit(1)
  })
  child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)))
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
}

if (process.argv[2] === '--install') await install()
else await launch()
