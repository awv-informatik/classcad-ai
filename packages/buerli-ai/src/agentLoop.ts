// ─── Agent loop — multi-turn tool-use conversation ────────────────────────────

import type { AgentConfig, ChatResponse, ImageInput, Message, ToolResult, ToolResultContent, ToolUseBlock, ThinkingBlock, UserContentBlock } from './types'
import { TOOL_SCHEMAS } from './tools/schema'
import { executeTool } from './tools/executor'
import { getMethodIndex } from './tools/registry'
import { capJson } from './tools/utils'
import { DEFAULT_SYSTEM_PROMPT } from './systemPrompt'

export type AgentTurnEvent =
  | { type: 'text'; text: string }
  | { type: 'thinking'; text: string }
  | { type: 'tool_start'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_end'; id: string; name: string; result: ToolResult }
  | { type: 'subagent_start'; id: string; name: string; goal: string }
  | { type: 'subagent_end'; id: string; name: string; summary: string }
  | { type: 'usage'; inputTokens?: number; outputTokens?: number }
  | { type: 'error'; error: string }
  | { type: 'done'; messages: Message[] }

/**
 * Runs the agentic conversation loop.
 *
 * Takes a user message and the current conversation history,
 * iterates through tool-use cycles until the model produces a final text response.
 *
 * Yields events for real-time UI updates.
 */
export async function* runAgentLoop(
  userMessage: string,
  history: Message[],
  config: AgentConfig,
  images?: ImageInput[],
): AsyncGenerator<AgentTurnEvent> {
  const maxIterations = config.maxIterations ?? 40
  const maxTokens = config.maxTokens ?? 8192
  const depth = config.depth ?? 0
  const systemPrompt = buildSystemPrompt(config)

  // Subagents (depth > 0) cannot delegate — prevents unbounded recursion.
  const tools = depth > 0 ? TOOL_SCHEMAS.filter(t => t.name !== 'delegate') : TOOL_SCHEMAS

  // Append user message — multimodal (text + attached images) when images are present.
  const userContent: string | UserContentBlock[] =
    images && images.length > 0
      ? [
          ...(userMessage ? [{ type: 'text', text: userMessage } as UserContentBlock] : []),
          ...images.map(
            (im): UserContentBlock => ({
              type: 'image',
              source: { type: 'base64', media_type: im.mediaType, data: im.data },
            }),
          ),
        ]
      : userMessage
  const messages: Message[] = [...history, { role: 'user', content: userContent }]

  let nudges = 0
  const MAX_NUDGES = 3

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    if (config.signal?.aborted) {
      yield { type: 'done', messages }
      return
    }

    // Keep the sent history inside the model's context budget: once it grows past
    // the budget, old tool results are replaced with stubs (recent turns and all
    // user/assistant text survive). Without this, long builds die at the window.
    pruneHistory(messages, config.contextLimit)

    let response: ChatResponse

    try {
      response = await config.provider.chat({
        system: systemPrompt,
        messages,
        tools,
        max_tokens: maxTokens,
        model: config.model,
        reasoningEffort: config.reasoningEffort,
        signal: config.signal,
      })
    } catch (e: any) {
      if (config.signal?.aborted) {
        yield { type: 'done', messages }
        return
      }
      yield { type: 'error', error: e.message || String(e) }
      return
    }

    // Surface token usage (inputTokens ≈ context occupied by the sent history).
    if (response.usage) {
      yield { type: 'usage', inputTokens: response.usage.inputTokens, outputTokens: response.usage.outputTokens }
    }

    // Emit thinking blocks
    const thinkingBlocks = response.content.filter((b): b is ThinkingBlock => b.type === 'thinking')
    for (const block of thinkingBlocks) {
      if (block.thinking) yield { type: 'thinking', text: block.thinking }
    }

    // Emit text blocks. Skip whitespace-only text (some local models emit a stray
    // "\n" with their tool calls) so it never becomes an empty assistant bubble —
    // provider-agnostic safety net on top of the per-provider guards.
    const textBlocks = response.content.filter((b): b is { type: 'text'; text: string } => b.type === 'text')
    for (const block of textBlocks) {
      if (block.text?.trim()) yield { type: 'text', text: block.text }
    }

    // Check if we're done. Drive continuation solely by the presence of tool_use
    // blocks — some OpenAI-compatible servers report finish_reason 'stop' (→ 'end_turn')
    // even when they emit tool calls, so we must not gate on stop_reason here.
    const toolUseBlocks = response.content.filter((b): b is ToolUseBlock => b.type === 'tool_use')

    if (toolUseBlocks.length === 0) {
      // Append assistant response to history
      messages.push({ role: 'assistant', content: response.content })
      // Some models narrate their intent ("let me grab the tree…" / "let me call
      // it correctly:") and end the turn without emitting the tool call. Nudge
      // (bounded) only when the text clearly trails off mid-action — it ends with
      // a colon or states intent — NOT merely because no tool ran, since plenty of
      // requests are answered with text alone (e.g. a question about an image).
      const trailingText = textBlocks.map(b => b.text).join('').trimEnd()
      const looksIncomplete =
        trailingText.endsWith(':') || /\b(let me|let's|i'?ll|i will|now i|first,? i)\b/i.test(trailingText)
      if (looksIncomplete && nudges < MAX_NUDGES) {
        nudges++
        messages.push({
          role: 'user',
          content:
            'Proceed now — emit the tool call(s) needed to complete the request in this same turn. Do not reply with only a description of what you intend to do.',
        })
        continue
      }
      yield { type: 'done', messages }
      return
    }

    // Process tool calls. Run them CONCURRENTLY (parallel tool calls / fan-out —
    // e.g. one delegate per part), preserving order when feeding results back.
    messages.push({ role: 'assistant', content: response.content })

    // 1. Announce every call up front (in order) so the UI shows them start together.
    for (const tu of toolUseBlocks) {
      if (tu.name === 'delegate') {
        const { agent, goal } = tu.input as { agent: string; goal: string }
        yield { type: 'subagent_start', id: tu.id, name: agent, goal }
      } else {
        yield { type: 'tool_start', id: tu.id, name: tu.name, input: tu.input }
        config.onToolExecution?.(tu.name, tu.input)
      }
    }

    // 2. Execute all concurrently (handlers never reject — they return error objects).
    const settled = await Promise.all(
      toolUseBlocks.map(async tu => {
        if (tu.name === 'delegate') {
          const { agent, goal } = tu.input as { agent: string; goal: string }
          const summary = await runSubagent(agent, goal, config)
          return { kind: 'subagent' as const, tu, summary }
        }
        const result = await executeTool(tu.name, tu.input, {
          drawingId: config.drawingId,
          attachments: config.attachments,
        })
        return { kind: 'tool' as const, tu, result }
      }),
    )

    // 3. Emit completions and append tool results in the ORIGINAL order.
    for (const s of settled) {
      if (s.kind === 'subagent') {
        const { agent } = s.tu.input as { agent: string }
        yield { type: 'subagent_end', id: s.tu.id, name: agent, summary: s.summary }
        messages.push({ role: 'tool', tool_use_id: s.tu.id, content: s.summary })
      } else {
        yield { type: 'tool_end', id: s.tu.id, name: s.tu.name, result: s.result }
        messages.push({
          role: 'tool',
          tool_use_id: s.tu.id,
          content: buildToolResultContent(s.tu.name, s.result, config.sendSnapshotsToModel ?? false),
        })
      }
    }

    // Loop continues — model will see tool results and respond
  }

  yield { type: 'error', error: `Agent loop exceeded max iterations (${maxIterations}).` }
}

// ─── Context management ───────────────────────────────────────────────────────

const CHARS_PER_TOKEN = 4 // rough, deliberately conservative
const DEFAULT_CONTEXT_TOKENS = 120000
const KEEP_RECENT_MESSAGES = 12
const PRUNED_STUB = JSON.stringify({
  pruned:
    'Old tool result removed to save context. Re-run the tool if you need this data — key ids/state should live in your notes.',
})

function messageChars(m: Message): number {
  const c: unknown = (m as any).content
  if (typeof c === 'string') return c.length
  try {
    return JSON.stringify(c)?.length ?? 0
  } catch {
    return 0
  }
}

/**
 * Shrink the history toward the model's context budget by replacing OLD tool
 * results with stubs, oldest first. Recent messages, and all user/assistant
 * content, are never touched — the model keeps its plan and conversation; only
 * stale tool payloads (tree dumps, long results, snapshot images) are dropped.
 * Mutates in place so the pruning persists across turns instead of re-growing.
 */
function pruneHistory(messages: Message[], contextLimit?: number): void {
  // 70% of the window for history — headroom for system prompt, tools, and output.
  const budgetChars = (contextLimit ?? DEFAULT_CONTEXT_TOKENS) * CHARS_PER_TOKEN * 0.7
  let total = messages.reduce((n, m) => n + messageChars(m), 0)
  if (total <= budgetChars) return
  for (let i = 0; i < messages.length - KEEP_RECENT_MESSAGES && total > budgetChars; i++) {
    const m = messages[i]
    if (m.role !== 'tool') continue
    const size = messageChars(m)
    if (size <= PRUNED_STUB.length + 64) continue // already small (or already stubbed)
    m.content = PRUNED_STUB
    total -= size - PRUNED_STUB.length
  }
}

function buildSystemPrompt(config: AgentConfig): string {
  let prompt = config.systemPrompt ?? DEFAULT_SYSTEM_PROMPT
  if (config.extraContext) {
    prompt += '\n\n## Additional Context\n' + config.extraContext
  }
  // Inject the complete v1 method index (name + one-line summary) so the model can
  // map intent → method directly without searching. Static + small (~4.6k tokens);
  // empty until the registry is loaded (initAgentAsync), then lazy discovery applies.
  const index = getMethodIndex()
  if (index) {
    prompt +=
      '\n\n## Method Index (v1)\n' +
      'Every ClassCAD v1 method with a one-line summary. Scan this to pick the right method DIRECTLY — ' +
      'do not guess and do not default to list_methods for v1. Then call describe_method on it for exact ' +
      'parameters before your first call_api. (list_methods is still for filtering, or for the reflected ' +
      'non-v1 namespaces — facade/structure/interaction/selection/geometry — which are NOT in this index.)\n\n' +
      index
  }
  return prompt
}

/**
 * Builds the tool_result content. For a snapshot, the base64 image is sent to the
 * model as a vision block ONLY when `sendSnapshotImage` is true — vision is slow on
 * some endpoints (e.g. Copilot gpt-5.5 stalls ~60s on image inputs), and the image
 * is already shown in the app UI, so by default the model just gets lightweight
 * metadata (never the base64 — stringifying the whole result would bloat the prompt).
 */
function buildToolResultContent(
  toolName: string,
  result: ToolResult,
  sendSnapshotImage: boolean,
): string | ToolResultContent[] {
  if (result.error) {
    return capJson({ error: result.error }, 12000)
  }

  // Snapshot results include an `image` field with base64 PNG data.
  if (toolName === 'snapshot' && result.result && typeof result.result === 'object') {
    const snap = result.result as { image?: string; mimeType?: string; width?: number; height?: number; label?: string; frame?: unknown; rendered?: string[] }
    // frame rides along so the model can pin it in a follow-up snapshot
    // (pixel-comparable before/after); rendered lists what content was drawn.
    const meta = { label: snap.label, width: snap.width, height: snap.height, frame: snap.frame, rendered: snap.rendered }
    if (snap.image && sendSnapshotImage) {
      return [
        { type: 'image', source: { type: 'base64', media_type: snap.mimeType ?? 'image/png', data: snap.image } },
        { type: 'text', text: JSON.stringify(meta) },
      ]
    }
    // Metadata only — the rendered image is shown in the app, not sent to the model.
    return JSON.stringify({ ...meta, note: 'Snapshot captured and shown in the app (image not attached).' })
  }

  // Download results carry the file bytes (base64) for the app-side download button;
  // never send those to the model — just confirm the export and that the button is shown.
  if (toolName === 'download' && result.result && typeof result.result === 'object') {
    const d = result.result as { filename?: string; format?: string; size?: number }
    return JSON.stringify({
      filename: d.filename,
      format: d.format,
      size: d.size,
      note: 'Export ready — a download button is shown to the user in the app to save the file. The file bytes are NOT sent to you; do not print or ask for them.',
    })
  }

  // Coalesce undefined (void-returning methods like facade.fetchTree) to null, so
  // the tool message content is always a valid string — JSON.stringify(undefined)
  // returns undefined, which then breaks the providers' content handling. Capped:
  // one oversized result (a big tree, a verbose query) must not flood the context.
  return capJson(result.result ?? null, 30000)
}

// ─── Subagent execution ───────────────────────────────────────────────────────

/** Predefined subagent personas. */
const SUBAGENT_PROMPTS: Record<string, string> = {
  sketch: 'You are a 2D sketching specialist. Focus only on sketch creation: planes, lines, arcs, constraints, dimensions. Work precisely and report what you created.',
  boolean: 'You are a boolean operations specialist. Focus on combining solids: union, subtract, intersect. Report the resulting geometry.',
  fillet_chamfer: 'You are a fillet/chamfer specialist. Apply edge treatments precisely. Report which edges were modified.',
  assembly: 'You are an assembly specialist. Focus on component placement, mates, and constraints. Report the final assembly structure.',
  analysis: 'You are a geometry analysis specialist. Inspect the model tree, measure properties, and report findings without modifying geometry.',
}

/**
 * Runs a subagent — a nested agent loop with a persona layered ON TOP of the full
 * base system prompt. The persona must extend, not replace: without the base
 * prompt the subagent loses the editor starting-state rules, tool guidance, and
 * workflow discipline — exactly the knowledge it needs to execute its sub-task.
 */
async function runSubagent(agentName: string, goal: string, parentConfig: AgentConfig): Promise<string> {
  const persona =
    SUBAGENT_PROMPTS[agentName] ??
    `You are a specialist sub-agent named "${agentName}". Complete your goal precisely and report results.`
  const base = parentConfig.systemPrompt ?? DEFAULT_SYSTEM_PROMPT
  const subSystemPrompt =
    `${base}\n\n## Sub-agent role\n${persona}\n` +
    `You are working on ONE delegated sub-task inside a larger session. Do only your goal, ` +
    `then summarize precisely what you created/changed (with the ids) — your final text is the ` +
    `report your caller receives.\n\nYour specific goal: ${goal}`

  const subConfig: AgentConfig = {
    ...parentConfig,
    systemPrompt: subSystemPrompt,
    // keep extraContext — app-specific knowledge applies to sub-tasks too
    maxIterations: Math.min(parentConfig.maxIterations ?? 40, 20), // cap subagent iterations
    depth: (parentConfig.depth ?? 0) + 1, // subagents run one level deeper and cannot re-delegate
  }

  let finalText = ''

  for await (const event of runAgentLoop(goal, [], subConfig)) {
    if (event.type === 'text') finalText += event.text
    if (event.type === 'error') return `Subagent error: ${event.error}`
  }

  return finalText || 'Subagent completed without producing a summary.'
}
