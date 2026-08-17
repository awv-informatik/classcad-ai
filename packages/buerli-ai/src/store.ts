// ─── Zustand store for agent conversation state ──────────────────────────────

import { create } from 'zustand'
import type { AgentConfig, FileAttachment, ImageInput, Message } from './types'
import { runAgentLoop } from './agentLoop'

// ─── UI Message types (simplified for display) ────────────────────────────────

export type UIMessage =
  | { type: 'user'; text: string; images?: string[]; files?: string[] }
  | { type: 'assistant'; text: string }
  | { type: 'thinking'; text: string; collapsed?: boolean }
  | { type: 'tool'; id?: string; name: string; label?: string; status: 'running' | 'done' | 'error'; detail?: string; image?: string; download?: { filename: string; mimeType: string; data: string } }
  | { type: 'subagent'; id?: string; name: string; goal: string; status: 'running' | 'done'; summary?: string }

/**
 * Ordered session events captured for the code-mirror panel. Enough to generate a
 * GENERIC script: user intent (comments), imported files (preconditions), and each
 * API call with its RETURN value (so runtime IDs can be threaded into variables).
 */
export type CodeEvent =
  | { kind: 'user'; text: string }
  | { kind: 'load'; id?: string; name: string; status: 'running' | 'done' | 'error' }
  | {
      /** A run_script execution — the script IS the code, rendered verbatim. */
      kind: 'script'
      id?: string
      label?: string
      text: string
      status: 'running' | 'done' | 'error'
      error?: string
    }
  | {
      /** Discovery call (find/inspect/get_selection) — not rendered, but gives an
       *  unresolved id its provenance (e.g. "from your selection"). */
      kind: 'lookup'
      id?: string
      tool: string
      input?: unknown
      ret?: unknown
    }
  | {
      kind: 'call'
      id?: string
      /** Fully-qualified method, e.g. "v1.part.box" or "structure.calculateProductBounds". */
      method: string
      /** Call arguments — an object for v1.*, a positional array for the buerli namespaces. */
      args: unknown
      /** The API return value (used to extract produced IDs). */
      ret?: unknown
      /** Error message when the call failed. */
      error?: string
      status: 'running' | 'done' | 'error'
    }

export type AgentStoreState = {
  messages: UIMessage[]
  rawHistory: Message[]
  isRunning: boolean
  error: string | null
  /** Token usage from the most recent LLM call (inputTokens ≈ context occupied). */
  usage: { inputTokens?: number; outputTokens?: number } | null
  /** Ordered session log (user turns, loads, API calls) — source for the code panel. */
  codeLog: CodeEvent[]
  /** @internal Controller for the in-flight run, used by cancel(). */
  _controller: AbortController | null
}

export type AgentStoreActions = {
  sendMessage: (text: string, config: AgentConfig, images?: ImageInput[], files?: FileAttachment[]) => Promise<void>
  /** Abort the in-flight run, keeping any progress made so far. */
  cancel: () => void
  reset: () => void
}

export type AgentStore = AgentStoreState & AgentStoreActions

export const createAgentStore = () =>
  create<AgentStore>((set, get) => ({
    messages: [],
    rawHistory: [],
    isRunning: false,
    error: null,
    usage: null,
    codeLog: [],
    _controller: null,

    async sendMessage(text: string, config: AgentConfig, images?: ImageInput[], files?: FileAttachment[]) {
      if (get().isRunning) return

      const controller = new AbortController()
      set(s => ({
        isRunning: true,
        error: null,
        messages: [
          ...s.messages,
          {
            type: 'user',
            text,
            images: images?.map(im => `data:${im.mediaType};base64,${im.data}`),
            files: files?.map(f => f.name),
          },
        ],
        // Record the request so the code panel can annotate what each block was for.
        codeLog: text.trim() ? [...s.codeLog, { kind: 'user', text }] : s.codeLog,
        _controller: controller,
      }))

      const history = get().rawHistory
      let assistantText = ''

      // Tell the model which files are attached so it can import them with load_file.
      const fileNote =
        files && files.length
          ? `\n\n[Attached files — import with load_file using the exact name: ${files.map(f => f.name).join(', ')}]`
          : ''
      const llmText = text + fileNote

      try {
        for await (const event of runAgentLoop(llmText, history, { ...config, attachments: files, signal: controller.signal }, images)) {
          switch (event.type) {
            case 'text':
              assistantText += event.text
              set(s => {
                const msgs = [...s.messages]
                // Update or add assistant message
                const last = msgs[msgs.length - 1]
                if (last?.type === 'assistant') {
                  msgs[msgs.length - 1] = { type: 'assistant', text: assistantText }
                } else {
                  msgs.push({ type: 'assistant', text: assistantText })
                }
                return { messages: msgs }
              })
              break

            case 'thinking':
              set(s => ({
                messages: [...s.messages, { type: 'thinking', text: event.text, collapsed: true }],
              }))
              break

            case 'tool_start':
              set(s => {
                // Capture API calls (≈ buerli lines) and file imports (preconditions).
                const inp = event.input as any
                let next = s.codeLog
                if (event.name === 'run_script' && typeof inp?.script === 'string') {
                  next = [...next, { kind: 'script', id: event.id, label: inp.label, text: inp.script, status: 'running' }]
                } else if (event.name === 'load_file' && typeof inp?.name === 'string') {
                  next = [...next, { kind: 'load', id: event.id, name: inp.name, status: 'running' }]
                } else if (event.name === 'get_selection' || event.name === 'find' || event.name === 'inspect') {
                  // Discovery — captured only to give runtime-resolved ids their provenance.
                  next = [...next, { kind: 'lookup', id: event.id, tool: event.name, input: inp }]
                }
                return {
                  codeLog: next,
                  messages: [
                    ...s.messages,
                    {
                      type: 'tool',
                      id: event.id,
                      name: event.name,
                      label: toolLabel(event.name, event.input),
                      status: 'running',
                      detail: formatToolInput(event.input),
                    },
                  ],
                }
              })
              break

            case 'tool_end':
              set(s => {
                const msgs = [...s.messages]
                // Match by id so concurrent same-named tools update the right row.
                const i = msgs.findIndex(m => m.type === 'tool' && m.id === event.id && m.status === 'running')
                if (i >= 0) {
                  const prev = msgs[i] as Extract<UIMessage, { type: 'tool' }>
                  const r = event.result
                  let detail: string | undefined
                  let image: string | undefined
                  let download: { filename: string; mimeType: string; data: string } | undefined
                  if (r.error) {
                    detail = r.error
                  } else if (event.name === 'snapshot' && r.result && typeof r.result === 'object' && (r.result as any).image) {
                    const snap = r.result as { image: string; mimeType?: string; width?: number; height?: number; label?: string }
                    image = `data:${snap.mimeType || 'image/png'};base64,${snap.image}`
                    detail = [snap.label, snap.width && snap.height ? `${snap.width}×${snap.height}` : ''].filter(Boolean).join(' · ')
                  } else if (event.name === 'download' && r.result && typeof r.result === 'object' && (r.result as any).download) {
                    const res = r.result as { download: { filename: string; mimeType: string; data: string }; size?: number }
                    download = res.download
                    detail = [res.download.filename, res.size ? formatBytes(res.size) : ''].filter(Boolean).join(' · ')
                  } else {
                    detail = formatToolResult(r.result)
                  }
                  msgs[i] = { type: 'tool', id: event.id, name: event.name, label: prev.label, status: r.error ? 'error' : 'done', detail, image, download }
                }
                // Finalise the matching code-log entry: status, return value (for ID
                // threading), and any error message.
                const codeLog = s.codeLog.some(e => 'id' in e && e.id === event.id)
                  ? s.codeLog.map(e => {
                      if (!('id' in e) || e.id !== event.id) return e
                      if (e.kind === 'lookup') return { ...e, ret: event.result.result }
                      const status = (event.result.error ? 'error' : 'done') as 'done' | 'error'
                      if (e.kind === 'call') return { ...e, status, ret: event.result.result, error: event.result.error }
                      if (e.kind === 'script') return { ...e, status, error: event.result.error }
                      return { ...e, status }
                    })
                  : s.codeLog
                return { messages: msgs, codeLog }
              })
              // Reset assistantText for next text block after tool results
              assistantText = ''
              break

            case 'subagent_start':
              set(s => ({
                messages: [
                  ...s.messages,
                  { type: 'subagent', id: event.id, name: event.name, goal: event.goal, status: 'running' },
                ],
              }))
              break

            case 'subagent_end':
              set(s => {
                const msgs = [...s.messages]
                const i = msgs.findIndex(m => m.type === 'subagent' && m.id === event.id && m.status === 'running')
                if (i >= 0) {
                  const prev = msgs[i] as Extract<UIMessage, { type: 'subagent' }>
                  msgs[i] = { type: 'subagent', id: event.id, name: event.name, goal: prev.goal, status: 'done', summary: event.summary }
                }
                return { messages: msgs }
              })
              break

            case 'usage':
              set({ usage: { inputTokens: event.inputTokens, outputTokens: event.outputTokens } })
              break

            case 'error':
              set({ error: event.error })
              break

            case 'done':
              // The loop hands back its full message array (text + tool_use +
              // tool_result + thinking). Persist it verbatim so the next turn
              // retains all tool/geometry context.
              set({ rawHistory: event.messages })
              break
          }
        }
      } catch (e: any) {
        set({ error: e.message || String(e) })
      } finally {
        set({ isRunning: false, _controller: null })
      }
    },

    cancel() {
      get()._controller?.abort()
    },

    reset() {
      get()._controller?.abort()
      set({ messages: [], rawHistory: [], isRunning: false, error: null, usage: null, codeLog: [], _controller: null })
    },
  }))

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Build a readable label for a tool call, e.g. "run_script · bolt circle" — so
// the trace shows WHAT a call did, not just the bare tool name.
function toolLabel(name: string, input: Record<string, unknown>): string {
  const str = (k: string) => {
    const v = input?.[k]
    return typeof v === 'string' || typeof v === 'number' ? String(v) : ''
  }
  let detail = ''
  switch (name) {
    case 'docs': {
      const keys = Array.isArray(input?.keys) ? (input.keys as unknown[]).filter(k => typeof k === 'string') : []
      detail = keys.length <= 4 ? keys.join(', ') : `${keys.slice(0, 4).join(', ')} +${keys.length - 4}`
      break
    }
    case 'describe_method':
      detail = str('method')
      break
    case 'run_script':
      detail = str('label')
      break
    case 'read_doc':
      detail = str('doc')
      break
    case 'checkpoint':
    case 'restore':
      detail = str('label')
      break
    case 'notes':
      detail = str('action')
      break
    case 'list_methods':
      detail = str('domain') || str('filter')
      break
    case 'find':
      detail = str('type') || str('name')
      break
    case 'inspect':
      detail = str('id') && `#${str('id')}`
      break
    case 'snapshot':
      detail = str('label')
      break
    case 'delegate':
      detail = str('agent')
      break
    case 'download':
      detail = str('format') || str('filename')
      break
  }
  return detail ? `${name} · ${detail}` : name
}

function formatToolInput(input: Record<string, unknown>): string {
  try {
    const s = JSON.stringify(input, null, 2)
    return s.length > 200 ? s.slice(0, 200) + '...' : s
  } catch {
    return ''
  }
}

function formatToolResult(result: unknown): string {
  try {
    const s = JSON.stringify(result, null, 2)
    return s.length > 300 ? s.slice(0, 300) + '...' : s
  } catch {
    return ''
  }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
