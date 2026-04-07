#!/usr/bin/env node
/**
 * run.mjs — Test runner for ClassCAD API training.
 *
 * Usage:  node scripts/run.mjs <script-path> [--outdir <path>] [--port <port>] [ws-url]
 *
 * Connects to ClassCAD, runs one script, captures snapshots, cleans up.
 * The script receives a typed api object (from @classcad/api-js) + helpers.
 *
 * Pipeline:
 *   1. Connect to ClassCAD
 *   2. Execute script (receives api + snapshot/filewrite helpers)
 *   3. Clear drawing + disconnect
 */

import { join, basename } from 'path'
import { mkdirSync, writeFileSync } from 'fs'
import { pathToFileURL } from 'url'
import { inspect } from 'util'
import { connect } from './client.mjs'
import { renderIsometric, savePNG } from './render.mjs'
import { renderSession } from './render-direct.mjs'
import { v1 } from '@classcad/api-js'

const IMG_W = 800
const IMG_H = 600

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

  // 1. Connect
  const client = await connect(wsUrl, { debug })

  // Facade adapter: bridges @classcad/api-js → client.request()
  const facade = {
    callSafeApiV(version, namespace, func, args, options) {
      const key = `${version}.${namespace}.${func}`
      return client.request('Execute', {
        task: [{ [key]: args != null ? [args] : [{}] }],
        options: { undoable: options?.undoable ?? false },
      })
    },
    callSafeApi(namespace, func, args, options) {
      return this.callSafeApiV('v1', namespace, func, args, options)
    },
    fetchTree: () => Promise.resolve(),
  }

  const api = { v1: v1(facade) }

  // Snapshot helper — captures PNGs + exports to files/
  async function snapshot(label = `snapshot`) {
    const safeName = label.replace(/[^a-zA-Z0-9_-]/g, '_')
    const prefix = `${scriptName}-${safeName}`
    const pngs = []

    try {
      await client.execute({ 'v1.common.setDatabaseSettings': [{ isGraphicEnabled: true, isCCGraphicEnabled: true, isSketchGraphicEnabled: true, doCurveTessellation: true }] })
      const renders = await renderSession(client, prefix, filesDir, { width: IMG_W, height: IMG_H })
      for (const r of renders) pngs.push(`files/${r.file}`)
    } catch (e) {
      // Fallback: try STL-based render
      try {
        const { parseSTL } = await import('./export.mjs')
        const stlR = await client.execute({
          'v1.common.save': [{ format: 'STL', encoding: 'base64', stl: { binary: true, facetingTol: 0.1, angleTol: 6 } }],
        })
        if (stlR.result?.success && stlR.result?.content) {
          const stlBuf = Buffer.from(stlR.result.content, 'base64')
          const triangles = parseSTL(stlBuf)
          if (triangles.length) {
            const pixels = renderIsometric(triangles, IMG_W, IMG_H)
            const pngFile = `${prefix}.png`
            await savePNG(pixels, IMG_W, IMG_H, join(filesDir, pngFile))
            pngs.push(`files/${pngFile}`)
          }
        }
      } catch (_) { /* no render available */ }
    }

    // Export STEP + OFB
    try {
      const stepR = await client.execute({ 'v1.common.save': [{ format: 'STP', encoding: 'base64', stp: { version: 2 } }] })
      if (stepR.result?.success && stepR.result?.content) {
        writeFileSync(join(filesDir, `${prefix}.stp`), Buffer.from(stepR.result.content, 'base64'))
      }
    } catch (_) {}
    try {
      const ofbR = await client.execute({ 'v1.common.save': [{ format: 'OFB', encoding: 'base64' }] })
      if (ofbR.result?.success && ofbR.result?.content) {
        writeFileSync(join(filesDir, `${prefix}.ofb`), Buffer.from(ofbR.result.content, 'base64'))
      }
    } catch (_) {}

    return pngs
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
    await scriptFn(api, { snapshot, filewrite })
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
  try { await client.execute({ 'v1.common.clear': [{}] }) } catch (_) {}
  client.close()
}

main().catch(err => {
  console.error('[run] FATAL:', err.message)
  process.exit(1)
})
