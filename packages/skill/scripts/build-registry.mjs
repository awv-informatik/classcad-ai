#!/usr/bin/env node
// build-registry.mjs — walk @classcad/api-js .d.ts files and emit a method registry.
//
// Output: ./method-registry.json — { "v1.<domain>.<method>": { domain, method, summary, params } }
// A purely mechanical extraction of the JSDoc the API authors wrote (no AI involved):
// `summary` is the comment's main text, `params` the @param tags. Consumers (classcad-mcp,
// @buerli.io/ai) use it to validate call_api method names, list/search methods, and append
// parameter signatures to error messages.

import ts from 'typescript'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
// Resolve @classcad/api-js wherever npm placed it (hoisted in a workspace).
import { createRequire } from 'module'
const apiJsRoot = dirname(createRequire(import.meta.url).resolve('@classcad/api-js/package.json'))
const apisDir = join(apiJsRoot, 'build', 'types', 'apis', 'v1')
const outputPath = join(root, 'method-registry.json')

const DOMAINS = ['assembly', 'common', 'curve', 'drawing2d', 'part', 'sketch', 'solid']

function jsdocSummary(node) {
  // Concatenate all leading JSDoc comments' main text (before the first @tag).
  const docs = ts.getJSDocCommentsAndTags(node)
  const main = docs.flatMap(d => (Array.isArray(d.comment) ? d.comment.map(c => c.text ?? '') : [d.comment ?? '']))
  const lines = main.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
  return lines || ''
}

function paramTags(node) {
  // Collect @param lines as "name — description" pairs.
  const docs = ts.getJSDocCommentsAndTags(node)
  const out = []
  for (const d of docs) {
    if (!d.tags) continue
    for (const t of d.tags) {
      if (ts.isJSDocParameterTag(t)) {
        const name = t.name?.getText?.() ?? ''
        const text = Array.isArray(t.comment) ? t.comment.map(c => c.text ?? '').join(' ') : (t.comment ?? '')
        if (name) out.push({ name, text: String(text).replace(/\s+/g, ' ').trim() })
      }
    }
  }
  return out
}

function processDomain(domain) {
  const file = join(apisDir, `${domain}.d.ts`)
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
  const out = []

  function visit(node) {
    // Look for: export declare const <domain>: (facade: IFacade) => { method: (...) => Promise<...> ; ... }
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === domain && decl.type) {
          if (ts.isFunctionTypeNode(decl.type) && decl.type.type) {
            const ret = decl.type.type
            if (ts.isTypeLiteralNode(ret)) {
              for (const member of ret.members) {
                if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
                  out.push({
                    domain,
                    method: member.name.text,
                    summary: jsdocSummary(member),
                    params: paramTags(member),
                  })
                }
              }
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return out
}

function main() {
  const registry = {}
  let total = 0
  for (const d of DOMAINS) {
    const methods = processDomain(d)
    for (const m of methods) {
      const key = `v1.${m.domain}.${m.method}`
      registry[key] = { domain: m.domain, method: m.method, summary: m.summary, params: m.params }
      total++
    }
    process.stderr.write(`  ${d}: ${methods.length}\n`)
  }
  writeFileSync(outputPath, JSON.stringify(registry, null, 2))
  process.stderr.write(`Wrote ${outputPath} (${total} methods)\n`)
}

main()
