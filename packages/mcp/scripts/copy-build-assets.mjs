// Copy non-TS build assets that tsc doesn't move into dist/.
// Cross-platform replacement for `cp -r` in package.json.
//
//   viewer-page/            → dist/viewer-page/            the 3D viewer's page (HTML, CSS, JS, font)
//   three (devDependency)   → dist/viewer-page/vendor/     what the page imports, so it works offline

import { copyFileSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'dist', 'viewer-page')

rmSync(out, { recursive: true, force: true })
cpSync(join(root, 'viewer-page'), out, { recursive: true })

// three's exports do not name its package.json: find the package through its entry (build/three.cjs)
const three = join(dirname(createRequire(import.meta.url).resolve('three')), '..')
const vendor = [
  ['build/three.module.min.js', 'three.module.min.js'],
  ['build/three.core.min.js', 'three.core.min.js'],
  ['examples/jsm/controls/OrbitControls.js', 'addons/controls/OrbitControls.js'],
  ['examples/jsm/lines/LineSegments2.js', 'addons/lines/LineSegments2.js'],
  ['examples/jsm/lines/LineSegmentsGeometry.js', 'addons/lines/LineSegmentsGeometry.js'],
  ['examples/jsm/lines/LineMaterial.js', 'addons/lines/LineMaterial.js'],
  ['LICENSE', 'LICENSE.txt'],
]
for (const [from, to] of vendor) {
  const dst = join(out, 'vendor', to)
  mkdirSync(dirname(dst), { recursive: true })
  copyFileSync(join(three, from), dst)
}
const version = JSON.parse(readFileSync(join(three, 'package.json'), 'utf8')).version
writeFileSync(join(out, 'vendor', 'VERSION.txt'), `three ${version} (MIT), copied at build time\n`)
console.log(`viewer page → dist/viewer-page (three ${version})`)
