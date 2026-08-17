#!/usr/bin/env node
// build-bundle.mjs — flatten references/ markdown into one importable JSON map.
//
// Output: ./bundle.json — { "domain/method": "markdown content", ... }
// Browser agents can't walk a directory of markdown at runtime; this gives them
// the whole skill as a single import (`@classcad/skill/bundle.json`).

import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { basename, dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const refsDir = join(root, 'references')
const outPath = join(root, 'bundle.json')

const bundle = {}

function walk(dir, prefix = '') {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    if (statSync(fullPath).isDirectory()) {
      walk(fullPath, prefix ? `${prefix}/${entry}` : entry)
    } else if (entry.endsWith('.md')) {
      const key = prefix ? `${prefix}/${basename(entry, '.md')}` : basename(entry, '.md')
      bundle[key] = readFileSync(fullPath, 'utf8')
    }
  }
}

walk(refsDir)

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, JSON.stringify(bundle, null, 2))

const keys = Object.keys(bundle)
console.log(`[build-bundle] Bundled ${keys.length} documents into bundle.json`)
console.log(`[build-bundle] Domains: ${[...new Set(keys.map(k => k.split('/')[0]))].join(', ')}`)
