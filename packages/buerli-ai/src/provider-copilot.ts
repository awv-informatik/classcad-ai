// ─── GitHub Copilot provider implementation ───────────────────────────────────
//
// Uses the Copilot Chat completions endpoint available to GitHub Copilot
// subscribers. Speaks the OpenAI format but routes through GitHub's API
// with a Copilot-specific auth token.
//
// Auth flow: The consumer is responsible for obtaining a valid GitHub token
// (e.g. via VS Code extension API, GitHub App installation token, or OAuth).

import type { ChatParams, ChatResponse, ContentBlock, LLMProvider, McpToolSchema, Message, ToolResultContent } from './types'
import { mapModelsResponse, modelsUrlFrom } from './capabilities'

export type CopilotProviderConfig = {
  /**
   * GitHub token with Copilot access.
   * In VS Code extensions: `vscode.authentication.getSession('github', ['copilot'])`
   * For server-side: a GitHub App installation token with Copilot permissions.
   */
  token: string
  /** Model ID. Default: gpt-4o */
  model?: string
  /** Override endpoint. Default: https://api.githubcopilot.com/chat/completions */
  endpoint?: string
  /** Extra headers to send. */
  headers?: Record<string, string>
}

/**
 * Creates an LLMProvider that uses GitHub Copilot's chat completions API.
 */
export function createCopilotProvider(config: CopilotProviderConfig): LLMProvider {
  const endpoint = config.endpoint ?? 'https://api.githubcopilot.com/chat/completions'
  const model = config.model ?? 'gpt-4o'

  return {
    async chat(params: ChatParams): Promise<ChatResponse> {
      const body: Record<string, unknown> = {
        model: params.model ?? model,
        max_tokens: params.max_tokens ?? 4096,
        messages: buildMessages(params.system, params.messages),
        tools: convertTools(params.tools),
        stream: true,
        stream_options: { include_usage: true },
      }

      // Reasoning effort (gpt-5.x / o-series). Set only when provided so plain
      // chat models aren't sent a field they'd reject.
      if (params.reasoningEffort) {
        body.reasoning_effort = params.reasoningEffort
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.token}`,
          'Editor-Version': 'vscode/1.90.0',
          'Copilot-Integration-Id': 'buerli-cad-agent',
          ...config.headers,
        },
        body: JSON.stringify(body),
        signal: params.signal,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Copilot request failed (${res.status}): ${text}`)
      }

      // Read the body INCREMENTALLY: the full text still feeds foldSse below
      // (single source of truth), but complete SSE lines are scanned as they
      // arrive so the UI can render live thinking/text (params.onDelta).
      let raw = ''
      const onDelta = params.onDelta
      const bodyReader = onDelta ? res.body?.getReader() : null
      if (bodyReader) {
        const dec = new TextDecoder()
        let lineBuf = ''
        for (;;) {
          const { done, value } = await bodyReader.read()
          const chunk = done ? dec.decode() : dec.decode(value, { stream: true })
          raw += chunk
          lineBuf += chunk
          let nl
          while ((nl = lineBuf.indexOf('\n')) >= 0) {
            const line = lineBuf.slice(0, nl).trim()
            lineBuf = lineBuf.slice(nl + 1)
            if (!line.startsWith('data:')) continue
            const payload = line.slice(5).trim()
            if (payload === '[DONE]') continue
            try {
              const j = JSON.parse(payload)
              const d = j.choices?.[0]?.delta ?? {}
              if (typeof d.reasoning_text === 'string' && d.reasoning_text) onDelta?.({ thinking: d.reasoning_text })
              else if (typeof d.content === 'string' && d.content) onDelta?.({ text: d.content })
            } catch { /* malformed line — foldSse below is the arbiter */ }
          }
          if (done) break
        }
      } else {
        raw = await res.text()
      }
      const json = raw.trimStart().startsWith('data:') ? foldSse(raw) : JSON.parse(raw)
      return adaptResponse(json)
    },

    // Discover the models the Copilot plan exposes (GET /models).
    // Rejects on CORS/404 → the panel hides the picker.
    async getCapabilities() {
      const res = await fetch(modelsUrlFrom(endpoint), {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Editor-Version': 'vscode/1.90.0',
          'Copilot-Integration-Id': 'buerli-cad-agent',
          ...config.headers,
        },
      })
      if (!res.ok) throw new Error(`models request failed (${res.status})`)
      // Chat Completions surface only — list models that support it.
      return mapModelsResponse(await res.json(), { defaultModel: model, requireSurface: 'chat' })
    },
  }
}

// ─── Format adapters (same as OpenAI format) ──────────────────────────────────

function buildMessages(system: string, messages: Message[]): unknown[] {
  const out: unknown[] = [{ role: 'system', content: system }]

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (msg.role === 'user') {
      out.push({ role: 'user', content: msg.content })
    } else if (msg.role === 'assistant') {
      const toolCalls: unknown[] = []
      let textContent = ''

      for (const block of msg.content) {
        if (block.type === 'text') {
          textContent += block.text
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            type: 'function',
            function: { name: block.name, arguments: JSON.stringify(block.input) },
          })
        }
      }

      const assistantMsg: Record<string, unknown> = { role: 'assistant' }
      if (textContent) assistantMsg.content = textContent
      if (toolCalls.length > 0) assistantMsg.tool_calls = toolCalls
      out.push(assistantMsg)
    } else if (msg.role === 'tool') {
      // Same as the OpenAI adapter: images can't ride in a `tool` message, so
      // forward any captured image as a user message after the tool results.
      const images: Array<Extract<ToolResultContent, { type: 'image' }>> = []
      while (i < messages.length && messages[i].role === 'tool') {
        const t = messages[i] as Extract<Message, { role: 'tool' }>
        if (typeof t.content === 'string') {
          out.push({ role: 'tool', tool_call_id: t.tool_use_id, content: t.content })
        } else {
          const textParts: string[] = []
          for (const block of t.content) {
            if (block.type === 'text') textParts.push(block.text)
            else if (block.type === 'image') images.push(block)
          }
          out.push({
            role: 'tool',
            tool_call_id: t.tool_use_id,
            content: textParts.join('\n') || 'Image captured; see the attached image.',
          })
        }
        i++
      }
      i-- // step back; the for-loop advances past the last consumed message

      if (images.length > 0) {
        out.push({
          role: 'user',
          content: images.map(im => ({
            type: 'image_url',
            image_url: { url: `data:${im.source.media_type};base64,${im.source.data}` },
          })),
        })
      }
    }
  }

  return out
}

function convertTools(tools: McpToolSchema[]): unknown[] {
  return tools.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    },
  }))
}


// Fold a Chat Completions SSE stream into one non-streaming-shaped response.
// Streaming raises Copilot's output cap (max_output_tokens 64k) vs the hard
// 16k non-streaming cap that suffocated reasoning-heavy rounds; buffering the
// whole stream keeps the provider contract unchanged (no incremental UI yet).
function foldSse(text: string): Record<string, unknown> {
  const msg: any = { role: 'assistant', content: '' }
  const byIndex = new Map<number, any>()
  let finish: string | null = null
  let usage: any
  for (const line of text.split('\n')) {
    const l = line.trim()
    if (!l.startsWith('data:')) continue
    const payload = l.slice(5).trim()
    if (payload === '[DONE]') continue
    let j: any
    try { j = JSON.parse(payload) } catch { continue }
    if (j.usage) usage = j.usage
    const c = j.choices?.[0]
    if (!c) continue
    if (c.finish_reason) finish = c.finish_reason
    const d = c.delta ?? {}
    if (typeof d.content === 'string') msg.content += d.content
    if (typeof d.reasoning_text === 'string') msg.reasoning_text = (msg.reasoning_text ?? '') + d.reasoning_text
    if (Array.isArray(d.tool_calls)) {
      for (const tc of d.tool_calls) {
        const idx = tc.index ?? 0
        let acc = byIndex.get(idx)
        if (!acc) { acc = { id: tc.id, type: 'function', function: { name: '', arguments: '' } }; byIndex.set(idx, acc) }
        if (tc.id) acc.id = tc.id
        if (tc.function?.name) acc.function.name += tc.function.name
        if (tc.function?.arguments) acc.function.arguments += tc.function.arguments
      }
    }
  }
  const toolCalls = [...byIndex.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v)
  const message: any = { role: 'assistant', content: msg.content || null }
  if (msg.reasoning_text) message.reasoning_text = msg.reasoning_text
  if (toolCalls.length > 0) message.tool_calls = toolCalls
  return { choices: [{ message, finish_reason: finish }], usage }
}

function adaptResponse(json: Record<string, unknown>): ChatResponse {
  const choice = (json.choices as any[])?.[0]
  if (!choice) {
    // Observed live: a round that exhausts max_tokens purely on reasoning can
    // come back WITHOUT a usable choice (finish_reason missing). Treat it as
    // output-limit truncation so the agent loop auto-continues instead of dying.
    return { content: [], stop_reason: 'max_tokens', usage: undefined }
  }

  const msg = choice.message
  const content: ContentBlock[] = []

  // Copilot streams Fable's reasoning as plain text (delta.reasoning_text) —
  // surface it as a thinking block; the panel renders those natively.
  if (msg.reasoning_text) {
    content.push({ type: 'thinking', thinking: msg.reasoning_text } as ContentBlock)
  }

  if (msg.content) {
    content.push({ type: 'text', text: msg.content })
  }

  // A dropped stream can cut a tool call mid-arguments — parsing the partial
  // JSON used to THROW and kill the round via the transient retry. Drop the
  // partial call; with no complete call left, mark the round truncated so the
  // loop's max_tokens auto-continue resumes it. (Same guard as provider-openai.)
  let sawPartialToolCall = false
  if (msg.tool_calls) {
    for (const call of msg.tool_calls) {
      let input: Record<string, unknown>
      try {
        input = call.function.arguments === '' ? {} : (JSON.parse(call.function.arguments) as Record<string, unknown>)
      } catch {
        sawPartialToolCall = true
        continue
      }
      content.push({
        type: 'tool_use',
        id: call.id,
        name: call.function.name,
        input,
      })
    }
  }

  const hasCompleteCall = content.some(b => (b as { type?: string }).type === 'tool_use')
  const stopReason = sawPartialToolCall && !hasCompleteCall ? 'max_tokens' // stream cut mid-call → auto-continue
    : choice.finish_reason === 'tool_calls' ? 'tool_use'
    : choice.finish_reason === 'stop' ? 'end_turn'
    : choice.finish_reason === 'length' ? 'max_tokens' // output-limit truncation → loop auto-continues
    : choice.finish_reason ?? 'end_turn'

  const u = json.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined
  return {
    content,
    stop_reason: stopReason,
    usage: u ? { inputTokens: u.prompt_tokens, outputTokens: u.completion_tokens } : undefined,
  }
}
