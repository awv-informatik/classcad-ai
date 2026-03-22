#!/usr/bin/env node
/**
 * run.mjs — Test runner for ClassCAD API training.
 *
 * Usage:  node scripts/run.mjs <script-path> [--outdir <path>] [ws-url]
 *
 * Connects to ClassCAD, runs one script, captures snapshots, cleans up.
 * The script receives the raw client — all data processing happens in-script.
 *
 * Pipeline:
 *   1. Connect to ClassCAD
 *   2. Execute script (receives raw client + snapshot helper)
 *   3. Clear drawing + disconnect
 */

import { join, basename } from 'path'
import { mkdirSync, writeFileSync } from 'fs'
import { pathToFileURL } from 'url'
import { inspect } from 'util'
import { connect } from './client.mjs'
import { renderIsometric, savePNG } from './render.mjs'
import { renderSession } from './render-direct.mjs'

const IMG_W = 800
const IMG_H = 600

function parseArgs(argv) {
  const args = argv.slice(2)
  let scriptPath = null
  let wsUrl = undefined
  let outDir = null

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--outdir') { outDir = args[++i]; continue }
    if (args[i].startsWith('ws://') || args[i].startsWith('wss://')) { wsUrl = args[i]; continue }
    if (!scriptPath) { scriptPath = args[i]; continue }
  }
  return { scriptPath, wsUrl, outDir }
}

async function main() {
  const { scriptPath, wsUrl, outDir: userOutDir } = parseArgs(process.argv)

  if (!scriptPath) {
    console.error('Usage: node scripts/run.mjs <script-path> [--outdir <path>] [ws-url]')
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
  const client = await connect(wsUrl)

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

  // 2. Execute script
  try {
    await scriptFn(client, { snapshot, filewrite })
  } catch (e) {
    console.error(`[run] Script error: ${e.message}`)
  }

  // 3. Clear + disconnect
  try { await client.execute({ 'v1.common.clear': [{}] }) } catch (_) {}
  client.close()
}

main().catch(err => {
  console.error('[run] FATAL:', err.message)
  process.exit(1)
})
