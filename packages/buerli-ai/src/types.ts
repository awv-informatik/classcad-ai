// ─── Core types for the shared AI agent ───

import type { DrawingID } from '@buerli.io/core'

// ─── Provider interface ───────────────────────────────────────────────────────

/** A single message in the conversation. */
export type Message =
  | { role: 'user'; content: string | UserContentBlock[] }
  | { role: 'assistant'; content: Array<ContentBlock> }
  | { role: 'tool'; tool_use_id: string; content: string | ToolResultContent[] }

/** Content a user message can carry — text and/or attached images. */
export type UserContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }

/** A user-attached image (base64 data + its MIME type). */
export type ImageInput = { data: string; mediaType: string }

/** A user-attached file kept app-side; the model imports it by name via the load_file tool. */
export type FileAttachment = { name: string; mediaType: string; data: string }

/**
 * Reasoning / "thinking" level. Maps per-provider: OpenAI Responses → `reasoning.effort`,
 * Chat Completions → `reasoning_effort`. Higher = more deliberate (and slower/costlier).
 * The exact set is **discovered per model** (e.g. Copilot reports `none|low|medium|high|xhigh`;
 * OpenAI uses `minimal|low|medium|high`), so this is a loose union with a string escape hatch.
 */
export type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | (string & {})

export type ToolResultContent =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock

export type TextBlock = { type: 'text'; text: string }

export type ToolUseBlock = {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

export type ThinkingBlock = {
  type: 'thinking'
  thinking: string
  /** Opaque signature returned by Anthropic; must be preserved when replaying history with tools. */
  signature?: string
}

/** Result from a single LLM turn. */
export type ChatResponse = {
  content: ContentBlock[]
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | string
  /** Token usage for this call, normalized across providers. inputTokens ≈ how
   *  much of the context window the sent history occupied (drives the UI ring). */
  usage?: { inputTokens?: number; outputTokens?: number }
}

/**
 * Generic LLM provider contract. Implement this to connect any
 * tool-use capable LLM (Anthropic, OpenAI, local, etc.).
 */
export type LLMProvider = {
  chat: (params: ChatParams) => Promise<ChatResponse>
  /**
   * Optional capability discovery for the UI (drives the model + reasoning pickers).
   * May hit the network (e.g. a `/models` endpoint). The panel calls it once and
   * degrades gracefully if it rejects (no picker shown). Return the models the user
   * may select and which of them support reasoning.
   */
  getCapabilities?: () => Promise<ProviderCapabilities>
}

/** One selectable model and what it supports — drives the picker UI. */
export type ModelOption = {
  /** Model id sent to the API. */
  id: string
  /** Human label for the picker (defaults to id). */
  label?: string
  /** Context window / prompt-token budget — becomes the ring denominator when selected. */
  contextLimit?: number
  /** Max output tokens this model allows — becomes the per-call output cap when selected. */
  maxOutputTokens?: number
  /** Reasoning-effort levels this model supports. Empty/undefined → no reasoning picker. */
  reasoningEfforts?: ReasoningEffort[]
  /** Whether the model accepts image (vision) input — drives sending snapshots to the model. */
  vision?: boolean
  /**
   * API surface this model is routed to (`responses` or `chat`). Used by the auto-routing
   * provider to pick the right adapter per model, so one provider can serve a mixed list.
   */
  surface?: 'responses' | 'chat'
}

/** What a provider can offer the UI. */
export type ProviderCapabilities = {
  /** Selectable models. The UI shows a model picker when there are ≥2. */
  models: ModelOption[]
  /** Default/active model id (matches the provider's configured model). */
  defaultModel?: string
}

export type ChatParams = {
  system: string
  messages: Message[]
  tools: McpToolSchema[]
  max_tokens?: number
  /** Per-call model override (from the UI model picker). Falls back to the provider's default. */
  model?: string
  /** Reasoning effort for models that support it (OpenAI Responses / Chat Completions). */
  reasoningEffort?: ReasoningEffort
  /** Abort signal — providers should forward this to fetch(). */
  signal?: AbortSignal
  /**
   * Live stream deltas (optional). Streaming providers call this as reasoning/
   * text tokens arrive, BEFORE the folded response resolves — the UI renders a
   * live thinking ticker from it. Purely advisory: the returned ChatResponse
   * stays the single source of truth.
   */
  onDelta?: (delta: { thinking?: string; text?: string }) => void
}

// ─── MCP Tool Schema ──────────────────────────────────────────────────────────

/** MCP-format tool definition. */
export type McpToolSchema = {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, JsonSchemaProperty>
    required?: string[]
  }
}

export type JsonSchemaProperty = {
  type: string | string[]
  description?: string
  items?: JsonSchemaProperty
  properties?: Record<string, JsonSchemaProperty>
  additionalProperties?: boolean | JsonSchemaProperty
  enum?: string[]
  default?: unknown
}

// ─── Tool execution ───────────────────────────────────────────────────────────

export type ToolResult = {
  result?: unknown
  error?: string
}

export type ToolExecutorContext = {
  drawingId: DrawingID
  /** User-attached files available to the load_file tool (bytes kept app-side, referenced by name). */
  attachments?: FileAttachment[]
}

export type ToolHandler = (
  input: Record<string, unknown>,
  ctx: ToolExecutorContext,
) => Promise<ToolResult>

// ─── Agent configuration ──────────────────────────────────────────────────────

export type AgentConfig = {
  /** LLM provider implementation. */
  provider: LLMProvider
  /** Active drawing ID to operate on. */
  drawingId: DrawingID
  /** Max tool-use loop iterations before stopping. Default: 40 */
  maxIterations?: number
  /** Max tokens per LLM call. Default: 8192 */
  maxTokens?: number
  /**
   * Context window (prompt-token budget) of the active model. When set, the loop
   * prunes OLD tool results from the sent history once it approaches this budget
   * (recent turns and all user/assistant text are kept). Unset → a conservative
   * default budget is used.
   */
  contextLimit?: number
  /** Per-call model override (from the UI model picker). Falls back to the provider's default. */
  model?: string
  /**
   * Reasoning / "thinking" level for the LLM call (OpenAI Responses / Chat Completions).
   * Forwarded to the provider; no-op for providers that don't support it.
   */
  reasoningEffort?: ReasoningEffort
  /** Override the system prompt. */
  systemPrompt?: string
  /** Additional context to append to the system prompt. */
  extraContext?: string
  /** User-attached files the load_file tool can import (bytes kept app-side, referenced by name). */
  attachments?: FileAttachment[]
  /**
   * Send captured snapshots to the model as vision input, so it can visually verify
   * its own work. The panel sets this from the selected model's `vision` capability;
   * default false (metadata only) when unset — some endpoints are slow or fail on
   * image inputs (e.g. Copilot gpt-5.5 stalls ~60s), so only enable it where the
   * model actually accepts images.
   */
  sendSnapshotsToModel?: boolean
  /** Callback fired on each tool execution (for UI feedback). */
  onToolExecution?: (toolName: string, input: Record<string, unknown>) => void
  /** Callback fired when the agent produces a text response. */
  onTextResponse?: (text: string) => void
  /**
   * Live stream deltas from the CURRENT model round (reasoning/text tokens as
   * they arrive) — drives the panel's live thinking ticker. The folded round
   * result (thinking blocks, text, tool calls) remains the source of truth.
   */
  onStreamDelta?: (delta: { thinking?: string; text?: string }) => void
  /** Abort signal to cancel an in-flight run. */
  signal?: AbortSignal
  /** @internal Nesting depth — 0 for the top-level agent, incremented per subagent. */
  depth?: number
}
