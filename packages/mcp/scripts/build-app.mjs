// The app that docks into MCP sessions, into app/.
//
//   node scripts/build-app.mjs
//
// The app is packages/app (@classcad/mcp-app): Buerligons, from the npm package @buerli.io/buerligons, in a page
// that joins the session it was opened with at /session on the address it came from, which is where this MCP
// serves it and its session. Its build goes to app/; `npm run build` copies app/ into dist/app/, and a build
// without it has the read-only 3D view instead of the app. Buerligons is developed in the buerli repository
// (packages/buerligons); every push to its `next` publishes a beta, and packages/app pins the version.

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'app')
const appPackage = join(root, '..', 'app')

const build = spawnSync('npm', ['run', 'build'], { cwd: appPackage, stdio: 'inherit', shell: process.platform === 'win32' })
if (build.status !== 0) process.exit(build.status ?? 1)
if (!existsSync(join(out, 'index.html'))) {
  console.error(`build-app: ${out} has no index.html`)
  process.exit(1)
}

// What was built, for whoever asks later.
const version = JSON.parse(
  readFileSync(createRequire(join(appPackage, 'package.json')).resolve('@buerli.io/buerligons/package.json'), 'utf8'),
).version
const what = `Buerligons ${version} (npm: @buerli.io/buerligons, in packages/app)`
writeFileSync(join(out, 'SOURCE.txt'), `${what}, built on ${new Date().toISOString().slice(0, 10)}\n`)

const size = dir => readdirSync(dir).reduce((n, f) => n + (statSync(join(dir, f)).isDirectory() ? size(join(dir, f)) : statSync(join(dir, f)).size), 0)
console.log(`app → ${out} (${(size(out) / 1048576).toFixed(1)} MB; ${what})`)
