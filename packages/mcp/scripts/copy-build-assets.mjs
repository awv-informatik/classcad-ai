// Copy non-TS build assets that tsc doesn't move into dist/.
// Cross-platform replacement for `cp src/X dist/X` in package.json.

import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const assets = [
  ['src/render.mjs', 'dist/render.mjs'],
]

for (const [from, to] of assets) {
  const src = join(root, from)
  const dst = join(root, to)
  mkdirSync(dirname(dst), { recursive: true })
  copyFileSync(src, dst)
  console.log(`copied ${from} → ${to}`)
}
