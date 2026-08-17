// ─── OpenAI Responses API provider ────────────────────────────────────────────
//
// The Responses API (`/responses`) is required for newer models that are NOT
// served on `/chat/completions` — e.g. GitHub Copilot's `gpt-5.5` and the
// `*-codex` models. It uses a different shape than Chat Completions:
//   • request: a flat `input` item array + flat function `tools` + `instructions`
//   • response: an `output` item array (message / function_call / reasoning)
//
// This adapter maps our internal Message[]/ContentBlock[] to/from that shape so
// the rest of the agent (loop, tools, UI) is unchanged.

import type { ChatParams, ChatResponse, ContentBlock, LLMProvider, McpToolSchema, Message, ToolResultContent, UserContentBlock } from './types'
import { mapModelsResponse, modelsUrlFrom } from './capabilities'

export type ResponsesProviderConfig = {
  /** Full URL to the responses endpoint. Default: https://api.openai.com/v1/responses */
  endpoint?: string
  /** API key (or proxy token). */
  apiKey: string
  /** Model ID. Default: gpt-5.5 */
  model?: string
  /** Extra headers to send. */
  headers?: Record<string, string>
}

/**
 * Creates an LLMProvider that talks to an OpenAI Responses API-compatible endpoint.
 */
export function createResponsesProvider(config: ResponsesProviderConfig): LLMProvider {
  const endpoint = config.endpoint ?? 'https://api.openai.com/v1/responses'
  const model = config.model ?? 'gpt-5.5'

  return {
    async chat(params: ChatParams): Promise<ChatResponse> {
      const body: Record<string, unknown> = {
        model: params.model ?? model,
        instructions: params.system,
        input: buildInput(params.messages),
        tools: convertTools(params.tools),
        max_output_tokens: params.max_tokens ?? 4096,
      }

      // Reasoning effort (gpt-5.x / o-series). Sent only when set so non-reasoning
      // models aren't handed a field they'd reject. `minimal` is the GPT-5 floor.
      if (params.reasoningEffort) {
        body.reasoning = { effort: params.reasoningEffort }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          ...config.headers,
        },
        body: JSON.stringify(body),
        signal: params.signal,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Responses request failed (${res.status}): ${text}`)
      }

      const json = await res.json()
      return adaptResponse(json)
    },

    // Discover selectable models from the sibling `/models` endpoint (works through
    // the Copilot proxy and OpenAI). Rejects on CORS/404 → the panel hides the picker.
    async getCapabilities() {
      const res = await fetch(modelsUrlFrom(endpoint), {
        headers: { 'Authorization': `Bearer ${config.apiKey}`, ...config.headers },
      })
      if (!res.ok) throw new Error(`models request failed (${res.status})`)
      // This provider only speaks the Responses surface, so list only responses-capable models.
      return mapModelsResponse(await res.json(), { defaultModel: model, requireSurface: 'responses' })
    },
  }
}

// ─── Format adapters ──────────────────────────────────────────────────────────

function buildInput(messages: Message[]): unknown[] {
  const out: unknown[] = []

  for (const msg of messages) {
    if (msg.role === 'user') {
      const parts: unknown[] =
        typeof msg.content === 'string'
          ? [{ type: 'input_text', text: msg.content }]
          : (msg.content as UserContentBlock[]).map(block =>
              block.type === 'image'
                ? { type: 'input_image', image_url: `data:${block.source.media_type};base64,${block.source.data}` }
                : { type: 'input_text', text: block.text },
            )
      out.push({ role: 'user', content: parts })
      continue
    }

    if (msg.role === 'assistant') {
      for (const block of msg.content) {
        if (block.type === 'text') {
          out.push({ role: 'assistant', content: [{ type: 'output_text', text: block.text }] })
        } else if (block.type === 'tool_use') {
          out.push({ type: 'function_call', call_id: block.id, name: block.name, arguments: JSON.stringify(block.input) })
        }
      }
      continue
    }

    if (msg.role === 'tool') {
      // function_call_output carries only text; images (snapshots) can't ride in
      // it, so emit them as a follow-up user message with an input_image part.
      const images: Array<Extract<ToolResultContent, { type: 'image' }>> = []
      let text = ''
      if (typeof msg.content === 'string') {
        text = msg.content
      } else {
        for (const block of msg.content) {
          if (block.type === 'text') text += block.text
          else if (block.type === 'image') images.push(block)
        }
      }
      out.push({ type: 'function_call_output', call_id: msg.tool_use_id, output: text || 'Image captured; see the attached image.' })
      if (images.length > 0) {
        out.push({
          role: 'user',
          content: images.map(im => ({
            type: 'input_image',
            image_url: `data:${im.source.media_type};base64,${im.source.data}`,
          })),
        })
      }
      continue
    }
  }

  return out
}

function convertTools(tools: McpToolSchema[]): unknown[] {
  // Responses API uses a FLAT function tool shape (no nested "function" wrapper).
  return tools.map(t => ({
    type: 'function',
    name: t.name,
    description: t.description,
    parameters: t.inputSchema,
  }))
}

function adaptResponse(json: Record<string, unknown>): ChatResponse {
  const content: ContentBlock[] = []
  const output = Array.isArray(json.output) ? (json.output as any[]) : []

  for (const item of output) {
    if (item.type === 'message') {
      const parts = Array.isArray(item.content) ? item.content : []
      for (const p of parts) {
        if ((p.type === 'output_text' || p.type === 'text') && p.text && p.text.trim()) {
          content.push({ type: 'text', text: p.text })
        }
      }
    } else if (item.type === 'function_call') {
      content.push({
        type: 'tool_use',
        id: item.call_id ?? item.id,
        name: item.name,
        input: safeParseArgs(item.arguments),
      })
    }
  }

  const hasToolUse = content.some(b => b.type === 'tool_use')
  const u = json.usage as { input_tokens?: number; output_tokens?: number } | undefined
  // Responses API signals output-limit truncation via status/incomplete_details.
  // Surfacing it lets the agent loop auto-continue instead of ending the turn
  // (a truncated response typically narrates intent but never emits the call).
  const truncated =
    json.status === 'incomplete' &&
    ((json.incomplete_details as { reason?: string } | undefined)?.reason ?? 'max_output_tokens') === 'max_output_tokens'
  return {
    content,
    stop_reason: truncated ? 'max_tokens' : hasToolUse ? 'tool_use' : 'end_turn',
    usage: u ? { inputTokens: u.input_tokens, outputTokens: u.output_tokens } : undefined,
  }
}

function safeParseArgs(s: unknown): Record<string, unknown> {
  if (typeof s !== 'string') return (s as Record<string, unknown>) ?? {}
  try {
    return JSON.parse(s || '{}')
  } catch {
    return {}
  }
}
