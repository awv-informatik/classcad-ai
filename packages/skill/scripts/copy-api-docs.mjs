#!/usr/bin/env node
/**
 * Copy the per-method markdown docs that ship inside @classcad/api-js
 * (doc/apis/v1/*) into references/api/ — the "api" domain of this skill.
 */

import { existsSync, mkdirSync, cpSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

import { createRequire } from 'module'
const apiJsRoot = dirname(createRequire(import.meta.url).resolve('@classcad/api-js/package.json'))
const apiDocs = join(apiJsRoot, 'doc', 'apis', 'v1')
const target = resolve(root, 'references/api')

if (existsSync(apiDocs)) {
  mkdirSync(target, { recursive: true })
  cpSync(apiDocs, target, { recursive: true })
  console.log('[copy-api-docs] Copied @classcad/api-js docs → references/api/')
} else {
  console.warn('[copy-api-docs] @classcad/api-js docs not found — run `npm install` first. Skipping.')
}
