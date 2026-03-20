#!/usr/bin/env node
/**
 * run.mjs — Test runner for ClassCAD API training.
 *
 * Usage:  node scripts/run.mjs <script-path> [--outdir <path>] [ws-url]
 *
 * Runs one focused test script, captures snapshots + exports, prints
 * a compact results summary to stdout. The agent reads the output and
 * writes the journal itself.
 *
 * Pipeline:
 *   1. Connect to ClassCAD
 *   2. Execute script (creates geometry, returns IDs)
 *   3. Render + export snapshots
 *   4. Print results summary
 *   5. Clear drawing + disconnect
 */

import { join, basename } from 'path'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { pathToFileURL } from 'url'
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

/**
 * Wrap the client's execute to log every command and print results inline.
 */
function withLogging(client) {
  const commandLog = []
  const origExecute = client.execute.bind(client)

  /** Strip bulky keys (structure, graphic) so output stays readable. */
  function trimResult(val) {
    if (val == null || typeof val !== 'object') return val
    if (Array.isArray(val)) return val
    const { structure, graphic, ...rest } = val
    return Object.keys(rest).length ? rest : val
  }

  async function loggedExecute(task) {
    const api = Object.keys(task)[0]
    const params = task[api]
    const start = Date.now()
    try {
      const r = await origExecute(task)
      const trimmed = trimResult(r.result)
      const ms = Date.now() - start
      commandLog.push({ api, params, result: trimmed, messages: r.messages, ms })

      // Print compact result line
      const resultStr = JSON.stringify(trimmed)
      const resultPreview = resultStr.length > 120 ? resultStr.slice(0, 120) + '…' : resultStr
      let line = `  ✓ ${api} → ${resultPreview} (${ms}ms)`

      // Print warnings/errors from messages
      if (r.messages?.length) {
        for (const m of r.messages) {
          if (m.level >= 51) line += `\n    ❌ ${m.message.trim().split('\n')[0]}`
          else if (m.level >= 41) line += `\n    ⚠️ ${m.message.trim().split('\n')[0]}`
        }
      }
      console.log(line)
      return r
    } catch (e) {
      const ms = Date.now() - start
      commandLog.push({ api, params, error: e.message, ms })
      console.log(`  ❌ ${api} → ERROR: ${e.message} (${ms}ms)`)
      throw e
    }
  }

  return { ...client, execute: loggedExecute, commandLog }
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
  const rawClient = await connect(wsUrl)
  const client = withLogging(rawClient)
  console.log('[run] Connected')

  // Snapshot helper — captures PNGs + exports to files/
  async function snapshot(label = `snapshot`) {
    const safeName = label.replace(/[^a-zA-Z0-9_-]/g, '_')
    const prefix = `${scriptName}-${safeName}`
    const pngs = []

    try {
      await rawClient.execute({ 'v1.common.setDatabaseSettings': [{ isGraphicEnabled: true, isCCGraphicEnabled: true, isSketchGraphicEnabled: true, doCurveTessellation: true }] })
      const renders = await renderSession(rawClient, prefix, filesDir, { width: IMG_W, height: IMG_H })
      for (const r of renders) pngs.push(`files/${r.file}`)
    } catch (e) {
      // Fallback: try STL-based render
      try {
        const { parseSTL } = await import('./export.mjs')
        const stlR = await rawClient.execute({
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
      const stepR = await rawClient.execute({ 'v1.common.save': [{ format: 'STP', encoding: 'base64', stp: { version: 2 } }] })
      if (stepR.result?.success && stepR.result?.content) {
        writeFileSync(join(filesDir, `${prefix}.stp`), Buffer.from(stepR.result.content, 'base64'))
      }
    } catch (_) {}
    try {
      const ofbR = await rawClient.execute({ 'v1.common.save': [{ format: 'OFB', encoding: 'base64' }] })
      if (ofbR.result?.success && ofbR.result?.content) {
        writeFileSync(join(filesDir, `${prefix}.ofb`), Buffer.from(ofbR.result.content, 'base64'))
      }
    } catch (_) {}

    if (pngs.length) console.log(`  📸 ${label}: ${pngs.join(', ')}`)
    return pngs
  }

  // 2. Execute script
  console.log(`[run] ${scriptPath}`)
  try {
    const result = await scriptFn(client, { snapshot })

    // Print script return value
    if (result && typeof result === 'object') {
      const { partId, eifId, solidIds } = result
      if (partId !== undefined) console.log(`[run] partId=${partId} eifId=${eifId} solidIds=${JSON.stringify(solidIds || [])}`)
    }
  } catch (e) {
    console.error(`[run] ❌ Script error: ${e.message}`)
  }

  // 3. Clear + disconnect
  try { await rawClient.execute({ 'v1.common.clear': [{}] }) } catch (_) {}
  rawClient.close()
  console.log('[run] Done')
}

main().catch(err => {
  console.error('[run] FATAL:', err.message)
  process.exit(1)
})
