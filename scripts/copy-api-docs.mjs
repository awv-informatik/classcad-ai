#!/usr/bin/env node
/**
 * Copy @classcad/api-js doc/apis/v1/* → knowledge/classcad-skill/api/
 */

import { existsSync, mkdirSync, cpSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const apiDocs = resolve(root, 'node_modules/@classcad/api-js/doc/apis/v1')
const target = resolve(root, 'knowledge/classcad-skill/references/api')

if (existsSync(apiDocs)) {
  mkdirSync(target, { recursive: true })
  cpSync(apiDocs, target, { recursive: true })
  console.log('[copy-api-docs] Copied @classcad/api-js docs → knowledge/classcad-skill/api/')
} else {
  console.warn('[copy-api-docs] @classcad/api-js docs not found — skipping copy.')
}
