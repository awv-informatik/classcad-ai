/**
 * client.mjs — Reusable ClassCAD WebSocket client.
 *
 * Connects to a ClassCAD Drogon WS server, sends the mandatory Configuration
 * command, and exposes promise-based execute()/request()/close() helpers.
 */

import WebSocket from 'ws'
import { randomUUID } from 'crypto'

const DEFAULT_URL = 'ws://0.0.0.0:9094/'
const REQUEST_TIMEOUT = 30_000

/**
 * Connect to ClassCAD and return a ready-to-use client.
 *
 * @param {string} [url] WebSocket URL (default ws://0.0.0.0:9094/)
 * @param {object} [opts] Options
 * @param {boolean} [opts.graphics=true] Enable server-side graphic push
 * @returns {Promise<Client>}
 */
export async function connect(url = DEFAULT_URL, opts = {}) {
  const graphics = opts.graphics !== false  // default: enabled
  const pending = new Map()
  let ws

  // ── helpers ──────────────────────────────────────────────────────────────

  function send(obj) {
    ws.send(JSON.stringify(obj))
  }

  function request(command, extra = {}) {
    const transactionID = randomUUID()
    return new Promise((resolve, reject) => {
      const entry = { resolve, reject, frames: [] }
      pending.set(transactionID, entry)
      send({ command, commandVersion: 'v1', transactionID, ...extra })
      setTimeout(() => {
        if (pending.has(transactionID)) {
          pending.delete(transactionID)
          reject(new Error(`Timeout (${REQUEST_TIMEOUT}ms): ${command}`))
        }
      }, REQUEST_TIMEOUT)
    })
  }

  function execute(task) {
    return request('Execute', { task: [task], options: { undoable: false } })
  }

  // Track the latest graphic payload for direct rendering
  let lastGraphic = null

  function handleFrame(data, isBinary) {
    if (isBinary) return
    let frame
    try { frame = JSON.parse(data.toString()) } catch { return }
    const txId = frame._transactionID_
    if (!txId) return
    const entry = pending.get(txId)
    if (!entry) return
    entry.frames.push(frame)
    if (frame.command === 'Result') {
      pending.delete(txId)
      let result = frame.result
      // Unwrap double-wrapped result
      if (result && typeof result === 'object' && 'result' in result
          && Object.keys(result).length <= 3) {
        result = result.result
      }
      // Filter INFO traces (level 31)
      const messages = (frame.messages || []).filter(m => m.level > 31)
      // Track latest graphic
      if (frame.graphic && (frame.graphic.containers?.length > 0 || frame.graphic.properties)) {
        lastGraphic = frame.graphic
      }
      entry.resolve({
        result,
        messages,
        maxLevel: frame.maxLevel,
        structure: frame.structure,
        graphic: frame.graphic || null,
      })
    }
  }

  function getLastGraphic() { return lastGraphic }

  function close() {
    if (ws && ws.readyState <= WebSocket.OPEN) {
      ws.close()
    }
  }

  // ── connect ──────────────────────────────────────────────────────────────

  ws = new WebSocket(url)
  await new Promise((resolve, reject) => {
    ws.on('open', resolve)
    ws.on('error', reject)
    setTimeout(() => reject(new Error('Connection timeout')), 5000)
  })
  ws.on('message', (d, b) => handleFrame(d, b))

  // Mandatory Configuration (enables server push)
  send({
    command: 'Configuration',
    commandVersion: 'v1',
    config: {
      sendStructure: true,
      sendStructure_Patch: true,
      sendStructure_Immediately: false,
      sendGraphic_Kernel: graphics,
      sendGraphic_StructureObj: graphics,
      sendGraphic_Sketch: graphics,
      sendGraphic_Compressed: false,
      sendGraphic_Immediately: false,
      sendGraphic_ImmediatelyBinary: false,
      sendGraphic_Multipackage: false,
      sendMessages: true,
      sendMessages_Immediately: false,
    },
  })
  await new Promise(r => setTimeout(r, 300))

  return { send, request, execute, close, ws, getLastGraphic }
}
