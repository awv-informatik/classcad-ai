// ─── Agent loop — multi-turn tool-use conversation ────────────────────────────

import type {
  AgentConfig,
  ChatResponse,
  ImageInput,
  Message,
  ToolResult,
  ToolResultContent,
  ToolUseBlock,
  ThinkingBlock,
  UserContentBlock,
} from './types'
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

  // Subagents (depth > 0) cannot delegate (unbounded recursion) and cannot reach
  // the user (their "user" is the caller — open questions go into the summary).
  const tools = depth > 0 ? TOOL_SCHEMAS.filter((t) => t.name !== 'delegate' && t.name !== 'ask_user') : TOOL_SCHEMAS

  // The most recent snapshot renders, kept so a `delegate` can be handed the
  // actual pictures (withSnapshots) instead of a description of them.
  const recentSnapshots: ImageInput[] = []
  const MAX_HANDOVER_SNAPSHOTS = 2

  // Mirror-gate bookkeeping (see the gate below, before `done`).
  // Fresh images gate the perception read (this turn); reference images from EARLIER
  // turns still matter — ask_user→answer→build flows build in a turn without fresh
  // attachments, and a `withImages` handover must still deliver the actual drawing
  // (measured failure: the gate reader got only the A|B sheet, no reference, and the
  // agent then judged the match itself against its own misread record).
  const hadReferenceImages = depth === 0 && !!images && images.length > 0
  const historyImages: ImageInput[] =
    depth === 0
      ? history
          .filter((m) => m.role === 'user' && Array.isArray(m.content))
          .flatMap((m) =>
            (m.content as UserContentBlock[])
              .filter((b): b is Extract<UserContentBlock, { type: 'image' }> => b?.type === 'image' && b.source?.type === 'base64')
              .map((b) => ({ data: b.source.data, mediaType: b.source.media_type })),
          )
      : []
  const referenceImages: ImageInput[] = [...historyImages, ...(images ?? [])].slice(-4)
  const conversationHasReferenceImages = depth === 0 && referenceImages.length > 0
  let geometryWasBuilt = false // a run_script actually ran
  let mirrorJudged = false // a fresh reader saw reference AND render
  let mirrorNudges = 0
  let perceptionDelegated = false // an isolated reader read the reference
  let perceptionBlocks = 0

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
  let truncationRetries = 0
  const MAX_TRUNCATION_RETRIES = 8
  let lostCallRetries = 0
  const MAX_LOST_CALL_RETRIES = 8

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

    // Transient-fault tolerance: Copilot/gateway hiccups (502/503, token
    // exchange, empty bodies) killed whole runs. Retry briefly before failing.
    let lastErr: unknown
    let got = false
    response = undefined as unknown as ChatResponse
    for (let attempt = 0; attempt < 3 && !got; attempt++) {
      try {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 1500 * attempt))
        response = await config.provider.chat({
          system: systemPrompt,
          messages,
          tools,
          max_tokens: maxTokens,
          model: config.model,
          reasoningEffort: config.reasoningEffort,
          signal: config.signal,
          onDelta: config.onStreamDelta,
        })
        got = true
      } catch (e: any) {
        lastErr = e
        if (config.signal?.aborted) {
          yield { type: 'done', messages }
          return
        }
      }
    }
    if (!got) {
      const e: any = lastErr
      yield { type: 'error', error: e?.message || String(e) }
      return
    }

    // Diagnosis aid: surface why each round ended (visible in the devtools console).
    // eslint-disable-next-line no-console
    console.debug('[buerli-ai] round', iteration, 'stop_reason:', response.stop_reason, 'usage:', response.usage)

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
      // Output-limit truncation: the model was cut off BEFORE it could emit its
      // tool call (typical symptom: narrated intent, then silence). This is not
      // the model choosing to stop — auto-continue on a separate, generous
      // budget so long builds don't die at the per-round output cap.
      // Copilot sometimes reports finish_reason 'tool_calls' but DROPS the actual
      // tool-call payload from the response (observed live: finish=tool_calls,
      // tool_calls=0). The model wanted to continue — its call was lost in
      // transit. Retry deterministically instead of ending the turn.
      if (response.stop_reason === 'tool_use' && lostCallRetries < MAX_LOST_CALL_RETRIES) {
        lostCallRetries++
        messages.push({
          role: 'user',
          content:
            'Your tool call was LOST IN TRANSIT (the provider reported a tool call but delivered none). ' +
            'Re-issue the exact tool call now. If it was a large run_script, split it into two smaller scripts.',
        })
        continue
      }
      if (response.stop_reason === 'max_tokens' && truncationRetries < MAX_TRUNCATION_RETRIES) {
        truncationRetries++
        messages.push({
          role: 'user',
          content:
            'Your previous response was truncated at the output-token limit before any tool call was emitted. ' +
            'Continue exactly where you left off — go straight to the tool call, keep prose minimal.',
        })
        continue
      }
      // Some models narrate their intent ("let me grab the tree…" / "let me call
      // it correctly:") and end the turn without emitting the tool call. Nudge
      // (bounded) only when the text clearly trails off mid-action — it ends with
      // a colon or its FINAL, unterminated sentence states intent. End-anchored on
      // purpose: an unanchored intent match fired on legitimate questions to the
      // user ("…let me confirm before building… I'll build it parametrically.")
      // and the nudge then impersonated the user's consent — the fabricated-consent
      // failure, manufactured by the loop itself. Questions belong to ask_user;
      // text-only endings that merely MENTION future work are complete answers.
      const trailingText = textBlocks
        .map((b) => b.text)
        .join('')
        .trimEnd()
      const looksIncomplete =
        trailingText.endsWith(':') ||
        /\b(let me|let's|i'?ll|i will|now i|first,? i)\b[^.!?]*$/i.test(trailingText) ||
        // announced-action endings: "Now building.", "Proceeding.", "Starting with the blank."
        /\b(now|next)\b[^.!?]*\b(build|creat|proceed|start|continu|mov|writ|run)\w*[.!]?$/i.test(trailingText)
      if (looksIncomplete && nudges < MAX_NUDGES) {
        nudges++
        messages.push({
          role: 'user',
          content:
            'Proceed now — emit the tool call(s) needed to complete the request in this same turn. Do not reply with only a description of what you intend to do.',
        })
        continue
      }
      // MIRROR GATE. A turn that reproduced a reference image may not end until
      // the render has been judged against that IMAGE by a fresh reader. This is
      // enforced here, not in the prompt, because a self-assessed precondition is
      // always escapable: told the check was mandatory "when the record holds a
      // handedness fact", an agent exempted itself with "the part is symmetric,
      // no handedness risk" — misclassifying the trigger, then shipping the
      // feature mirrored. So there is NO condition to judge: reference images in,
      // pair-render + independent verdict out. Bounded to one nudge; if the model
      // ignores it, the turn ends anyway rather than looping.
      if (conversationHasReferenceImages && geometryWasBuilt && !mirrorJudged && mirrorNudges < 1) {
        mirrorNudges++
        messages.push({
          role: 'user',
          content:
            'Before you finish: this build derives from a reference image, so the mirror check is required — ' +
            'no symmetry argument exempts it, and "I am confident" is not a reason to skip (for handedness, ' +
            'confidence and accuracy are uncorrelated). Your numeric checks cannot catch a mirrored reading ' +
            'because their targets came from that same reading. Do exactly this now: (1) snapshot with ' +
            '`sheet: [<view matching the reference>, <same view, azimuth negated>]`; (2) `delegate` with ' +
            '`agent: "perception", withImages: true, withSnapshots: true` asking ONLY "which panel matches ' +
            'the reference, and which feature decides it?". Report its verdict. If it picks the mirror, the ' +
            'model is flipped — say so plainly instead of explaining the difference away.',
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
      } else if (tu.name === 'ask_user') {
        // no chip — the question text is emitted as an assistant message below
      } else {
        yield { type: 'tool_start', id: tu.id, name: tu.name, input: tu.input }
        config.onToolExecution?.(tu.name, tu.input)
      }
    }

    // 2. Execute all concurrently (handlers never reject — they return error objects).
    const settled = await Promise.all(
      toolUseBlocks.map(async (tu) => {
        if (tu.name === 'delegate') {
          const { agent, goal, withImages, withSnapshots } = tu.input as {
            agent: string
            goal: string
            withImages?: boolean
            withSnapshots?: boolean
          }
          // A judging delegate needs BOTH sides of the comparison: the user's
          // reference AND the renders. Without the renders it can only re-check
          // the reference against a DESCRIPTION — which is how a mirrored record
          // validates itself (measured: the mirror check judged panel A against
          // the record, not the image, and shipped a mirrored part).
          // referenceImages spans the whole conversation — withImages must deliver
          // the drawing even when the build turn carries no fresh attachments.
          const handOver = [...(withImages ? referenceImages : []), ...(withSnapshots ? recentSnapshots : [])]
          // ONE question per perception reader — answering a list forces the reader
          // to build a whole-part interpretation, which is the exact condition that
          // breaks perception (measured: 1 question → 6/6 correct; 7 in one reader →
          // wrong). Enforced here because the prose keeps being skimmed.
          if (agent === 'perception') {
            const qMarks = (goal.match(/\?/g) || []).length
            const listItems = (goal.match(/(?:^|\n)\s*(?:\d+[.)]|[-*])\s+/g) || []).length
            if (qMarks > 1 || listItems > 1) {
              return {
                kind: 'subagent' as const,
                tu,
                summary:
                  'REJECTED — one question per perception reader. This goal contains several questions; a reader ' +
                  'handed a list reconstructs the whole part and fails exactly like an in-task reading (measured: ' +
                  'one question → 6/6 correct; seven in one reader → wrong). Re-emit as SEVERAL delegate calls — ' +
                  'one question each, all in the SAME response so they run in parallel.',
              }
            }
          }
          // Counts as the mirror check only when the reader actually HELD both
          // sides — a handover with no reference images is a failed gate, not a pass.
          if (withImages && referenceImages.length > 0 && withSnapshots && recentSnapshots.length > 0) mirrorJudged = true
          if (withImages && referenceImages.length > 0 && agent === 'perception') perceptionDelegated = true
          let summary = await runSubagent(agent, goal, config, handOver.length ? handOver : undefined)
          if (agent === 'perception' && withSnapshots && !withImages && conversationHasReferenceImages) {
            summary +=
              '\n\n[loop] Reference images exist in this conversation but withImages was not set, so the reader ' +
              'could not see the drawing. This did NOT count as the mirror gate — re-delegate with ' +
              'withImages: true AND withSnapshots: true.'
          }
          return { kind: 'subagent' as const, tu, summary }
        }
        // ASK_USER — suspends the turn. The result closes the tool-use protocol so
        // the history stays valid; the user's reply arrives as the next user message.
        if (tu.name === 'ask_user') {
          if (depth > 0) {
            return {
              kind: 'tool' as const,
              tu,
              result: {
                error: 'No user is reachable at sub-agent depth — report the open question in your final summary instead.',
              } as ToolResult,
            }
          }
          return {
            kind: 'ask' as const,
            tu,
            result: {
              result: {
                status: 'delivered',
                note: 'Questions shown to the user; this turn ends now. The reply arrives as the next user message — do not proceed on assumptions in the meantime.',
              },
            } as ToolResult,
          }
        }
        // PERCEPTION GATE. Measured repeatedly: a reader given ONLY the image and
        // a question answers correctly (6/6 across three question forms), while
        // the same model reading the same drawing WHILE planning a build gets it
        // wrong — the build task, not the eyes, is the failure. So the first
        // build call is blocked until an isolated reader has supplied the read.
        if (tu.name === 'run_script' && hadReferenceImages && !perceptionDelegated && perceptionBlocks < 1) {
          perceptionBlocks++
          return {
            kind: 'tool' as const,
            tu,
            result: {
              error:
                'BLOCKED — read the reference before building. You are working from a reference image, and ' +
                'reading a drawing while planning a build is the measured failure mode (an isolated reader ' +
                'answers correctly 6/6; the same model reading in-task gets it wrong). Do this first: ' +
                'fan out `delegate` calls with `agent: "perception", withImages: true` — EXACTLY ONE question ' +
                'per reader, all emitted in the same response so they run in parallel; a reader handed a list ' +
                'reconstructs the whole part and fails exactly like an in-task reading does. Cover every ' +
                'question your geometry depends on — axis directions, which side each opening faces, which ' +
                'faces are flush/collinear, feature counts. Take the verdicts as your reference record, write ' +
                'them into `notes`, then run this script. Ask the USER (`ask_user`) about anything a reader ' +
                'cannot answer from the image.',
            } as ToolResult,
          }
        }
        const result = await executeTool(tu.name, tu.input, {
          drawingId: config.drawingId,
          attachments: config.attachments,
        })
        if (tu.name === 'run_script' && !result.error) geometryWasBuilt = true
        if (tu.name === 'snapshot' && result.result && typeof result.result === 'object') {
          const snap = result.result as { image?: string; mimeType?: string }
          if (snap.image) {
            recentSnapshots.push({ data: snap.image, mediaType: snap.mimeType ?? 'image/png' })
            if (recentSnapshots.length > MAX_HANDOVER_SNAPSHOTS) recentSnapshots.shift()
          }
        }
        return { kind: 'tool' as const, tu, result }
      }),
    )

    // 3. Emit completions and append tool results in the ORIGINAL order.
    for (const s of settled) {
      if (s.kind === 'subagent') {
        const { agent } = s.tu.input as { agent: string }
        yield { type: 'subagent_end', id: s.tu.id, name: agent, summary: s.summary }
        messages.push({ role: 'tool', tool_use_id: s.tu.id, content: s.summary })
      } else if (s.kind === 'ask') {
        const q = (s.tu.input as { questions?: string })?.questions
        if (typeof q === 'string' && q.trim()) yield { type: 'text', text: q }
        messages.push({ role: 'tool', tool_use_id: s.tu.id, content: JSON.stringify(s.result.result) })
      } else {
        yield { type: 'tool_end', id: s.tu.id, name: s.tu.name, result: s.result }
        messages.push({
          role: 'tool',
          tool_use_id: s.tu.id,
          content: buildToolResultContent(s.tu.name, s.result, config.sendSnapshotsToModel ?? false),
        })
      }
    }

    // ask_user suspends the turn — the user's reply is the only thing that may
    // continue this conversation (asking must block, not decorate).
    if (settled.some((s) => s.kind === 'ask')) {
      yield { type: 'done', messages }
      return
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
  pruned: 'Old tool result removed to save context. Re-run the tool if you need this data — key ids/state should live in your notes.',
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
function buildToolResultContent(toolName: string, result: ToolResult, sendSnapshotImage: boolean): string | ToolResultContent[] {
  if (result.error) {
    return capJson({ error: result.error }, 12000)
  }

  // Snapshot results include an `image` field with base64 PNG data.
  if (toolName === 'snapshot' && result.result && typeof result.result === 'object') {
    const snap = result.result as {
      image?: string
      mimeType?: string
      width?: number
      height?: number
      label?: string
      frame?: unknown
      rendered?: string[]
    }
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

  // Bulk documentation is EXPECTED to be large — that is the point of fetching
  // everything in one round. Give it a generous cap so a full doc set survives.
  if (toolName === 'docs') {
    return capJson(result.result ?? null, 160000)
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
  sketch:
    'You are a 2D sketching specialist. Focus only on sketch creation: planes, lines, arcs, constraints, dimensions. Work precisely and report what you created.',
  boolean: 'You are a boolean operations specialist. Focus on combining solids: union, subtract, intersect. Report the resulting geometry.',
  fillet_chamfer: 'You are a fillet/chamfer specialist. Apply edge treatments precisely. Report which edges were modified.',
  assembly: 'You are an assembly specialist. Focus on component placement, mates, and constraints. Report the final assembly structure.',
  analysis:
    'You are a geometry analysis specialist. Inspect the model tree, measure properties, and report findings without modifying geometry.',
  perception:
    'You are an image-perception reader with NO CAD task. You receive image(s) and ONE binary ' +
    'image-space question. Answer it strictly from the pixels: name the evidence (which edge/region, ' +
    'approximate location), then give the verdict. Do not model, do not plan, do not touch CAD tools — ' +
    'just look and answer.\n' +
    "Images arrive in order: the user's reference image(s) FIRST, then (when supplied) render(s) of the " +
    'model being checked — typically one image holding two candidate views labeled A and B. For such a ' +
    'comparison your job is a forced choice: decide which labeled panel matches the reference, naming the ' +
    'one feature that decides it. You are the ONLY unbiased judge in that loop — the caller cannot check ' +
    'its own reading, so never soften a mismatch, and if neither panel matches say exactly that.\n' +
    'Answer only what the pixels can support. If a question asks what a dimension MEASURES, what is hidden ' +
    'behind the part, how deep a bore goes, or which convention a drawing follows, say NOT ANSWERABLE FROM ' +
    'THE IMAGE and move on — a confident guess there is worse than no answer, because the caller will build ' +
    'on it.',
}

/**
 * Runs a subagent — a nested agent loop with a persona layered ON TOP of the full
 * base system prompt. The persona must extend, not replace: without the base
 * prompt the subagent loses the editor starting-state rules, tool guidance, and
 * workflow discipline — exactly the knowledge it needs to execute its sub-task.
 */
async function runSubagent(agentName: string, goal: string, parentConfig: AgentConfig, images?: ImageInput[]): Promise<string> {
  const persona =
    SUBAGENT_PROMPTS[agentName] ?? `You are a specialist sub-agent named "${agentName}". Complete your goal precisely and report results.`
  // The perception reader deliberately runs WITHOUT the CAD base prompt: fresh
  // context is its entire value (task context is what mirrors perception), and
  // it must not build anything anyway.
  const base = agentName === 'perception' ? '' : (parentConfig.systemPrompt ?? DEFAULT_SYSTEM_PROMPT)
  const subSystemPrompt =
    `${base ? `${base}\n\n` : ''}## Sub-agent role\n${persona}\n` +
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

  for await (const event of runAgentLoop(goal, [], subConfig, images)) {
    if (event.type === 'text') finalText += event.text
    if (event.type === 'error') return `Subagent error: ${event.error}`
  }

  return finalText || 'Subagent completed without producing a summary.'
}
