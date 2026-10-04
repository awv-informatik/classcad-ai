// Builds the app that docks into MCP sessions (Buerligons) and puts it into app/.
//
//   node scripts/build-app.mjs
//
// The app is built from the submodules this repository pins under vendor/:
// buerligons (the app), react-cad (its UI library, @buerli.io/react-cad) and
// buerli (@buerli.io/core, classcad, react, headless), the way the websites
// repository builds the editor — the library and SDK come from their sources,
// not from npm, so the three move together at the commits pinned here. Each
// can be pointed at another checkout: BUERLIGONS_DIR, BUERLI_REACT_CAD, BUERLI.
//
// Buerligons is built in its `mcp` mode — the build that reaches ClassCAD on the
// address it was loaded from (see .env.mcp there) — with its own installed
// dependencies (`yarn install` in vendor/buerligons). `npm run build` copies
// app/ into dist/app/; a build without it has the read-only 3D view instead of
// the app.

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// This package, the repository around it, the checkouts the app is built from, and where the build goes.
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const repo = resolve(root, '..', '..')
const source = resolve(process.env.BUERLIGONS_DIR ?? join(repo, 'vendor', 'buerligons'))
const reactCad = resolve(process.env.BUERLI_REACT_CAD ?? join(repo, 'vendor', 'react-cad'))
const buerli = resolve(process.env.BUERLI ?? join(repo, 'vendor', 'buerli'))
const out = join(root, 'app')

const BUERLI_PACKAGES = ['core', 'classcad', 'react', 'headless']
const missing = [
  [join(source, 'vite.config.ts'), 'buerligons (BUERLIGONS_DIR)'],
  [join(source, 'node_modules', 'vite'), 'the dependencies of buerligons (yarn install in it)'],
  [join(reactCad, 'src', 'index.ts'), 'react-cad (BUERLI_REACT_CAD)'],
  ...BUERLI_PACKAGES.map(name => [join(buerli, 'packages', name, 'src', 'index.ts'), `buerli (BUERLI)`]),
].filter(([path]) => !existsSync(path))
if (missing.length) {
  const what = [...new Set(missing.map(([, name]) => name))].join(', ')
  console.error(`build-app: missing ${what} — run "git submodule update --init" and "yarn install" in vendor/buerligons`)
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

// The library and SDK from their sources. Their own imports (react, three, antd, …) resolve as if
// buerligons made them, from its node_modules — never from a checkout's own or this repository's,
// so there is one React, one three and one set of stores. The published packages stay installed
// there for that: they bring the dependencies (as in the websites repository).
const sourceDirs = [join(reactCad, 'src'), ...BUERLI_PACKAGES.map(name => join(buerli, 'packages', name, 'src'))]
const alias = [
  { find: /^@buerli\.io\/react-cad$/, replacement: join(reactCad, 'src', 'index.ts') },
  ...BUERLI_PACKAGES.map(name => ({ find: new RegExp(`^@buerli\\.io/${name}$`), replacement: join(buerli, 'packages', name, 'src', 'index.ts') })),
]
const resolveFrom = [
  join(source, 'src', 'index.tsx'),
  ...['react-cad', ...BUERLI_PACKAGES].map(name => join(source, 'node_modules', '@buerli.io', name, 'package.json')),
]
const fromSources = {
  name: 'buerli-sources',
  enforce: 'pre',
  async resolveId(id, importer, options) {
    const bare = !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('\0') && !/^[a-z]+:/i.test(id)
    if (!bare || !importer || !sourceDirs.some(dir => importer.startsWith(dir + sep))) return null
    for (const from of resolveFrom) {
      const found = await this.resolve(id, from, { ...options, skipSelf: true })
      if (found) return found
    }
    return null
  },
}

// Buerligons' own vite, config and environment (its config reads .env.<mode> from the working directory).
// (its ESM entry: the CommonJS one require() finds lacks part of the API)
const vitePackage = createRequire(join(source, 'package.json')).resolve('vite/package.json')
const viteEntry = JSON.parse(readFileSync(vitePackage, 'utf8')).exports['.'].import
const vite = await import(pathToFileURL(join(dirname(vitePackage), viteEntry)).href)
process.chdir(source)
const loaded = await vite.loadConfigFromFile({ command: 'build', mode: 'mcp' }, join(source, 'vite.config.ts'), source)
// Type checking and linting are the app's own CI: against the published typings it would flag the very
// sources this build uses instead.
const plugins = (loaded?.config.plugins ?? []).flat(Infinity).filter(p => p && !String(p.name).startsWith('vite-plugin-checker'))

rmSync(out, { recursive: true, force: true })
await vite.build(
  vite.mergeConfig(
    { ...loaded.config, plugins },
    {
      configFile: false,
      root: source,
      mode: 'mcp',
      resolve: { alias },
      plugins: [fromSources],
      build: { outDir: out, emptyOutDir: true },
    },
  ),
)

// Not for the package: what a web host wants, and what names files this listener never serves.
for (const name of ['robots.txt']) rmSync(join(out, name), { force: true })

// What was built, for whoever asks later.
const sources = [
  ['buerligons', source],
  ['react-cad', reactCad],
  ['buerli', buerli],
].map(([name, dir]) => `${name} ${git(dir, 'rev-parse', '--short', 'HEAD')}${git(dir, 'status', '--porcelain', '--untracked-files=no') ? ' (with local changes)' : ''}`)
writeFileSync(join(out, 'SOURCE.txt'), `Buerligons, built in mcp mode on ${new Date().toISOString().slice(0, 10)}\n${sources.join('\n')}\n`)

const size = dir => readdirSync(dir).reduce((n, f) => n + (statSync(join(dir, f)).isDirectory() ? size(join(dir, f)) : statSync(join(dir, f)).size), 0)
console.log(`app → ${out} (${(size(out) / 1048576).toFixed(1)} MB; ${sources.join(', ')})`)
