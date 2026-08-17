// ─── Provider capability helpers ──────────────────────────────────────────────
//
// Shared logic for turning an OpenAI/Copilot/Anthropic-style `/models` payload
// into the ProviderCapabilities the UI uses to render the model + reasoning
// pickers. Kept here so every provider maps models the same way.

import type { ModelOption, ProviderCapabilities, ReasoningEffort } from './types'

/**
 * Reasoning-effort levels a model id supports, by family. Empty = no reasoning
 * control (the picker stays hidden). Conservative: only the OpenAI reasoning
 * families are recognised, so we never offer a control the endpoint would reject.
 *   • GPT-5 family (incl. -codex): minimal | low | medium | high
 *   • o-series (o1/o3/o4 …):       low | medium | high   (no `minimal`)
 */
export function reasoningEffortsFor(modelId: string): ReasoningEffort[] {
  const id = (modelId || '').toLowerCase()
  if (/gpt-?5/.test(id)) return ['minimal', 'low', 'medium', 'high']
  if (/(^|[^a-z])o[1-9](?:[^a-z0-9]|$)/.test(id)) return ['low', 'medium', 'high']
  return []
}

/**
 * Whether a model family is known to accept image (vision) input. Used only when
 * the endpoint doesn't report it (`supports.vision`). Conservative: unknown → false,
 * so we never send images to a model that would choke on them.
 */
export function visionFor(modelId: string): boolean {
  const id = (modelId || '').toLowerCase()
  return /gpt-?5|gpt-?4o|gpt-?4\.1|gpt-?4-turbo|claude|gemini|(^|[^a-z])o[34]|pixtral|llava|qwen[^ ]*-?vl/.test(id)
}

// Ids that are clearly NOT chat models — used to drop noise when a `/models`
// response carries no explicit type (e.g. raw OpenAI/LM Studio listings).
const NON_CHAT = /(embedding|whisper|tts|audio|dall-?e|moderation|rerank|search|similarity|\bedit\b|babbage|ada-|curie|davinci|image|vision-encoder|clip)/

function looksLikeChatModel(id: string): boolean {
  return !NON_CHAT.test(id.toLowerCase())
}

/** Reasoning levels for a model: prefer the endpoint's explicit list, else the family heuristic. */
function reasoningFor(id: string, supports: any): string[] {
  const re = supports?.reasoning_effort
  if (Array.isArray(re)) return re.filter((x: unknown) => typeof x === 'string')
  if (re === false || supports?.reasoning === false) return []
  return reasoningEffortsFor(id) // not reported (true / undefined) → derive from family
}

/**
 * Pick the API surface for a model from its `supported_endpoints`. `/responses` is
 * preferred when offered (gpt-5 family is responses-native); else `/chat/completions`.
 * A missing/empty list is treated as chat-capable (raw OpenAI / LM Studio don't report it).
 * Returns undefined when neither of our adapters can serve it.
 */
function surfaceFor(endpoints: string[]): 'responses' | 'chat' | undefined {
  const canResponses = endpoints.includes('/responses')
  const canChat = endpoints.includes('/chat/completions') || endpoints.length === 0
  return canResponses ? 'responses' : canChat ? 'chat' : undefined
}

export type MapModelsOptions = {
  /** Configured default model id — guaranteed present in the result. */
  defaultModel?: string
  /** Keep only models that support this surface (for a single-surface provider). */
  requireSurface?: 'responses' | 'chat'
}

/**
 * Map an OpenAI/Copilot/Anthropic-style `/models` JSON body into ProviderCapabilities.
 * Handles `{ data: [...] }` and `{ models: [...] }`; reads Copilot's
 * `capabilities.{type,limits,supports}`, `supported_endpoints` and `model_picker_enabled`.
 * Each model carries its routing `surface`; pass `requireSurface` to filter to one.
 */
export function mapModelsResponse(json: any, opts: MapModelsOptions = {}): ProviderCapabilities {
  const { defaultModel, requireSurface } = opts
  const list: any[] = Array.isArray(json?.data) ? json.data : Array.isArray(json?.models) ? json.models : []
  const models: ModelOption[] = []
  const seen = new Set<string>()

  for (const m of list) {
    const id: string | undefined = m?.id || m?.name
    if (!id || seen.has(id)) continue
    const caps = m?.capabilities || {}
    // Keep chat models only. Copilot tags a capability type ('chat' | 'embeddings' …);
    // honour that when present, else drop obvious non-chat ids. (Anthropic's top-level
    // `type: "model"` is a resource kind, not a capability — don't filter on it.)
    const capType: string | undefined = caps.type
    if (capType) {
      if (capType !== 'chat') continue
    } else if (!looksLikeChatModel(id)) {
      continue
    }
    if (m?.model_picker_enabled === false) continue

    // Surface routing from supported_endpoints. Skip models neither adapter can serve,
    // and (for a single-surface provider) models that don't support the required surface.
    const endpoints: string[] = Array.isArray(m?.supported_endpoints) ? m.supported_endpoints : []
    const surface = surfaceFor(endpoints)
    if (!surface) continue
    if (requireSurface === 'responses' && !endpoints.includes('/responses')) continue
    if (requireSurface === 'chat' && !(endpoints.includes('/chat/completions') || endpoints.length === 0)) continue
    const routeSurface = requireSurface ?? surface

    const limits = caps.limits || {}
    // Prompt budget drives the context ring; output cap drives per-call max_tokens.
    const contextLimit: number | undefined =
      limits.max_prompt_tokens || limits.max_context_window_tokens || undefined
    const maxOutputTokens: number | undefined = limits.max_output_tokens || undefined

    const efforts = reasoningFor(id, caps.supports || {})
    // Vision: prefer the endpoint's explicit flag, else the family heuristic.
    const supportsVision = caps.supports?.vision
    const vision = typeof supportsVision === 'boolean' ? supportsVision : visionFor(id)

    seen.add(id)
    models.push({
      id,
      label: m?.name || m?.display_name || id,
      contextLimit,
      maxOutputTokens,
      reasoningEfforts: efforts.length ? efforts : undefined,
      vision,
      surface: routeSurface,
    })
  }

  models.sort((a, b) => (a.label || a.id).localeCompare(b.label || b.id))

  // Make sure the configured default is present and selectable, even if the
  // listing didn't include it (alias, restricted plan, etc.).
  if (defaultModel && !models.some(m => m.id === defaultModel)) {
    const efforts = reasoningEffortsFor(defaultModel)
    const surface = requireSurface ?? (/gpt-?5|codex/i.test(defaultModel) ? 'responses' : 'chat')
    models.unshift({
      id: defaultModel,
      label: defaultModel,
      reasoningEfforts: efforts.length ? efforts : undefined,
      vision: visionFor(defaultModel),
      surface,
    })
  }

  return { models, defaultModel }
}

/** Derive the sibling `/models` URL from a responses or chat-completions endpoint (or a base). */
export function modelsUrlFrom(endpoint: string): string {
  if (/\/(responses|chat\/completions)\/?$/.test(endpoint)) {
    return endpoint.replace(/\/(responses|chat\/completions)\/?$/, '/models')
  }
  // Fallback: replace the last path segment with /models.
  return endpoint.replace(/\/+$/, '').replace(/\/[^/]*$/, '') + '/models'
}

/** Strip a `/responses` or `/chat/completions` suffix to get the API base URL. */
export function baseUrlFrom(endpoint: string): string {
  return endpoint.replace(/\/(responses|chat\/completions)\/?$/, '').replace(/\/+$/, '')
}
