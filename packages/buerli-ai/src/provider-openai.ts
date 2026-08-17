// ─── OpenAI-compatible provider implementation ────────────────────────────────
//
// Works with OpenAI's chat completions API, Azure OpenAI, or any endpoint
// that speaks the same format (e.g. Ollama, vLLM, LM Studio).

import type { ChatParams, ChatResponse, ContentBlock, LLMProvider, McpToolSchema, Message, ToolResultContent, UserContentBlock } from './types'
import { mapModelsResponse, modelsUrlFrom } from './capabilities'

export type OpenAIProviderConfig = {
  /** Full URL to the chat completions endpoint. Default: https://api.openai.com/v1/chat/completions */
  endpoint?: string
  /** API key. */
  apiKey: string
  /** Model ID. Default: gpt-4o */
  model?: string
  /** Extra headers to send. */
  headers?: Record<string, string>
}

/**
 * Creates an LLMProvider that talks to any OpenAI Chat Completions API-compatible endpoint.
 */
export function createOpenAIProvider(config: OpenAIProviderConfig): LLMProvider {
  const endpoint = config.endpoint ?? 'https://api.openai.com/v1/chat/completions'
  const model = config.model ?? 'gpt-4o'

  return {
    async chat(params: ChatParams): Promise<ChatResponse> {
      const body: Record<string, unknown> = {
        model: params.model ?? model,
        max_tokens: params.max_tokens ?? 4096,
        messages: buildMessages(params.system, params.messages),
        tools: convertTools(params.tools),
      }

      // Reasoning effort (o-series / gpt-5.x on Chat Completions). Set only when
      // provided so plain chat models aren't sent a field they'd reject.
      if (params.reasoningEffort) {
        body.reasoning_effort = params.reasoningEffort
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
        throw new Error(`OpenAI request failed (${res.status}): ${text}`)
      }

      const json = await res.json()
      return adaptResponse(json)
    },

    // Discover selectable models from the sibling `/models` endpoint (OpenAI-compatible
    // servers and LM Studio expose one). Rejects on CORS/404 → the panel hides the picker.
    async getCapabilities() {
      const res = await fetch(modelsUrlFrom(endpoint), {
        headers: { 'Authorization': `Bearer ${config.apiKey}`, ...config.headers },
      })
      if (!res.ok) throw new Error(`models request failed (${res.status})`)
      // Chat Completions surface only — list models that support it.
      return mapModelsResponse(await res.json(), { defaultModel: model, requireSurface: 'chat' })
    },
  }
}

// ─── Format adapters ──────────────────────────────────────────────────────────

// User content may be a plain string or text+image blocks. OpenAI wants images
// as { type: 'image_url', image_url: { url } } parts.
function toOpenAIUserContent(content: string | UserContentBlock[]): unknown {
  if (typeof content === 'string') return content
  return content.map(block =>
    block.type === 'image'
      ? { type: 'image_url', image_url: { url: `data:${block.source.media_type};base64,${block.source.data}` } }
      : { type: 'text', text: block.text },
  )
}

function buildMessages(system: string, messages: Message[]): unknown[] {
  const out: unknown[] = [{ role: 'system', content: system }]

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (msg.role === 'user') {
      out.push({ role: 'user', content: toOpenAIUserContent(msg.content) })
    } else if (msg.role === 'assistant') {
      // Convert our ContentBlock[] to OpenAI's format
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
      // Consume the run of consecutive tool results. OpenAI accepts images only
      // in user/assistant content (not in `tool` messages), so we emit the text
      // result in the tool message and forward any captured image as a follow-up
      // user message after all tool results for this turn.
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

// Gemini (via Copilot's chat surface) 400s on union types — `type: ['object','array']` —
// which OpenAI and Claude accept. Rewrite them to the equivalent `anyOf` form recursively;
// same JSON Schema semantics, accepted by all three (verified against gemini-3.5-flash).
function sanitizeJsonSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(sanitizeJsonSchema)
  if (!node || typeof node !== 'object') return node
  const obj: Record<string, unknown> = { ...(node as Record<string, unknown>) }
  if (Array.isArray(obj.type)) {
    const types = obj.type as string[]
    delete obj.type
    obj.anyOf = types.map(t => ({ type: t }))
  }
  for (const [k, v] of Object.entries(obj)) obj[k] = sanitizeJsonSchema(v)
  return obj
}

function convertTools(tools: McpToolSchema[]): unknown[] {
  return tools.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: sanitizeJsonSchema(t.inputSchema),
    },
  }))
}

function adaptResponse(json: Record<string, unknown>): ChatResponse {
  const choice = (json.choices as any[])?.[0]
  if (!choice) throw new Error('No choices in OpenAI response')

  const msg = choice.message
  const content: ContentBlock[] = []

  // Some local models (e.g. Qwen via LM Studio) return whitespace-only content
  // (a stray "\n") alongside tool_calls; skip it so it doesn't render as an empty
  // assistant bubble. Cloud models send null/"" here, which this also covers.
  if (typeof msg.content === 'string' && msg.content.trim()) {
    content.push({ type: 'text', text: msg.content })
  }

  if (msg.tool_calls) {
    for (const call of msg.tool_calls) {
      content.push({
        type: 'tool_use',
        id: call.id,
        name: call.function.name,
        input: JSON.parse(call.function.arguments),
      })
    }
  }

  const stopReason = choice.finish_reason === 'tool_calls' ? 'tool_use'
    : choice.finish_reason === 'stop' ? 'end_turn'
    : choice.finish_reason ?? 'end_turn'

  const u = json.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined
  return {
    content,
    stop_reason: stopReason,
    usage: u ? { inputTokens: u.prompt_tokens, outputTokens: u.completion_tokens } : undefined,
  }
}
