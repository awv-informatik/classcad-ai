// ─── checkpoint / restore — cheap rollback for a live drawing ─────────────────
//
// The agent operates on ONE live drawing: a failed multi-feature attempt leaves
// half-built features and consumed bodies behind, and recovering by undo/delete
// archaeology is error-prone. These tools make "start this sequence over" cheap:
// checkpoint = in-memory OFB save of the whole drawing, restore = clear + reload.
// Checkpoints live app-side only (never sent to the model) and die with the page.

import { createApi } from '@buerli.io/classcad'
import type { ToolExecutorContext, ToolHandler, ToolResult } from '../types'
import { toErrorMessage, extractBase64, base64ToArrayBuffer } from './utils'

const MAX_CHECKPOINTS_PER_DRAWING = 5

type Snapshot = { data: string; createdAt: number }
const stores = new Map<string, Map<string, Snapshot>>()

function bucket(drawingId: ToolExecutorContext['drawingId']): Map<string, Snapshot> {
  const key = String(drawingId)
  let m = stores.get(key)
  if (!m) {
    m = new Map()
    stores.set(key, m)
  }
  return m
}

export const checkpoint: ToolHandler = async (input, ctx) => {
  const { label } = input as { label?: string }
  const name = (label || 'checkpoint').trim().slice(0, 60) || 'checkpoint'
  try {
    const save = (createApi(ctx.drawingId) as any)?.v1?.common?.save
    if (typeof save !== 'function') return { error: 'Checkpoint unavailable (v1.common.save not found).' }
    const raw = await save({ format: 'OFB', encoding: 'base64' })
    const data = extractBase64(raw)
    if (!data) return { error: 'Checkpoint failed: the engine returned no OFB data.' }

    const m = bucket(ctx.drawingId)
    m.delete(name) // re-checkpointing a label overwrites it (and refreshes its age)
    m.set(name, { data, createdAt: Date.now() })
    // Bound memory: drop the oldest label beyond the cap.
    while (m.size > MAX_CHECKPOINTS_PER_DRAWING) {
      const oldest = m.keys().next().value as string
      m.delete(oldest)
    }
    return {
      result: {
        label: name,
        size: Math.floor((data.length * 3) / 4),
        stored: [...m.keys()],
        note: `Drawing state saved app-side. restore({ label: "${name}" }) brings it back exactly.`,
      },
    }
  } catch (e) {
    return { error: `Checkpoint failed: ${toErrorMessage(e)}` }
  }
}

export const restore: ToolHandler = async (input, ctx) => {
  const { label } = input as { label?: string }
  const m = bucket(ctx.drawingId)
  if (m.size === 0) return { error: 'No checkpoints exist for this drawing. Create one with checkpoint first.' }
  // Default to the most recently created checkpoint.
  const name =
    (label && label.trim()) ||
    [...m.entries()].sort((a, b) => b[1].createdAt - a[1].createdAt)[0][0]
  const snap = m.get(name)
  if (!snap) return { error: `No checkpoint named "${name}". Available: ${[...m.keys()].join(', ')}` }
  try {
    const api = createApi(ctx.drawingId) as any
    const load = api?.v0?.baseModeler?.load
    if (typeof load !== 'function') return { error: 'Restore unavailable (v0.baseModeler.load not found).' }
    // load requires an empty drawing — clear first, then reload the saved state.
    if (typeof api?.v1?.common?.clear === 'function') await api.v1.common.clear({})
    await load(base64ToArrayBuffer(snap.data), 'ofb', `${name}.ofb`)
    return {
      result: {
        restored: name,
        note: 'Drawing replaced with the checkpointed state. All ids from after the checkpoint are stale — re-read them (tree/find) before further operations.',
      },
    }
  } catch (e) {
    return { error: `Restore failed: ${toErrorMessage(e)}` }
  }
}
