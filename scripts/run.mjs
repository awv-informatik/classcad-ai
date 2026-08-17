#!/usr/bin/env node
/**
 * run.mjs — Test runner for ClassCAD API training.
 *
 * Usage:  node scripts/run.mjs <script-path> [--outdir <path>] [--port <port>] [ws-url]
 *
 * Connects to ClassCAD, runs one script, captures snapshots, cleans up.
 *
 * The session and the api object come from @classcad/script — the SAME script
 * medium as buerli-ai and the ClassCAD MCP. Training scripts therefore get:
 *   api.v1.<domain>.<method>(params)  — registry-validated (typos throw with
 *                                       suggestions), envelope { result,
 *                                       maxLevel, messages, structure, graphic }
 *   api.tree({ refresh? })            — structure tree (id → node)
 *   api.graphic({ recalc? })          — graphic containers (meshes/edges/… —
 *                                       filter geometry directly in the script)
 *   api.env                           — 'node'
 * Rendering comes from @classcad/renderer — snapshot() passes ALL renderer
 * options through (view/camera, zoom, lookAt, section, sheet, colors,
 * highlight/highlightAt, markers, sketchOverlay, annotate, xray, frame,
 * layers, recalc, source: 'stl').
 *
 * Pipeline:
 *   1. Connect to ClassCAD
 *   2. Execute script (receives api + snapshot/filewrite/tree helpers)
 *   3. Clear drawing + disconnect
 */

import { join, basename } from 'path'
import { mkdirSync, writeFileSync } from 'fs'
import { pathToFileURL } from 'url'
import { inspect } from 'util'
import { connectSession, buildScriptApi } from '@classcad/script/node'
import { renderSession } from '@classcad/renderer/node'
import registry from '@classcad/skill/method-registry.json' with { type: 'json' }

const IMG_W = 1600
const IMG_H = 1200

function parseArgs(argv) {
  const args = argv.slice(2)
  let scriptPath = null
  let wsUrl = undefined
  let outDir = null
  let debug = false
  let port = null

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--outdir') { outDir = args[++i]; continue }
    if (args[i] === '--debug') { debug = true; continue }
    if (args[i] === '--port') { port = args[++i]; continue }
    if (args[i].startsWith('ws://') || args[i].startsWith('wss://')) { wsUrl = args[i]; continue }
    if (!scriptPath) { scriptPath = args[i]; continue }
  }
  // --port overrides the default URL (but explicit ws-url takes precedence)
  if (port && !wsUrl) wsUrl = `ws://0.0.0.0:${port}/`
  return { scriptPath, wsUrl, outDir, debug }
}

async function main() {
  const { scriptPath, wsUrl, outDir: userOutDir, debug } = parseArgs(process.argv)

  if (!scriptPath) {
    console.error('Usage: node scripts/run.mjs <script-path> [--outdir <path>] [--debug] [ws-url]')
    process.exit(1)
  }

  // Resolve script
  const absScriptPath = join(process.cwd(), scriptPath)
  const scriptMod = await import(pathToFileURL(absScriptPath).href)
  const scriptFn = scriptMod.default
  if (typeof scriptFn !== 'function') {
    console.error('Script must export a default async function')
    process.exit(1)
  }
  const scriptName = basename(scriptPath, '.mjs')

  // Output directory
  let outDir
  if (userOutDir) {
    outDir = userOutDir.startsWith('/') ? userOutDir : join(process.cwd(), userOutDir)
  } else {
    outDir = join(process.cwd(), 'workspace', 'output', scriptName)
  }
  const filesDir = join(outDir, 'files')
  mkdirSync(filesDir, { recursive: true })

  // 1. Connect — the session serves the script api AND the renderer.
  const session = await connectSession(wsUrl, { debug })
  const api = buildScriptApi(session, { registry })

  // Snapshot helper — captures PNGs + exports to files/
  // Forwards EVERY @classcad/renderer option: { view (named or {azimuth,
  // elevation}/{direction}), zoom, lookAt, section, sheet, colors, highlight,
  // highlightAt, markers, sketchOverlay, annotate, xray, frame, layers,
  // recalc (set false in solid.*/EIF flows!), source: 'stl' }.
  // On failure it LOGS the renderer's explicit error (which names the remedy,
  // e.g. source: 'stl') — there is no silent fallback.
  async function snapshot(label = `snapshot`, opts = {}) {
    const safeName = label.replace(/[^a-zA-Z0-9_-]/g, '_')
    const prefix = `${scriptName}-${safeName}`
    const pngs = []

    try {
      const renders = await renderSession(session, prefix, filesDir, {
        width: IMG_W, height: IMG_H,
        ...opts,
      })
      for (const r of renders) pngs.push(`files/${r.file}`)
    } catch (e) {
      console.error(`[snapshot] ${e.message}`)
    }

    // Export STEP + OFB
    try {
      const stepR = await session.execute({ 'v1.common.save': [{ format: 'STP', encoding: 'base64', stp: { version: 2 } }] })
      if (stepR.result?.success && stepR.result?.content) {
        writeFileSync(join(filesDir, `${prefix}.stp`), Buffer.from(stepR.result.content, 'base64'))
      }
    } catch (_) {}
    try {
      const ofbR = await session.execute({ 'v1.common.save': [{ format: 'OFB', encoding: 'base64' }] })
      if (ofbR.result?.success && ofbR.result?.content) {
        writeFileSync(join(filesDir, `${prefix}.ofb`), Buffer.from(ofbR.result.content, 'base64'))
      }
    } catch (_) {}

    return pngs
  }

  // Tree helper — returns the cached structure from the latest Result frame.
  //   tree()                  → full envelope { root, currentProduct, ..., tree }
  //   tree({ id })            → single node, or null
  //   tree({ type })          → array of nodes whose `class` matches
  //   tree({ refresh: true }) → force a fresh server-side snapshot first
  // (api.tree() from @classcad/script returns just the id→node map; this
  // helper keeps the richer filter conveniences training scripts rely on.)
  async function tree(filter) {
    if (filter?.refresh) await session.getTree({ refresh: true })
    const t = session.getStructure()
    if (!t || !t.tree) return null
    if (!filter || (Object.keys(filter).length === 1 && filter.refresh)) return t
    if (filter.id != null) return t.tree[String(filter.id)] || null
    if (filter.type) return Object.values(t.tree).filter(n => n.class === filter.type)
    return t
  }

  // File-write helper — dumps data to files/ when console.log isn't enough
  function filewrite(data, label = 'dump') {
    const safeName = label.replace(/[^a-zA-Z0-9_-]/g, '_')
    const prefix = `${scriptName}-${safeName}`
    let file, content

    if (typeof data === 'string') {
      file = `${prefix}.txt`
      content = data
    } else if (Buffer.isBuffer(data)) {
      file = `${prefix}.bin`
      content = data
    } else {
      file = `${prefix}.json`
      try {
        content = JSON.stringify(data, null, 2)
      } catch {
        // Circular reference or serialization error — use util.inspect
        file = `${prefix}.txt`
        content = inspect(data, { depth: 10, maxArrayLength: Infinity })
      }
    }

    const outPath = join(filesDir, file)
    writeFileSync(outPath, content)
    console.log(`[filewrite] files/${file} (${Buffer.byteLength(content)} bytes)`)
    return `files/${file}`
  }

  // 2. Execute script — capture all console output to a log file
  const logLines = []
  const origLog = console.log
  const origErr = console.error
  const origWarn = console.warn

  console.log = (...args) => {
    const line = args.map(a => typeof a === 'string' ? a : inspect(a, { depth: 8, maxArrayLength: 200 })).join(' ')
    logLines.push(line)
    origLog(...args)
  }
  console.error = (...args) => {
    const line = '[stderr] ' + args.map(a => typeof a === 'string' ? a : inspect(a, { depth: 8, maxArrayLength: 200 })).join(' ')
    logLines.push(line)
    origErr(...args)
  }
  console.warn = (...args) => {
    const line = '[warn] ' + args.map(a => typeof a === 'string' ? a : inspect(a, { depth: 8, maxArrayLength: 200 })).join(' ')
    logLines.push(line)
    origWarn(...args)
  }

  try {
    await scriptFn(api, { snapshot, filewrite, tree })
  } catch (e) {
    console.error(`[run] Script error: ${e.message}`)
  }

  // Restore console + persist log
  console.log = origLog
  console.error = origErr
  console.warn = origWarn

  if (logLines.length > 0) {
    const logFile = join(outDir, 'files', `${scriptName}.log`)
    writeFileSync(logFile, logLines.join('\n') + '\n')
    console.log(`[run] Log saved: ${logFile} (${logLines.length} lines)`)
  }

  // 3. Clear + disconnect
  try { await session.execute({ 'v1.common.clear': [{}] }) } catch (_) {}
  session.close()
}

main().catch(err => {
  console.error('[run] FATAL:', err.message)
  process.exit(1)
})
