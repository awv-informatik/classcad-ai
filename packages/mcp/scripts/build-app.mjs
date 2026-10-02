// Builds the app that docks into MCP sessions (Buerligons) and puts it into app/.
//
//   node scripts/build-app.mjs
//
// The app is not part of this repository: it is built from a checkout of the
// buerli monorepo (BUERLIGONS_DIR, default ../buerli-modeler/packages/buerligons
// next to this repository), in its `mcp` mode — the build that reaches ClassCAD
// on the address it was loaded from (see .env.mcp there). `npm run build`
// copies app/ into dist/app/; a build without it has the read-only 3D view
// instead of the app.

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// This package, the repository around it, the Buerligons checkout the app is built from, and where the build goes.
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const repo = resolve(root, '..', '..')
const source = resolve(process.env.BUERLIGONS_DIR ?? join(repo, '..', 'buerli-modeler', 'packages', 'buerligons'))
const out = join(root, 'app')

if (!existsSync(join(source, 'vite.config.ts'))) {
  console.error(`build-app: no Buerligons checkout at ${source} (set BUERLIGONS_DIR)`)
  process.exit(1)
}

/** A git answer about a checkout, or 'unknown' where there is none. */
const git = (dir, ...args) => {
  try {
    return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

rmSync(out, { recursive: true, force: true })
execFileSync('npx', ['vite', 'build', '--mode', 'mcp', '--outDir', out, '--emptyOutDir'], { cwd: source, stdio: 'inherit', shell: process.platform === 'win32' })

// Not for the package: what a web host wants, and what names files this listener never serves.
for (const name of ['robots.txt']) rmSync(join(out, name), { force: true })

// What was built, for whoever asks later.
const packages = dirname(source)
const sources = [
  ['buerligons', source],
  ['react-cad', join(packages, 'react-cad')],
  ['buerli', join(packages, 'buerli')],
]
  .filter(([, dir]) => existsSync(dir))
  .map(([name, dir]) => `${name} ${git(dir, 'rev-parse', '--short', 'HEAD')}${git(dir, 'status', '--porcelain', '--untracked-files=no') ? ' (with local changes)' : ''}`)
writeFileSync(join(out, 'SOURCE.txt'), `Buerligons, built in mcp mode on ${new Date().toISOString().slice(0, 10)}\n${sources.join('\n')}\n`)

const size = dir => readdirSync(dir).reduce((n, f) => n + (statSync(join(dir, f)).isDirectory() ? size(join(dir, f)) : statSync(join(dir, f)).size), 0)
console.log(`app → ${out} (${(size(out) / 1048576).toFixed(1)} MB; ${sources.join(', ')})`)
