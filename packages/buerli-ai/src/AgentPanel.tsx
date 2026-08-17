// ─── AgentPanel — portable React chat panel for buerli apps ──────────────────

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DrawingID } from '@buerli.io/core'
import type { AgentConfig, LLMProvider, ModelOption, ProviderCapabilities, ReasoningEffort } from './types'
import { createAgentStore, AgentStore, UIMessage, CodeEvent } from './store'

// ─── Theme ────────────────────────────────────────────────────────────────────

export type AgentPanelTheme = {
  /** Panel background. Default: #1a1a1a */
  bg?: string
  /** Primary text color. Default: #e0e0e0 */
  text?: string
  /** Muted/secondary text. Default: #aaa */
  textMuted?: string
  /** Border color. Default: #333 */
  border?: string
  /** User message bubble. Default: #2563eb */
  userBubble?: string
  /** Assistant message bubble. Default: #2a2a2a */
  assistantBubble?: string
  /** Accent color (send button, links). Default: #2563eb */
  accent?: string
  /** Input field background. Default: #2a2a2a */
  inputBg?: string
  /** Error background. Default: #3d1f1f */
  errorBg?: string
  /** Tool success background. Default: #1f2d1f */
  toolBg?: string
  /** Font family. Default: system */
  fontFamily?: string
  /** Base font size. Default: 13px */
  fontSize?: string
  /** Floating window initial width. Default: 360px */
  width?: number
  /** Floating window initial height. Default: 520px */
  height?: number
}

// ─── Props ────────────────────────────────────────────────────────────────────

export type AgentPanelProps = {
  /** Active drawing ID to operate on. */
  drawingId: DrawingID
  /** LLM provider instance (use createAnthropicProvider or bring your own). */
  provider: LLMProvider
  /** Max tool-use loop iterations. Default: 40 */
  maxIterations?: number
  /** Max tokens per LLM call. Default: 8192 */
  maxTokens?: number
  /** Custom system prompt override. */
  systemPrompt?: string
  /** Extra context appended to system prompt. */
  extraContext?: string
  /** Whether the panel is visible. */
  open?: boolean
  /** Called when the user requests to close the panel. */
  onClose?: () => void
  /** Custom CSS class for the outer container. */
  className?: string
  /** Initial corner the floating window appears in. Default: 'right' (top-right). */
  position?: 'right' | 'left' | 'bottom'
  /** Model name shown next to the context ring (e.g. "gpt-5.5"). */
  modelName?: string
  /** Context window size (prompt-token budget) — denominator for the context ring. */
  contextLimit?: number
  /**
   * Initial reasoning ("thinking") level. When provided, a level picker appears in
   * the footer between the model name and the context ring, letting the user change
   * it per message. Omit to hide the picker (e.g. for providers without reasoning).
   */
  reasoningEffort?: ReasoningEffort
  /**
   * Force snapshot images to/away from the model. Default: derived from the selected
   * model's vision capability.
   */
  sendSnapshotsToModel?: boolean
  /** Theme overrides. */
  theme?: AgentPanelTheme
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AgentPanel: React.FC<AgentPanelProps> = ({
  drawingId,
  provider,
  maxIterations,
  maxTokens,
  systemPrompt,
  extraContext,
  open = true,
  onClose,
  className,
  position = 'right',
  modelName,
  contextLimit,
  reasoningEffort,
  sendSnapshotsToModel,
  theme,
}) => {
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<
    { name: string; data: string; mediaType: string; kind: 'image' | 'file' }[]
  >([])
  // Provider-declared capabilities (models + which support reasoning). Loaded once
  // on mount; null until then / when the provider exposes none. Drives both pickers
  // so each only appears when it's genuinely supported.
  const [caps, setCaps] = useState<ProviderCapabilities | null>(null)
  const [modelId, setModelId] = useState<string | undefined>(modelName)
  // Live reasoning level, seeded from the prop (default 'medium').
  const [effort, setEffort] = useState<ReasoningEffort>(reasoningEffort ?? 'medium')

  // Discover models/reasoning from the provider. Degrades silently if unsupported
  // (custom provider) or the request fails (CORS / offline) — no picker is shown.
  useEffect(() => {
    if (!provider.getCapabilities) return
    let cancelled = false
    provider
      .getCapabilities()
      .then(c => {
        if (cancelled || !c || !c.models?.length) return
        setCaps(c)
        // Keep the seeded selection if it's a real model; otherwise fall back.
        setModelId(prev => (prev && c.models.some(m => m.id === prev) ? prev : c.defaultModel ?? c.models[0]?.id))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [provider])

  // Resolve what the footer should show. The model picker appears with ≥2 models;
  // the reasoning picker appears only when the *selected* model supports it. Before
  // caps load, fall back to the prop-based opt-in so a configured level shows at once.
  const models = caps?.models ?? []
  const selectedModel = models.find(m => m.id === modelId)
  const showModelPicker = models.length > 1
  const reasoningLevels: ReasoningEffort[] = caps
    ? selectedModel?.reasoningEfforts ?? []
    : reasoningEffort !== undefined
      ? ['low', 'medium', 'high'] // safe shared subset until discovery replaces it
      : []
  const showReasoning = reasoningLevels.length > 0
  const shownModelName = modelId ?? modelName
  // Per-model limits win; the maxTokens/contextLimit props are fallbacks for when
  // discovery is unavailable or a model didn't declare them.
  const ringLimit = selectedModel?.contextLimit ?? contextLimit
  const effectiveMaxTokens = selectedModel?.maxOutputTokens ?? maxTokens

  // Keep the chosen effort within the active model's supported set.
  const reasoningKey = reasoningLevels.join(',')
  useEffect(() => {
    const levels = reasoningKey ? (reasoningKey.split(',') as ReasoningEffort[]) : []
    if (levels.length && !levels.includes(effort)) {
      setEffort(levels.includes('medium') ? 'medium' : levels[levels.length - 1])
    }
  }, [reasoningKey, effort])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Create a stable store instance per panel mount
  const storeRef = useRef<ReturnType<typeof createAgentStore> | null>(null)
  if (!storeRef.current) {
    storeRef.current = createAgentStore()
  }
  const store = storeRef.current

  const messages = store(s => s.messages)
  const isRunning = store(s => s.isRunning)
  const error = store(s => s.error)
  const usage = store(s => s.usage)
  const codeLog = store(s => s.codeLog)
  const callCount = codeLog.reduce((n, e) => n + (e.kind === 'call' || e.kind === 'script' ? 1 : 0), 0)
  // Code-mirror side panel: a generic buerli script generated from the session.
  const [codeOpen, setCodeOpen] = useState(false)

  // A tool/sub-agent row that's actively executing shows its OWN spinner, so the
  // global "Thinking…" should be suppressed only then. Between turns — when the last
  // tool is already ✓ done and the model is making its next (often slow) LLM call —
  // the indicator must stay visible so the panel never looks idle mid-run.
  const lastMsg = messages[messages.length - 1]
  const toolActive =
    !!lastMsg && (lastMsg.type === 'tool' || lastMsg.type === 'subagent') && lastMsg.status === 'running'

  // Merge theme with defaults
  const t = { ...DEFAULT_THEME, ...theme }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Inject the CSS keyframes used by the spinner / pulse indicators (once).
  useEffect(() => {
    ensureKeyframes()
  }, [])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if ((!text && attachments.length === 0) || isRunning) return
    setInput('')
    const imgs = attachments.filter(a => a.kind === 'image').map(a => ({ data: a.data, mediaType: a.mediaType }))
    const files = attachments
      .filter(a => a.kind === 'file')
      .map(a => ({ name: a.name, mediaType: a.mediaType, data: a.data }))
    setAttachments([])

    const config: AgentConfig = {
      provider,
      drawingId,
      maxIterations,
      maxTokens: effectiveMaxTokens,
      // Drives history pruning on long sessions (falls back to a conservative default).
      contextLimit: ringLimit,
      model: modelId,
      reasoningEffort: showReasoning ? effort : undefined,
      systemPrompt,
      extraContext,
      // Vision-capable model → snapshots go to the model so it can verify its own
      // work visually. Models without vision get metadata only. The prop overrides
      // in both directions (endpoints that mis-report their vision support).
      sendSnapshotsToModel: sendSnapshotsToModel ?? selectedModel?.vision ?? false,
    }

    store.getState().sendMessage(text, config, imgs.length ? imgs : undefined, files.length ? files : undefined)
  }, [input, attachments, isRunning, provider, drawingId, maxIterations, effectiveMaxTokens, ringLimit, modelId, showReasoning, effort, systemPrompt, extraContext, selectedModel, sendSnapshotsToModel, store])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleStop = useCallback(() => {
    store.getState().cancel()
  }, [store])

  const handleReset = useCallback(() => {
    store.getState().reset()
  }, [store])

  const onFilesSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = '' // allow re-picking the same file
    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      const reader = new FileReader()
      reader.onload = () => {
        const url = String(reader.result)
        const data = url.slice(url.indexOf(',') + 1)
        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            data,
            mediaType: file.type || (isImage ? 'image/png' : 'application/octet-stream'),
            kind: isImage ? 'image' : 'file',
          },
        ])
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const removeAttachment = useCallback((i: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== i))
  }, [])

  // ─── Floating window: drag, resize, collapse ─────────────────────────────
  const [collapsed, setCollapsed] = useState(false)
  const [rect, setRect] = useState<Rect>(() => initialRect(position, t))
  const dragRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null)
  const resizeRef = useRef<{ px: number; py: number; ow: number; oh: number } | null>(null)

  const onHeaderPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('button')) return // let header buttons receive the click
      dragRef.current = { px: e.clientX, py: e.clientY, ox: rect.x, oy: rect.y }
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [rect.x, rect.y],
  )

  const onHeaderPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      const x = clamp(d.ox + (e.clientX - d.px), 120 - rect.w, window.innerWidth - 120)
      const y = clamp(d.oy + (e.clientY - d.py), 0, window.innerHeight - 40)
      setRect(r => ({ ...r, x, y }))
    },
    [rect.w],
  )

  const onHeaderPointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current = null
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
  }, [])

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      resizeRef.current = { px: e.clientX, py: e.clientY, ow: rect.w, oh: rect.h }
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [rect.w, rect.h],
  )

  const onResizePointerMove = useCallback((e: React.PointerEvent) => {
    const r = resizeRef.current
    if (!r) return
    const w = clamp(r.ow + (e.clientX - r.px), 300, window.innerWidth - 16)
    const h = clamp(r.oh + (e.clientY - r.py), 240, window.innerHeight - 16)
    setRect(rc => ({ ...rc, w, h }))
  }, [])

  const onResizePointerUp = useCallback((e: React.PointerEvent) => {
    resizeRef.current = null
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
  }, [])

  if (!open) return null

  const cssVars = {
    '--agent-bg': t.bg,
    '--agent-text': t.text,
    '--agent-text-muted': t.textMuted,
    '--agent-border': t.border,
    '--agent-user-bubble': t.userBubble,
    '--agent-assistant-bubble': t.assistantBubble,
    '--agent-accent': t.accent,
    '--agent-input-bg': t.inputBg,
    '--agent-error-bg': t.errorBg,
    '--agent-tool-bg': t.toolBg,
    '--agent-font': t.fontFamily,
    '--agent-font-size': t.fontSize,
  } as React.CSSProperties

  return (
    <div
      className={`cad-agent-panel cad-agent-panel--floating ${className ?? ''}`}
      style={{ ...floatingPanelStyle(rect, collapsed, t), ...cssVars }}
    >
      {/* Header — doubles as the drag handle */}
      <div
        style={headerStyle(t)}
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
      >
        <span style={{ fontWeight: 600, fontSize: 13 }}>AI Assistant</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setCodeOpen(o => !o)}
            style={headerBtnStyle(t, codeOpen)}
            title={codeOpen ? 'Hide session code' : 'Show session code'}
          >
            {'</>'}
            {callCount > 0 && <span style={codeBadgeStyle(t)}>{callCount}</span>}
          </button>
          <button
            onClick={() => setCollapsed(c => !c)}
            style={headerBtnStyle(t)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '▢' : '—'}
          </button>
          <button onClick={handleReset} style={headerBtnStyle(t)} title="Clear conversation">
            ↺
          </button>
          {onClose && (
            <button onClick={onClose} style={headerBtnStyle(t)} title="Close">
              ✕
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Body: session code mirror, or the chat transcript */}
          {codeOpen ? (
            <CodePanel log={codeLog} theme={t} />
          ) : (
            <div style={messagesContainerStyle}>
              {messages.length === 0 && (
                <div style={emptyStyle}>
                  Ask me to create or modify CAD geometry.
                  <br />
                  <span style={{ fontSize: 11, opacity: 0.7 }}>
                    e.g. "Create a box 100x50x30 with 5mm fillets on all edges"
                  </span>
                </div>
              )}
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} theme={t} />
              ))}
              {isRunning && !toolActive && <ThinkingIndicator />}
              {error && <div style={errorStyle(t)}>Error: {error}</div>}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input */}
          <div style={inputContainerStyle(t)}>
            {attachments.length > 0 && (
              <div style={attachmentsRowStyle}>
                {attachments.map((a, i) =>
                  a.kind === 'image' ? (
                    <div key={i} style={attachmentChipStyle(t)} title={a.name}>
                      <img src={`data:${a.mediaType};base64,${a.data}`} alt={a.name} style={attachmentThumbStyle} />
                      <button onClick={() => removeAttachment(i)} style={attachmentRemoveStyle} title="Remove">
                        ×
                      </button>
                    </div>
                  ) : (
                    <div key={i} style={fileChipStyle(t)} title={a.name}>
                      <span style={fileChipNameStyle}>{a.name}</span>
                      <button onClick={() => removeAttachment(i)} style={fileChipRemoveStyle(t)} title="Remove">
                        ×
                      </button>
                    </div>
                  ),
                )}
              </div>
            )}
            <div style={inputRowStyle}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={attachBtnStyle(t)}
                title="Attach image"
                disabled={isRunning}
              >
                +
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what to create or modify..."
                disabled={isRunning}
                rows={2}
                style={inputFieldStyle(t)}
              />
              {isRunning ? (
                <button onClick={handleStop} style={stopBtnStyle(t)} title="Stop">
                  ■
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim() && attachments.length === 0}
                  style={sendBtnStyle(t)}
                  title="Send"
                >
                  ▶
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.stp,.step,.igs,.iges,.stl,.brep,.obj,.sat,.x_t,.x_b,.of1,.ofb"
              multiple
              onChange={onFilesSelected}
              style={{ display: 'none' }}
            />
          </div>

          {/* Context meter — model picker · thinking picker · usage ring, right-aligned under the input */}
          {(shownModelName || usage || showModelPicker || showReasoning) && (
            <div style={contextBarStyle(t)}>
              {showModelPicker ? (
                <ModelPicker models={models} value={modelId} onChange={setModelId} disabled={isRunning} theme={t} />
              ) : (
                shownModelName && <span style={{ opacity: 0.6 }}>{shownModelName}</span>
              )}
              {showReasoning && (
                <ReasoningPicker value={effort} levels={reasoningLevels} onChange={setEffort} disabled={isRunning} theme={t} />
              )}
              <ContextRing used={usage?.inputTokens} limit={ringLimit} theme={t} />
            </div>
          )}

          {/* Resize handle (bottom-right corner) */}
          <div
            style={resizeHandleStyle(t)}
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            title="Drag to resize"
          />
        </>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ message: UIMessage; theme: Required<AgentPanelTheme> }> = ({ message, theme: t }) => {
  switch (message.type) {
    case 'user':
      return (
        <div style={userMsgStyle(t)}>
          {message.images && message.images.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: message.text ? 6 : 0 }}>
              {message.images.map((src, i) => (
                <img key={i} src={src} alt="" style={{ maxWidth: 140, maxHeight: 140, borderRadius: 6, display: 'block' }} />
              ))}
            </div>
          )}
          {message.files && message.files.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: message.text ? 6 : 0 }}>
              {message.files.map((name, i) => (
                <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.18)' }}>
                  {name}
                </span>
              ))}
            </div>
          )}
          {message.text}
        </div>
      )

    case 'assistant':
      return (
        <div style={assistantMsgStyle(t)}>
          <Markdown text={message.text} theme={t} />
        </div>
      )

    case 'thinking':
      return <ThinkingBlock text={message.text} />

    case 'tool':
      return <ToolBlock message={message} theme={t} />

    case 'subagent':
      return <SubagentBlock message={message} theme={t} />
  }
}

// Lean, collapsible sub-agent row: a slightly-indented gray card with a moving
// spinner while running, then ✓ (done) / ✗ (failed). Caption = "sub agent: <task>".
// Click to reveal the result summary, rendered as Markdown.
const SubagentBlock: React.FC<{ message: Extract<UIMessage, { type: 'subagent' }>; theme: Required<AgentPanelTheme> }> = ({
  message: m,
  theme: t,
}) => {
  const [open, setOpen] = useState(false)
  const running = m.status === 'running'
  const errored = !running && !!m.summary && /^subagent error/i.test(m.summary.trim())
  const cardStatus = running ? 'running' : errored ? 'error' : 'done'
  const expandable = !running && !!m.summary
  const caption = m.goal || m.name
  return (
    <div style={subagentCardStyle(cardStatus, t)}>
      <div onClick={() => expandable && setOpen(o => !o)} style={toolHeaderStyle(expandable)}>
        {running ? (
          <Spinner />
        ) : (
          <span style={{ color: errored ? '#ff8888' : '#62c46e', width: 10, textAlign: 'center', flexShrink: 0 }}>
            {errored ? '✗' : '✓'}
          </span>
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ opacity: 0.55 }}>sub agent: </span>
          {caption}
        </span>
        {expandable && <span style={{ marginLeft: 6, opacity: 0.4, fontSize: 9, flexShrink: 0 }}>{open ? '▾' : '▸'}</span>}
      </div>
      {open && m.summary && (
        <div style={mdDetailStyle}>
          <Markdown text={m.summary} theme={t} />
        </div>
      )}
    </div>
  )
}

// Lean, collapsible tool row: shows just the status icon + label; click to reveal
// the input/result detail.
const ToolBlock: React.FC<{ message: Extract<UIMessage, { type: 'tool' }>; theme: Required<AgentPanelTheme> }> = ({
  message: m,
  theme: t,
}) => {
  // Snapshots open by default — the rendered image IS the feedback.
  const [open, setOpen] = useState(m.name === 'snapshot')
  useEffect(() => {
    if (m.name === 'snapshot' && m.image) setOpen(true)
  }, [m.name, m.image])
  const expandable = !!(m.detail || m.image || m.input || m.result != null)
  const running = m.status === 'running'
  const icon = m.status === 'error' ? '✗' : '✓'
  const iconColor = m.status === 'error' ? '#ff8888' : '#62c46e'
  return (
    <div style={toolCardStyle(m.status, t)}>
      <div onClick={() => expandable && setOpen(o => !o)} style={toolHeaderStyle(expandable)}>
        {running ? (
          <Spinner />
        ) : (
          <span style={{ color: iconColor, width: 10, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label ?? m.name}</span>
        {expandable && <span style={{ marginLeft: 6, opacity: 0.4, fontSize: 9, flexShrink: 0 }}>{open ? '▾' : '▸'}</span>}
      </div>
      {m.download && (
        <button type="button" onClick={() => triggerDownload(m.download!)} style={downloadBtnStyle(t)} title={`Download ${m.download.filename}`}>
          <span aria-hidden style={{ fontSize: 13 }}>⬇</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Download {m.download.filename}</span>
        </button>
      )}
      {open && m.image && <img src={m.image} alt={m.label ?? 'snapshot'} style={toolImageStyle} />}
      {open && <ToolDetail m={m} />}
    </div>
  )
}

// ── Per-tool expanded detail — structure over truncation ─────────────────────

const detailSectionTitle: React.CSSProperties = {
  fontSize: 9, opacity: 0.55, textTransform: 'uppercase', letterSpacing: 0.5,
  padding: '5px 8px 0',
}

const PrettyJson: React.FC<{ v: unknown }> = ({ v }) => {
  const text = useMemo(() => {
    try {
      const s = JSON.stringify(v, null, 2)
      return s && s.length > 8000 ? s.slice(0, 8000) + `\n… (${s.length} chars total)` : s
    } catch {
      return String(v)
    }
  }, [v])
  if (text == null || text === 'null' || text === '{}') return null
  return <pre style={toolDetailInnerStyle}>{text}</pre>
}

const CodeView: React.FC<{ code: string }> = ({ code }) => (
  <pre style={{ ...toolDetailInnerStyle, whiteSpace: 'pre', fontFamily: 'ui-monospace, monospace' }}>
    {highlightCode(code.length > 12000 ? code.slice(0, 12000) + `\n// … (${code.length} chars total)` : code)}
  </pre>
)

/** Expanded body of a tool chip: shows WHAT the call did and what came back. */
const ToolDetail: React.FC<{ m: Extract<UIMessage, { type: 'tool' }> }> = ({ m }) => {
  // Errors: the message itself is the detail.
  if (m.status === 'error' && m.detail) {
    return <pre style={{ ...toolDetailInnerStyle, color: '#ff9d9d' }}>{m.detail}</pre>
  }

  // run_script: the script IS the content — highlighted, with logs + return value.
  if (m.name === 'run_script' && typeof m.input?.script === 'string') {
    const res = (m.result ?? {}) as { returned?: unknown; logs?: unknown[] }
    const logs = Array.isArray(res.logs) ? res.logs : []
    return (
      <div>
        <div style={detailSectionTitle}>script</div>
        <CodeView code={m.input.script} />
        {logs.length > 0 && (
          <>
            <div style={detailSectionTitle}>console ({logs.length})</div>
            <pre style={toolDetailInnerStyle}>{logs.map(l => String(l)).join('\n')}</pre>
          </>
        )}
        {res.returned != null && (
          <>
            <div style={detailSectionTitle}>returned</div>
            <PrettyJson v={res.returned} />
          </>
        )}
      </div>
    )
  }

  // docs: which documents were fetched, and which of them resolved.
  if (m.name === 'docs' && Array.isArray(m.input?.keys)) {
    const text = typeof m.result === 'string' ? m.result : ''
    const missing = new Set<string>()
    const nf = text.split('# ═══ not found ═══')[1]
    if (nf) for (const line of nf.split('\n')) {
      const k = line.split(':')[0]?.trim()
      if (k) missing.add(k)
    }
    return (
      <div style={{ padding: '4px 8px 8px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {(m.input.keys as unknown[]).map((k, i) => {
          const key = String(k)
          const miss = missing.has(key)
          return (
            <span key={i} style={{
              fontSize: 10, padding: '2px 6px', borderRadius: 4,
              background: miss ? 'rgba(255,120,120,0.15)' : 'rgba(120,255,150,0.10)',
              border: `1px solid ${miss ? 'rgba(255,120,120,0.35)' : 'rgba(120,255,150,0.25)'}`,
            }}>
              {miss ? '✗ ' : '✓ '}{key}
            </span>
          )
        })}
        {text && <span style={{ fontSize: 9, opacity: 0.5, alignSelf: 'center' }}>{Math.round(text.length / 1000)}k chars → model</span>}
      </div>
    )
  }

  // snapshot meta rides under the image.
  if (m.name === 'snapshot') {
    return m.detail ? <pre style={toolDetailInnerStyle}>{m.detail}</pre> : null
  }

  // Generic: structured input + result, scrollable, explicitly truncated.
  return (
    <div>
      {m.input && Object.keys(m.input).length > 0 && (
        <>
          <div style={detailSectionTitle}>input</div>
          <PrettyJson v={m.input} />
        </>
      )}
      {m.result != null && (
        <>
          <div style={detailSectionTitle}>result</div>
          <PrettyJson v={m.result} />
        </>
      )}
      {!m.input && m.result == null && m.detail && <pre style={toolDetailInnerStyle}>{m.detail}</pre>}
    </div>
  )
}

// Turn the app-side base64 file bytes into a real download via a user click. The
// browser sandbox can't write to disk on its own, but a click on an <a download>
// (object URL) is an allowed user gesture.
function triggerDownload(d: { filename: string; mimeType: string; data: string }): void {
  try {
    const bin = atob(d.data)
    const arr = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
    const blob = new Blob([arr], { type: d.mimeType || 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = d.filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Download failed:', e)
  }
}

const ThinkingBlock: React.FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={thinkingBlockStyle}>
      <button onClick={() => setExpanded(!expanded)} style={thinkingToggleStyle}>
        <span style={{ fontSize: 10 }}>{expanded ? '▼' : '▶'}</span>
        <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Thinking…</span>
      </button>
      {expanded && (
        <pre style={thinkingContentStyle}>{text}</pre>
      )}
    </div>
  )
}

// Moving status indicator (rotating ring) shown while a tool/sub-agent runs.
const Spinner: React.FC<{ color?: string }> = ({ color }) => <span style={spinnerStyle(color)} />

// ─── Minimal Markdown renderer (dependency-free) ───────────────────────────────
// Renders the subset the agent actually emits: headings, GFM tables, fenced code,
// ordered/unordered lists, **bold**/*italic*/`code`, and paragraphs. Kept tiny on
// purpose — this package has no runtime deps, so we don't pull in a markdown lib.

const Markdown: React.FC<{ text: string; theme: Required<AgentPanelTheme> }> = ({ text }) => (
  <div style={mdRootStyle}>{renderMarkdownBlocks(text)}</div>
)

const isTableSep = (s: string) => /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)+\|?\s*$/.test(s)

function renderMarkdownBlocks(src: string): React.ReactNode[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) {
      i++
      continue
    }

    // Fenced code block ```lang … ```
    if (/^\s*```/.test(line)) {
      const code: string[] = []
      i++
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) code.push(lines[i++])
      i++ // closing fence
      blocks.push(
        <pre key={key++} style={mdCodeBlockStyle}>
          {code.join('\n')}
        </pre>,
      )
      continue
    }

    // GFM table: a header row followed by a |---|---| separator row
    if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitRow(line)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(splitRow(lines[i++]))
      blocks.push(
        <div key={key++} style={{ overflowX: 'auto' }}>
          <table style={mdTableStyle}>
            <thead>
              <tr>
                {header.map((c, j) => (
                  <th key={j} style={mdThStyle}>
                    {renderInline(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci} style={mdTdStyle}>
                      {renderInline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    // Heading
    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      blocks.push(
        <div key={key++} style={mdHeadingStyle(heading[1].length)}>
          {renderInline(heading[2])}
        </div>,
      )
      i++
      continue
    }

    // List (consecutive items)
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line)
      const items: string[] = []
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*+]|\d+\.)\s+/, ''))
        i++
      }
      // Set list-style-type inline on each <li> — the host app (Docusaurus/Infima)
      // resets list markers globally, so inheriting from <ul>/<ol> isn't enough.
      const liStyle: React.CSSProperties = { listStyleType: ordered ? 'decimal' : 'disc' }
      const items2 = items.map((it, j) => (
        <li key={j} style={liStyle}>
          {renderInline(it)}
        </li>
      ))
      blocks.push(
        ordered ? (
          <ol key={key++} style={mdListStyle}>
            {items2}
          </ol>
        ) : (
          <ul key={key++} style={mdListStyle}>
            {items2}
          </ul>
        ),
      )
      continue
    }

    // Paragraph: gather consecutive lines until a blank line or a block starter.
    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*```/.test(lines[i]) &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^\s*([-*+]|\d+\.)\s+/.test(lines[i]) &&
      !(lines[i].includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1]))
    ) {
      para.push(lines[i++])
    }
    blocks.push(
      <div key={key++} style={{ lineHeight: 1.5 }}>
        {renderInline(para.join(' '))}
      </div>,
    )
  }

  return blocks
}

// Split a table row into trimmed cells (drop the outer pipes).
function splitRow(row: string): string[] {
  return row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(c => c.trim())
}

// Inline formatting: `code` first (to protect its contents), then **bold**/*italic*.
function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let key = 0
  for (const part of text.split(/(`[^`]+`)/g)) {
    if (!part) continue
    if (part.length > 1 && part.startsWith('`') && part.endsWith('`')) {
      nodes.push(
        <code key={key++} style={mdInlineCodeStyle}>
          {part.slice(1, -1)}
        </code>,
      )
    } else {
      const re = /(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_)/g
      let last = 0
      let m: RegExpExecArray | null
      while ((m = re.exec(part))) {
        if (m.index > last) nodes.push(part.slice(last, m.index))
        const bold = m[2] ?? m[3]
        const italic = m[4] ?? m[5]
        if (bold != null) nodes.push(<strong key={key++}>{bold}</strong>)
        else if (italic != null) nodes.push(<em key={key++}>{italic}</em>)
        last = m.index + m[0].length
      }
      if (last < part.length) nodes.push(part.slice(last))
    }
  }
  return nodes
}

const ThinkingIndicator: React.FC = () => (
  <div style={{ fontSize: 11, opacity: 0.6, padding: '4px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
    <span style={pulseStyle}>●</span> Thinking…
  </div>
)

function fmtTokens(n?: number): string {
  if (n == null) return '—'
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n)
}

// Claude-Code-style context ring: gray track + blue arc = used / context limit.
// `used` is the last call's input (prompt) tokens; `limit` is the prompt budget.
const ContextRing: React.FC<{ used?: number; limit?: number; theme: Required<AgentPanelTheme> }> = ({ used, limit, theme: t }) => {
  const frac = used && limit ? Math.min(1, used / limit) : 0
  const size = 14
  const sw = 2.5
  const r = (size - sw) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.round(frac * 100)
  const title =
    used != null
      ? `Context: ${fmtTokens(used)}${limit ? ` / ${fmtTokens(limit)}` : ''} tokens${limit ? ` (${pct}%)` : ''}`
      : 'Context usage (no data yet)'
  return (
    <span title={title} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={sw} />
        {used != null && limit ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={t.accent}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={`${circ * frac} ${circ}`}
          />
        ) : null}
      </svg>
    </span>
  )
}

// Thinking/reasoning-level picker. A compact pill (between the model name and the
// context ring) that opens an upward menu of the levels the selected model actually
// advertises. The chosen level rides on each message as `reasoningEffort`.
// Labels/hints for the known level names; unknown ones fall back to a capitalised label.
const EFFORT_META: Record<string, { label: string; hint: string }> = {
  none: { label: 'None', hint: 'No reasoning · fastest' },
  minimal: { label: 'Minimal', hint: 'Barely reasons' },
  low: { label: 'Low', hint: 'Quick · light reasoning' },
  medium: { label: 'Medium', hint: 'Balanced' },
  high: { label: 'High', hint: 'Slower · deeper reasoning' },
  xhigh: { label: 'Extra high', hint: 'Deepest · slowest' },
}
const effortMeta = (v: string): { label: string; hint?: string } =>
  EFFORT_META[v] ?? { label: v.charAt(0).toUpperCase() + v.slice(1) }

const ReasoningPicker: React.FC<{
  value: ReasoningEffort
  /** Levels the active model actually supports — the menu lists only these. */
  levels: ReasoningEffort[]
  onChange: (v: ReasoningEffort) => void
  disabled?: boolean
  theme: Required<AgentPanelTheme>
}> = ({ value, levels, onChange, disabled, theme: t }) => {
  const [open, setOpen] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        title={`Thinking level: ${value} — click to change`}
        style={reasoningBtnStyle(t, open, disabled)}
      >
        <span style={{ opacity: 0.5 }}>think</span>
        <span style={{ fontWeight: 600 }}>{value}</span>
        <span style={{ fontSize: 8, lineHeight: 1, opacity: 0.6 }}>{open ? '▾' : '▴'}</span>
      </button>
      {open && (
        <>
          {/* Click-away backdrop — closes the menu on any outside click. */}
          <div style={pickerBackdropStyle} onClick={() => setOpen(false)} />
          <div style={pickerMenuStyle(t)} role="listbox">
            {levels.map(lvl => {
              const meta = effortMeta(lvl)
              return (
                <button
                  key={lvl}
                  type="button"
                  role="option"
                  aria-selected={lvl === value}
                  title={meta.hint}
                  onClick={() => {
                    onChange(lvl)
                    setOpen(false)
                  }}
                  style={pickerItemStyle(t, lvl === value)}
                >
                  {meta.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </span>
  )
}

// Model picker — same upward popover as the reasoning picker, but lists the
// provider-discovered models. Only rendered when there are ≥2 to choose from.
const ModelPicker: React.FC<{
  models: ModelOption[]
  value?: string
  onChange: (id: string) => void
  disabled?: boolean
  theme: Required<AgentPanelTheme>
}> = ({ models, value, onChange, disabled, theme: t }) => {
  const [open, setOpen] = useState(false)
  const current = models.find(m => m.id === value)
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        title={`Model: ${current?.label ?? value ?? '—'} — click to change`}
        style={reasoningBtnStyle(t, open, disabled)}
      >
        <span style={{ fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {current?.label ?? value ?? 'model'}
        </span>
        <span style={{ fontSize: 8, lineHeight: 1, opacity: 0.6 }}>{open ? '▾' : '▴'}</span>
      </button>
      {open && (
        <>
          <div style={pickerBackdropStyle} onClick={() => setOpen(false)} />
          <div style={{ ...pickerMenuStyle(t), minWidth: 160, maxHeight: 280, overflowY: 'auto' }} role="listbox">
            {models.map(m => (
              <button
                key={m.id}
                type="button"
                role="option"
                aria-selected={m.id === value}
                title={m.contextLimit ? `${m.id} · ${fmtTokens(m.contextLimit)} ctx` : m.id}
                onClick={() => {
                  onChange(m.id)
                  setOpen(false)
                }}
                style={pickerItemStyle(t, m.id === value)}
              >
                {m.label ?? m.id}
              </button>
            ))}
          </div>
        </>
      )}
    </span>
  )
}

// ─── Session code mirror (Bridge B — generic script) ─────────────────────────
//
// Generates a GENERIC, runnable-shaped buerli script from the session: runtime IDs
// are threaded into variables (captured from each call's return value), unresolved
// IDs become commented preconditions, file imports and the user's intent are noted
// as comments, and failed attempts are kept (commented out) with their error. A tiny
// zero-dependency JS highlighter colorises it (the package ships no highlight lib).

type LoadEvent = Extract<CodeEvent, { kind: 'load' }>
type ScriptEvent = Extract<CodeEvent, { kind: 'script' }>

// The session code IS the run_script sources — collected verbatim and joined
// with separators. No reconstruction: run_script is the only execution path.
function generateScript(log: CodeEvent[]): string {
  const parts: string[] = []
  for (const e of log) {
    if (e.kind === 'load') {
      const l = e as LoadEvent
      parts.push(`// ── load: ${l.name} ──`)
    } else if (e.kind === 'script') {
      const sc = e as ScriptEvent
      const status = sc.status === 'error' ? ' — FAILED' : sc.status === 'running' ? ' — running…' : ''
      parts.push(`// ══════ run_script${sc.label ? `: ${sc.label}` : ''}${status} ══════\n${(sc.text ?? '').trim()}`)
    }
  }
  if (parts.length === 0) return '// No scripts yet — run_script sources appear here as they execute.'
  return parts.join('\n\n')
}

// Syntax-highlight palette + keyword set for the code panel.
const CODE_COLORS = {
  comment: '#6a9955',
  string: '#ce9178',
  number: '#b5cea8',
  keyword: '#569cd6',
  property: '#9cdcfe',
  punct: '#808080',
}
const JS_KEYWORDS =
  /^(?:const|let|var|function|return|await|async|if|else|for|while|of|in|new|try|catch|finally|throw|class|true|false|null|undefined)$/

// Tokenise JS into colored React spans (escaped — no innerHTML). The master regex
// consumes every character via its final single-char alternative, so it's contiguous.
function highlightCode(code: string): React.ReactNode[] {
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\s\w])/g
  const out: React.ReactNode[] = []
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(code))) {
    const [full, comment, str, num, ident, , punct] = m
    let color: string | undefined
    if (comment) color = CODE_COLORS.comment
    else if (str) color = CODE_COLORS.string
    else if (num) color = CODE_COLORS.number
    else if (ident) {
      if (JS_KEYWORDS.test(ident)) color = CODE_COLORS.keyword
      else if (/^\s*:/.test(code.slice(re.lastIndex))) color = CODE_COLORS.property
    } else if (punct) color = CODE_COLORS.punct
    if (color) out.push(<span key={i++} style={{ color }}>{full}</span>)
    else out.push(full) // whitespace + plain identifiers (api, method segments)
  }
  return out
}

const CodePanel: React.FC<{ log: CodeEvent[]; theme: Required<AgentPanelTheme> }> = ({ log, theme: t }) => {
  const [copied, setCopied] = useState(false)
  const code = useMemo(() => generateScript(log), [log])
  const callCount = log.reduce((n, e) => n + (e.kind === 'call' || e.kind === 'script' ? 1 : 0), 0)
  const scrollRef = useRef<HTMLDivElement>(null)
  // Jump to the latest code whenever the panel is opened (this component mounts).
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])
  const copy = useCallback(() => {
    if (!code) return
    try {
      navigator.clipboard?.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      /* clipboard blocked — ignore */
    }
  }, [code])
  const lines = code.split('\n')
  const gutter = String(lines.length).length
  return (
    <div style={codePanelStyle(t)}>
      <div style={codeToolbarStyle(t)}>
        <span style={{ opacity: 0.7 }}>{callCount === 0 ? 'Session script' : `${callCount} call${callCount === 1 ? '' : 's'} · generic`}</span>
        <button onClick={copy} disabled={!code} style={codeCopyBtnStyle(t)} title="Copy script">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div ref={scrollRef} style={codeScrollStyle}>
        {callCount === 0 ? (
          <div style={codeEmptyStyle}>A generic buerli script is generated here as the agent builds — runtime IDs become variables.</div>
        ) : (
          <div style={codeLinesStyle(t)}>
            {lines.map((line, i) => (
              <div key={i} style={codeRowStyle}>
                <span style={codeGutterStyle(t, gutter)}>{i + 1}</span>
                <span style={codeLineCellStyle}>{highlightCode(line)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Default theme ────────────────────────────────────────────────────────────

const DEFAULT_THEME: Required<AgentPanelTheme> = {
  bg: '#1a1a1a',
  text: '#e0e0e0',
  textMuted: '#aaa',
  border: '#333',
  userBubble: '#2563eb',
  assistantBubble: '#2a2a2a',
  accent: '#2563eb',
  inputBg: '#2a2a2a',
  errorBg: '#3d1f1f',
  toolBg: '#1f2d1f',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: '13px',
  width: 360,
  height: 520,
}

// ─── Inline styles with theme support ─────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max)
}

// Inject the @keyframes used by the spinner (and the thinking-dot pulse) once.
// The package ships no global CSS, so we add the rule lazily on first mount.
function ensureKeyframes(): void {
  if (typeof document === 'undefined' || document.getElementById('cad-agent-keyframes')) return
  const el = document.createElement('style')
  el.id = 'cad-agent-keyframes'
  el.textContent =
    '@keyframes cad-agent-spin{to{transform:rotate(360deg)}}' +
    '@keyframes cad-agent-pulse{0%,100%{opacity:.3}50%{opacity:1}}'
  document.head.appendChild(el)
}

type Rect = { x: number; y: number; w: number; h: number }

function initialRect(position: string, t: Required<AgentPanelTheme>): Rect {
  const m = 16
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const x = position === 'left' ? m : vw - t.width - m
  const y = position === 'bottom' ? vh - t.height - m : m
  return { x, y, w: t.width, h: t.height }
}

const floatingPanelStyle = (rect: Rect, collapsed: boolean, t: Required<AgentPanelTheme>): React.CSSProperties => ({
  position: 'fixed',
  left: rect.x,
  top: rect.y,
  width: rect.w,
  height: collapsed ? 'auto' : rect.h,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: t.bg,
  color: t.text,
  border: `1px solid ${t.border}`,
  borderRadius: 8,
  boxShadow: '0 10px 40px rgba(0,0,0,0.45)',
  zIndex: 1000,
  overflow: 'hidden',
  fontFamily: t.fontFamily,
  fontSize: t.fontSize,
})

const headerStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  borderBottom: `1px solid ${t.border}`,
  flexShrink: 0,
  cursor: 'move',
  userSelect: 'none',
  touchAction: 'none',
})

const resizeHandleStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  position: 'absolute',
  right: 0,
  bottom: 0,
  width: 16,
  height: 16,
  cursor: 'nwse-resize',
  touchAction: 'none',
  zIndex: 2,
  background: `linear-gradient(135deg, transparent 0 55%, ${t.textMuted} 55% 65%, transparent 65% 80%, ${t.textMuted} 80% 90%, transparent 90%)`,
})

const headerBtnStyle = (t: Required<AgentPanelTheme>, active?: boolean): React.CSSProperties => ({
  position: 'relative',
  background: active ? 'rgba(255,255,255,0.08)' : 'none',
  border: 'none',
  color: active ? t.accent : t.textMuted,
  cursor: 'pointer',
  fontSize: 14,
  padding: '2px 6px',
  borderRadius: 3,
  fontFamily: 'inherit',
})

const codeBadgeStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  marginLeft: 3,
  fontSize: 9,
  fontWeight: 700,
  padding: '0 3px',
  borderRadius: 6,
  background: t.accent,
  color: '#fff',
  verticalAlign: 'middle',
})

const codePanelStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  background: '#15151a',
  borderTop: `1px solid ${t.border}`,
})

const codeToolbarStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '4px 10px',
  fontSize: 11,
  color: t.textMuted,
  borderBottom: `1px solid ${t.border}`,
  flexShrink: 0,
})

const codeCopyBtnStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  background: 'none',
  border: `1px solid ${t.border}`,
  color: t.textMuted,
  fontSize: 11,
  padding: '2px 8px',
  borderRadius: 4,
  cursor: 'pointer',
  fontFamily: 'inherit',
})

const codeScrollStyle: React.CSSProperties = { flex: 1, overflow: 'auto', minHeight: 0 }

const codeEmptyStyle: React.CSSProperties = { padding: '16px 12px', fontSize: 12, opacity: 0.5 }

const CODE_BG = '#15151a'

const codeLinesStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  width: 'max-content',
  minWidth: '100%',
  padding: '8px 0',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: 11.5,
  lineHeight: 1.6,
  color: t.text,
  tabSize: 2,
})

const codeRowStyle: React.CSSProperties = { display: 'flex' }

// Line-number gutter: pinned to the left while the code scrolls horizontally.
const codeGutterStyle = (t: Required<AgentPanelTheme>, digits: number): React.CSSProperties => ({
  position: 'sticky',
  left: 0,
  flexShrink: 0,
  boxSizing: 'content-box',
  minWidth: `${digits}ch`,
  padding: '0 10px',
  textAlign: 'right',
  color: t.textMuted,
  opacity: 0.5,
  userSelect: 'none',
  background: CODE_BG,
  borderRight: `1px solid ${t.border}`,
})

const codeLineCellStyle: React.CSSProperties = { whiteSpace: 'pre', padding: '0 12px 0 10px' }

const messagesContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px 20px',
  opacity: 0.6,
  fontSize: 12,
}

const userMsgStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  alignSelf: 'flex-end',
  backgroundColor: t.userBubble,
  color: '#fff',
  padding: '6px 10px',
  borderRadius: '12px 12px 2px 12px',
  maxWidth: '85%',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
})

const assistantMsgStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  alignSelf: 'flex-start',
  backgroundColor: t.assistantBubble,
  padding: '6px 10px',
  borderRadius: '12px 12px 12px 2px',
  maxWidth: '85%',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
})

// One unified card: header row + (when expanded) the detail/image live INSIDE it,
// separated by a top border — so it reads as a single rounded block, not text
// floating beneath a pill.
const toolCardStyle = (status: string, t: Required<AgentPanelTheme>): React.CSSProperties => ({
  alignSelf: 'flex-start',
  maxWidth: '92%',
  // flexShrink:0 is essential: this card sets overflow:hidden, which makes its
  // flex min-height resolve to 0. Without it, once the message list overflows the
  // scroll container, flexbox collapses every card to its 2px borders ("stripes").
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 6,
  overflow: 'hidden',
  fontFamily: 'monospace',
  fontSize: 11,
  color: t.text,
  background: status === 'error' ? 'rgba(180,70,70,0.12)' : 'rgba(255,255,255,0.05)',
  border: status === 'error' ? '1px solid #5b2b2b' : '1px solid transparent',
  opacity: status === 'running' ? 0.8 : 1,
})

const toolHeaderStyle = (clickable: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 8px',
  cursor: clickable ? 'pointer' : 'default',
  userSelect: 'none',
})

const toolDetailInnerStyle: React.CSSProperties = {
  margin: 0,
  padding: '6px 8px',
  borderTop: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(0,0,0,0.18)',
  fontSize: 10,
  maxHeight: 220,
  overflow: 'auto',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}

const downloadBtnStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  margin: '6px 0 2px',
  padding: '6px 10px',
  borderRadius: 6,
  border: 'none',
  background: t.accent,
  color: '#fff',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  alignSelf: 'flex-start',
  maxWidth: '100%',
})

const toolImageStyle: React.CSSProperties = {
  display: 'block',
  // The card is a flex column (align-items:stretch by default), which would
  // stretch the image horizontally. Pin it to flex-start and let width/height
  // stay auto with object-fit:contain so the snapshot keeps its aspect ratio.
  alignSelf: 'flex-start',
  width: 'auto',
  height: 'auto',
  maxWidth: 300,
  maxHeight: 240,
  objectFit: 'contain',
  borderTop: '1px solid rgba(255,255,255,0.08)',
}

// Sub-agent card: same gray block as a tool, just indented so it reads as nested.
const subagentCardStyle = (status: string, t: Required<AgentPanelTheme>): React.CSSProperties => ({
  ...toolCardStyle(status, t),
  marginLeft: 14,
  maxWidth: 'calc(92% - 14px)',
})

// Detail region for Markdown content (sans-serif, unlike the monospace tool detail).
const mdDetailStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderTop: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(0,0,0,0.18)',
  fontSize: 11,
  maxHeight: 320,
  overflow: 'auto',
}

const spinnerStyle = (color?: string): React.CSSProperties => ({
  display: 'inline-block',
  width: 9,
  height: 9,
  border: `1.5px solid ${color ?? 'rgba(255,255,255,0.3)'}`,
  borderTopColor: 'transparent',
  borderRadius: '50%',
  animation: 'cad-agent-spin 0.7s linear infinite',
  flexShrink: 0,
})

// ─── Markdown styles ────────────────────────────────────────────────────────
const mdRootStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  whiteSpace: 'normal',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const mdCodeBlockStyle: React.CSSProperties = {
  margin: 0,
  padding: '6px 8px',
  background: 'rgba(0,0,0,0.3)',
  borderRadius: 4,
  fontSize: 11,
  fontFamily: 'monospace',
  overflowX: 'auto',
  whiteSpace: 'pre',
}

const mdInlineCodeStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.92em',
  background: 'rgba(255,255,255,0.1)',
  padding: '1px 4px',
  borderRadius: 3,
}

const mdTableStyle: React.CSSProperties = {
  borderCollapse: 'collapse',
  width: '100%',
  fontSize: 11,
}

const mdThStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.15)',
  padding: '3px 6px',
  textAlign: 'left',
  fontWeight: 600,
  background: 'rgba(255,255,255,0.05)',
  whiteSpace: 'nowrap',
}

const mdTdStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.12)',
  padding: '3px 6px',
  textAlign: 'left',
}

const mdListStyle: React.CSSProperties = {
  margin: '2px 0',
  paddingLeft: 20,
  lineHeight: 1.5,
}

const mdHeadingStyle = (level: number): React.CSSProperties => ({
  fontWeight: 600,
  fontSize: level <= 1 ? 15 : level === 2 ? 14 : 13,
  margin: 0,
})

const thinkingBlockStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  maxWidth: '90%',
  fontSize: 11,
  opacity: 0.7,
}

const thinkingToggleStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'inherit',
  cursor: 'pointer',
  padding: '2px 4px',
  fontSize: 11,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  opacity: 0.8,
}

const thinkingContentStyle: React.CSSProperties = {
  margin: '4px 0 0 12px',
  padding: 6,
  backgroundColor: 'rgba(255,255,255,0.03)',
  borderLeft: '2px solid rgba(255,255,255,0.1)',
  borderRadius: 3,
  fontSize: 10,
  maxHeight: 200,
  overflow: 'auto',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  fontStyle: 'italic',
}

const pulseStyle: React.CSSProperties = {
  fontSize: 8,
  animation: 'cad-agent-pulse 1.2s ease-in-out infinite',
}

const errorStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  backgroundColor: t.errorBg,
  border: '1px solid #6b2f2f',
  color: '#ff8888',
  padding: '6px 10px',
  borderRadius: 6,
  fontSize: 11,
})

const inputContainerStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '8px 12px',
  borderTop: `1px solid ${t.border}`,
  flexShrink: 0,
})

const contextBarStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 6,
  padding: '0 12px 8px',
  fontSize: 11,
  color: t.textMuted,
  flexShrink: 0,
})

const reasoningBtnStyle = (
  t: Required<AgentPanelTheme>,
  open: boolean,
  disabled?: boolean,
): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '1px 6px',
  borderRadius: 5,
  border: `1px solid ${open ? t.accent : t.border}`,
  background: open ? 'rgba(255,255,255,0.06)' : 'transparent',
  color: t.textMuted,
  fontSize: 11,
  lineHeight: 1.5,
  fontFamily: 'inherit',
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.5 : 1,
  whiteSpace: 'nowrap',
})

// Fixed full-viewport click-away layer behind the popover (transparent).
const pickerBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 5,
}

const pickerMenuStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  position: 'absolute',
  bottom: '100%',
  right: 0,
  marginBottom: 6,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: 4,
  minWidth: 112,
  background: t.bg,
  border: `1px solid ${t.border}`,
  borderRadius: 8,
  boxShadow: '0 6px 22px rgba(0,0,0,0.45)',
  zIndex: 6,
})

const pickerItemStyle = (t: Required<AgentPanelTheme>, active: boolean): React.CSSProperties => ({
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '5px 8px',
  borderRadius: 5,
  border: 'none',
  background: active ? t.accent : 'transparent',
  color: active ? '#fff' : t.text,
  fontSize: 12,
  lineHeight: 1.4,
  fontFamily: 'inherit',
  cursor: 'pointer',
})

const inputRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  alignItems: 'stretch',
}

const attachmentsRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
}

const attachmentChipStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  position: 'relative',
  width: 44,
  height: 44,
  borderRadius: 6,
  overflow: 'hidden',
  border: `1px solid ${t.border}`,
  flexShrink: 0,
})

const attachmentThumbStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}

const attachmentRemoveStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  width: 16,
  height: 16,
  padding: 0,
  lineHeight: '14px',
  border: 'none',
  borderRadius: '0 0 0 6px',
  background: 'rgba(0,0,0,0.6)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 12,
}

const fileChipStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  maxWidth: 170,
  height: 44,
  padding: '0 6px 0 8px',
  borderRadius: 6,
  border: `1px solid ${t.border}`,
  backgroundColor: t.inputBg,
  fontSize: 11,
  flexShrink: 0,
})

const fileChipNameStyle: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const fileChipRemoveStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  border: 'none',
  background: 'none',
  color: t.textMuted,
  cursor: 'pointer',
  fontSize: 14,
  lineHeight: 1,
  padding: 0,
})

const attachBtnStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: t.inputBg,
  border: `1px solid ${t.border}`,
  borderRadius: 6,
  color: t.text,
  cursor: 'pointer',
  width: 34,
  padding: 0,
  fontSize: 18,
  lineHeight: 1,
  flexShrink: 0,
})

const inputFieldStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  flex: 1,
  backgroundColor: t.inputBg,
  border: `1px solid ${t.border}`,
  borderRadius: 6,
  color: t.text,
  padding: '6px 10px',
  fontSize: 13,
  resize: 'none',
  outline: 'none',
  fontFamily: 'inherit',
})

const sendBtnStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: t.accent,
  border: 'none',
  borderRadius: 6,
  color: '#fff',
  cursor: 'pointer',
  width: 34,
  padding: 0,
  fontSize: 14,
  flexShrink: 0,
})

const stopBtnStyle = (t: Required<AgentPanelTheme>): React.CSSProperties => ({
  ...sendBtnStyle(t),
  backgroundColor: t.border,
  color: t.text,
})
