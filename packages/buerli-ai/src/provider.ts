// ─── Anthropic-compatible provider implementation ─────────────────────────────
//
// This is the default provider for users who connect to an Anthropic-compatible
// endpoint (Claude API directly, or any proxy that speaks the same format).

import type { ChatParams, ChatResponse, ContentBlock, LLMProvider, McpToolSchema, Message } from './types'
import { mapModelsResponse, modelsUrlFrom } from './capabilities'

export type AnthropicProviderConfig = {
  /** Full URL to the messages endpoint. Default: https://api.anthropic.com/v1/messages */
  endpoint?: string
  /** API key (or proxy token). */
  apiKey: string
  /** Model ID. Default: claude-sonnet-4-20250514 */
  model?: string
  /** Extra headers to send (e.g. for proxies). */
  headers?: Record<string, string>
  /** Enable extended thinking. When set, the model may return thinking blocks. */
  thinking?: { type: 'enabled'; budget_tokens: number }
}

/**
 * Creates an LLMProvider that talks to any Anthropic Messages API-compatible endpoint.
 */
export function createAnthropicProvider(config: AnthropicProviderConfig): LLMProvider {
  const endpoint = config.endpoint ?? 'https://api.anthropic.com/v1/messages'
  const model = config.model ?? 'claude-sonnet-4-20250514'

  return {
    async chat(params: ChatParams): Promise<ChatResponse> {
      // Note: params.reasoningEffort is intentionally not mapped here — Anthropic
      // extended thinking is opted into at construction via `config.thinking`
      // (a token budget), which stays the single source of truth for this provider.
      let maxTokens = params.max_tokens ?? 4096

      // The Anthropic API requires max_tokens > thinking.budget_tokens. Bump it
      // up automatically so an enabled thinking budget can never exceed the cap.
      if (config.thinking) {
        maxTokens = Math.max(maxTokens, config.thinking.budget_tokens + 1024)
      }

      const body: Record<string, unknown> = {
        model: params.model ?? model,
        max_tokens: maxTokens,
        system: params.system,
        messages: convertMessages(params.messages),
        tools: convertTools(params.tools),
      }

      if (config.thinking) {
        body.thinking = config.thinking
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          // Allow calls directly from the browser. Anthropic blocks browser
          // origins unless this opt-in header is present. Override via config.headers.
          'anthropic-dangerous-direct-browser-access': 'true',
          ...config.headers,
        },
        body: JSON.stringify(body),
        signal: params.signal,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`LLM request failed (${res.status}): ${text}`)
      }

      const json = await res.json()
      const u = json.usage as { input_tokens?: number; output_tokens?: number } | undefined
      return {
        content: json.content as ContentBlock[],
        stop_reason: json.stop_reason,
        usage: u ? { inputTokens: u.input_tokens, outputTokens: u.output_tokens } : undefined,
      }
    },

    // Discover selectable Claude models (GET /v1/models). Model picker only — the
    // heuristic yields no reasoning levels for Claude, so no reasoning picker is
    // shown (this provider maps thinking via `config.thinking`, not effort).
    async getCapabilities() {
      const res = await fetch(modelsUrlFrom(endpoint), {
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          ...config.headers,
        },
      })
      if (!res.ok) throw new Error(`models request failed (${res.status})`)
      return mapModelsResponse(await res.json(), { defaultModel: model })
    },
  }
}

// ─── Format adapters ──────────────────────────────────────────────────────────

function convertMessages(messages: Message[]): unknown[] {
  const out: unknown[] = []

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]

    if (msg.role === 'tool') {
      // Anthropic requires every tool_result for one assistant turn to live in a
      // SINGLE user message. Claude routinely emits parallel tool calls, which the
      // loop records as consecutive `tool` messages — coalesce them here, otherwise
      // we'd emit consecutive `user` messages and the API rejects the request.
      const toolResults: unknown[] = []
      while (i < messages.length && messages[i].role === 'tool') {
        const t = messages[i] as Extract<Message, { role: 'tool' }>
        toolResults.push({ type: 'tool_result', tool_use_id: t.tool_use_id, content: t.content })
        i++
      }
      i-- // step back; the for-loop will advance past the last consumed message
      out.push({ role: 'user', content: toolResults })
      continue
    }

    if (msg.role === 'assistant') {
      out.push({ role: 'assistant', content: msg.content })
      continue
    }

    out.push({ role: 'user', content: msg.content })
  }

  return out
}

function convertTools(tools: McpToolSchema[]): unknown[] {
  return tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema,
  }))
}
