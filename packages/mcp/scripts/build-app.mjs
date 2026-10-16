// The app that docks into MCP sessions (Buerligons), into app/.
//
//   node scripts/build-app.mjs
//
// The app is the npm package @buerli.io/buerligons, at the version package.json pins: it holds
// Buerligons built in its `mcp` mode (dist/mcp), the build that reaches ClassCAD on the address it was
// loaded from, which is where this MCP serves it and its session. Buerligons is developed in the buerli
// repository (packages/buerligons); every push to its `next` publishes a beta. BUERLIGONS_DIST names
// another build to take instead (a folder with an index.html: a buerli checkout's
// packages/buerligons/dist/mcp, after `yarn build:mcp` there). `npm run build` copies app/ into
// dist/app/; a build without it has the read-only 3D view instead of the app.

import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'app')

let from
let what
if (process.env.BUERLIGONS_DIST) {
  from = resolve(process.env.BUERLIGONS_DIST)
  what = `Buerligons from ${from}`
} else {
  let manifest
  try {
    manifest = createRequire(join(root, 'package.json')).resolve('@buerli.io/buerligons/package.json')
  } catch {
    console.error('build-app: @buerli.io/buerligons is not installed: run "npm install" at the repository root')
    process.exit(1)
  }
  from = join(dirname(manifest), 'dist', 'mcp')
  what = `Buerligons ${JSON.parse(readFileSync(manifest, 'utf8')).version} (npm: @buerli.io/buerligons, dist/mcp)`
}
if (!existsSync(join(from, 'index.html'))) {
  console.error(`build-app: ${from} has no index.html`)
  process.exit(1)
}

rmSync(out, { recursive: true, force: true })
cpSync(from, out, { recursive: true })
// Not for the package: what a web host wants, and what names files this listener never serves.
for (const name of ['robots.txt']) rmSync(join(out, name), { force: true })
// What was taken, for whoever asks later.
writeFileSync(join(out, 'SOURCE.txt'), `${what}, taken on ${new Date().toISOString().slice(0, 10)}\n`)

const size = dir => readdirSync(dir).reduce((n, f) => n + (statSync(join(dir, f)).isDirectory() ? size(join(dir, f)) : statSync(join(dir, f)).size), 0)
console.log(`app → ${out} (${(size(out) / 1048576).toFixed(1)} MB; ${what})`)
