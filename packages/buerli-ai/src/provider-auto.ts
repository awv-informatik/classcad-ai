// ─── Auto-routing provider ────────────────────────────────────────────────────
//
// One provider that serves a MIXED model list by routing each call to the right
// API surface. The model picker can switch between, say, gpt-5.5 (Responses-only)
// and a Claude/Gemini model (Chat Completions) and each request goes to the right
// endpoint automatically — so the integrator no longer configures `responses` vs
// `chat` by hand.
//
// The routing table comes from the endpoint's `/models` (`supported_endpoints` per
// model — Copilot reports it). For endpoints that don't (raw OpenAI, LM Studio),
// everything falls back to Chat Completions. Works against the Copilot proxy, OpenAI,
// or any OpenAI-compatible base.

import type { ChatParams, ChatResponse, LLMProvider, ProviderCapabilities } from './types'
import { createResponsesProvider } from './provider-responses'
import { createOpenAIProvider } from './provider-openai'
import { baseUrlFrom, mapModelsResponse, modelsUrlFrom } from './capabilities'

export type AutoProviderConfig = {
  /** API key (or proxy token). */
  apiKey: string
  /**
   * Endpoint — either an API base (e.g. `http://localhost:8788/v1`) or a full surface
   * URL (`…/v1/responses` / `…/v1/chat/completions`); the base is derived either way.
   * Default: https://api.githubcopilot.com
   */
  endpoint?: string
  /** Default model id (used until the user picks one, and to seed the picker). */
  model?: string
  /** Extra headers to send. */
  headers?: Record<string, string>
}

/** Responses-native families — the pre-discovery routing guess before `/models` loads. */
function guessSurface(modelId: string): 'responses' | 'chat' {
  return /gpt-?5|codex/i.test(modelId) ? 'responses' : 'chat'
}

/**
 * Creates an LLMProvider that auto-routes each call to the Responses or Chat
 * Completions surface based on the selected model's declared `supported_endpoints`.
 */
export function createAutoProvider(config: AutoProviderConfig): LLMProvider {
  const base = baseUrlFrom(config.endpoint ?? 'https://api.githubcopilot.com')
  const model = config.model ?? 'gpt-5.5'
  const headers = config.headers

  // Reuse the existing adapters for the two surfaces; we only call their `chat`.
  const responses = createResponsesProvider({ endpoint: `${base}/responses`, apiKey: config.apiKey, model, headers })
  const chat = createOpenAIProvider({ endpoint: `${base}/chat/completions`, apiKey: config.apiKey, model, headers })

  // Per-model surface map + capabilities, fetched once and cached (shared by chat()
  // and getCapabilities()). Rejection is swallowed by getCapabilities; chat() then
  // falls back to the family guess.
  let cache: Promise<{ caps: ProviderCapabilities; surface: Record<string, 'responses' | 'chat'> }> | null = null
  const load = () => {
    if (!cache) {
      cache = fetch(modelsUrlFrom(`${base}/responses`), {
        headers: { 'Authorization': `Bearer ${config.apiKey}`, ...headers },
      })
        .then(async res => {
          if (!res.ok) throw new Error(`models request failed (${res.status})`)
          const caps = mapModelsResponse(await res.json(), { defaultModel: model })
          const surface: Record<string, 'responses' | 'chat'> = {}
          for (const m of caps.models) if (m.surface) surface[m.id] = m.surface
          return { caps, surface }
        })
        .catch(err => {
          cache = null // allow a later retry (e.g. proxy came up)
          throw err
        })
    }
    return cache
  }

  return {
    async chat(params: ChatParams): Promise<ChatResponse> {
      const id = params.model ?? model
      let surface: 'responses' | 'chat' = guessSurface(id)
      try {
        surface = (await load()).surface[id] ?? surface
      } catch {
        // discovery unavailable → keep the family-based guess
      }
      return surface === 'responses' ? responses.chat(params) : chat.chat(params)
    },

    async getCapabilities() {
      return (await load()).caps
    },
  }
}
