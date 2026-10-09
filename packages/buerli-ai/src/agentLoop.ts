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
import { getDocIndex, getMethodIndex } from './tools/registry'
import { getNotes } from './tools/notes'
import { capJson } from './tools/utils'
import { DEFAULT_SYSTEM_PROMPT } from './systemPrompt'
import {
  advance,
  annotate,
  buildStateBlock,
  calibrate,
  compact,
  createTracker,
  estimateTokens,
  isContextOverflow,
  markDeadTimeline,
  parseLimitFromError,
  renderContext,
  thresholds,
  DEFAULT_TOKENS_PER_CHAR,
  type Calibration,
  type CompactionReport,
} from './context'

export type AgentTurnEvent =
  | { type: 'text'; text: string }
  | { type: 'thinking'; text: string }
  | { type: 'tool_start'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_end'; id: string; name: string; result: ToolResult }
  | { type: 'subagent_start'; id: string; name: string; goal: string; images?: number; snapshots?: number }
  | { type: 'subagent_end'; id: string; name: string; summary: string }
  | { type: 'usage'; inputTokens?: number; outputTokens?: number }
  /**
   * Context compaction. `start` is emitted before work begins, `done` after — with
   * a report when something was condensed (absent when nothing could be reclaimed).
   */
  | { type: 'compaction'; phase: 'start' | 'done'; reason: string; report?: CompactionReport }
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
  const tools =
    depth > 0 ? TOOL_SCHEMAS.filter((t) => t.name !== 'delegate' && t.name !== 'ask_user' && t.name !== 'fetch_url') : TOOL_SCHEMAS

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
  let hadReferenceImages = depth === 0 && !!images && images.length > 0
  // Reference images live in user messages AND in fetch_url results (tool messages
  // tagged meta.referenceImage) — a fetched drawing is a reference exactly like an
  // attached one and must survive turn boundaries.
  const extractImageBlocks = (content: unknown): ImageInput[] =>
    Array.isArray(content)
      ? (content as Array<{ type?: string; source?: { type?: string; data?: string; media_type?: string } }>)
          .filter((b) => b?.type === 'image' && b.source?.type === 'base64' && typeof b.source.data === 'string')
          .map((b) => ({ data: b.source!.data!, mediaType: b.source!.media_type ?? 'image/png' }))
      : []
  const historyImages: ImageInput[] =
    depth === 0
      ? history
          .filter((m) => (m.role === 'user' && Array.isArray(m.content)) || (m.role === 'tool' && m.meta?.referenceImage))
          .flatMap((m) => extractImageBlocks(m.content))
      : []
  const referenceImages: ImageInput[] = [...historyImages, ...(images ?? [])].slice(-4)
  let conversationHasReferenceImages = depth === 0 && referenceImages.length > 0
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

  // The built-in CAD tools pull in browser-only modules; load them only when the
  // host did not inject its own executor (keeps this loop runnable headless).
  const builtin = config.executeTool ? null : await import('./tools/executor')
  const execTool = config.executeTool ?? builtin!.executeTool
  const readStructure = config.readStructure
    ? () => ({ structure: config.readStructure!(), busy: false })
    : builtin
      ? () => builtin.readDrawingStructure(config.drawingId)
      : undefined

  // ── Context management (see src/context) ──
  // What each tool result is worth is recorded when it is appended; the drawing
  // revision advances with every step that may have changed geometry.
  const tracker = createTracker(history)
  const modelKey = config.model ?? 'default'
  let cal: Calibration = {
    tokensPerChar: learnedTokensPerChar.get(modelKey) ?? DEFAULT_TOKENS_PER_CHAR,
    fixedChars: systemPrompt.length + (JSON.stringify(tools)?.length ?? 0),
  }
  const contextLimit = () => learnedLimits.get(modelKey) ?? config.contextLimit ?? DEFAULT_CONTEXT_TOKENS
  const buildState = () => {
    const src = readStructure?.()
    return buildStateBlock(messages, {
      structure: src ? src.structure : undefined,
      notes: getNotes(config.drawingId),
      epoch: tracker.epoch,
      step: tracker.step,
      busy: src?.busy,
    })
  }
  let lastBatchOnlyRead = false // the previous round only measured/inspected: a safe moment to condense
  let exhaustedAt = 0 // estimate at which the last attempt found nothing to reclaim
  let noticeGiven = false

  // A one-line heads-up inside the latest tool result — view only, once per cycle —
  // so the plan reaches `notes` before older steps are condensed. Deliberately NOT a
  // user message: a model may answer one in prose and end its turn mid-build.
  const withContextNotice = (view: Message[]): Message[] => {
    const th = thresholds(contextLimit(), maxTokens)
    const est = estimateTokens(view, cal)
    const last = view[view.length - 1]
    if (noticeGiven || est < th.notice || !last || last.role !== 'tool' || typeof last.content !== 'string') return view
    noticeGiven = true
    const pct = Math.round((est / contextLimit()) * 100)
    const note = `\n\n[host] Context is about ${pct}% full. Older steps will soon be condensed into a session ledger generated from the live drawing. Make sure your \`notes\` hold the plan, open decisions and the next step. No reply needed — continue.`
    return [...view.slice(0, -1), { ...last, content: last.content + note }]
  }

  let nudges = 0
  const MAX_NUDGES = 3
  let truncationRetries = 0
  const MAX_TRUNCATION_RETRIES = 8
  let lostCallRetries = 0
  const MAX_LOST_CALL_RETRIES = 8

  try {
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      if (config.signal?.aborted) {
        yield { type: 'done', messages }
        return
      }

      // Keep the sent context inside the model's budget. Compaction is ONE discrete
      // event down to a target (never a little every round, so the sent prefix stays
      // stable), and it prefers safe moments: a new user turn, or a round that only
      // measured. What it condenses, and in which order, is task knowledge — see
      // src/context/policy.ts.
      {
        const th = thresholds(contextLimit(), maxTokens)
        const est = estimateTokens(renderContext(messages), cal)
        const boundary = iteration === 0 || lastBatchOnlyRead
        if (est > (boundary ? th.boundaryTrigger : th.trigger) && est > exhaustedAt * 1.1) {
          const reason = boundary ? 'context filling up — condensed at a safe point' : 'context nearly full'
          yield { type: 'compaction', phase: 'start', reason }
          const report = compact(messages, { reason, targetTokens: th.target, cal, epoch: tracker.epoch, buildState }) ?? undefined
          exhaustedAt = report ? 0 : est
          if (report) noticeGiven = false
          yield { type: 'compaction', phase: 'done', reason, report }
        }
      }

      let response: ChatResponse

      // Transient-fault tolerance: Copilot/gateway hiccups (502/503, token
      // exchange, empty bodies) killed whole runs. Retry briefly before failing.
      // A context OVERFLOW is not transient: re-sending the same payload fails again
      // (and gateways multiply the upload) — condense hard and retry exactly once.
      let lastErr: unknown
      let got = false
      let overflowRetried = false
      let sent: Message[] = []
      response = undefined as unknown as ChatResponse
      for (let attempt = 0; attempt < 3 && !got; ) {
        try {
          if (attempt > 0) await new Promise((r) => setTimeout(r, 1500 * attempt))
          sent = withContextNotice(renderContext(messages))
          response = await config.provider.chat({
            system: systemPrompt,
            messages: sent,
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
          const fullness = estimateTokens(sent, cal) / contextLimit()
          if (isContextOverflow(e, fullness)) {
            if (overflowRetried) break
            overflowRetried = true
            const named = parseLimitFromError(e)
            if (named) learnedLimits.set(modelKey, named) // the provider told us the real window
            const reason = 'the model rejected the context as too large'
            yield { type: 'compaction', phase: 'start', reason }
            const report =
              compact(messages, { reason, targetTokens: thresholds(contextLimit(), maxTokens).emergencyTarget, cal, epoch: tracker.epoch, keepGroups: 2, buildState }) ??
              undefined
            yield { type: 'compaction', phase: 'done', reason, report }
            if (!report) break // nothing left to reclaim: fail now instead of re-uploading
            continue // retry with the condensed context; does not count as a transient attempt
          }
          attempt++
        }
      }
      if (!got) {
        const e: any = lastErr
        // History first: a failed round must not cost the user the whole turn.
        yield { type: 'done', messages }
        yield { type: 'error', error: e?.message || String(e) }
        return
      }

      // Calibrate the size estimate against what the provider actually counted.
      cal = calibrate(cal, response.usage?.inputTokens, sent)
      learnedTokensPerChar.set(modelKey, cal.tokensPerChar)

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
            meta: { synthetic: true },
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
            meta: { synthetic: true },
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
            meta: { synthetic: true },
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
            meta: { synthetic: true },
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
          const { agent, goal, withImages, withSnapshots } = tu.input as {
            agent: string
            goal: string
            withImages?: boolean
            withSnapshots?: boolean
          }
          yield {
            type: 'subagent_start',
            id: tu.id,
            name: agent,
            goal,
            images: withImages ? referenceImages.length : 0,
            snapshots: withSnapshots ? recentSnapshots.length : 0,
          }
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
          const result = await execTool(tu.name, tu.input, {
            drawingId: config.drawingId,
            attachments: config.attachments,
          })
          if (tu.name === 'run_script' && !result.error) geometryWasBuilt = true
          // A drawing fetched from the web is a REFERENCE, exactly like an attached
          // one — register it so the perception and mirror gates arm and `withImages`
          // handovers carry it. Without this, an image arriving as a tool result
          // would walk straight past every gate we built.
          if (tu.name === 'fetch_url' && depth === 0 && result.result && typeof result.result === 'object') {
            const fetched = result.result as { kind?: string; image?: string; mediaType?: string }
            if (fetched.kind === 'image' && fetched.image) {
              referenceImages.push({ data: fetched.image, mediaType: fetched.mediaType ?? 'image/png' })
              while (referenceImages.length > 4) referenceImages.shift()
              hadReferenceImages = true
              conversationHasReferenceImages = true
            }
          }
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

      // 3. Emit completions and append tool results in the ORIGINAL order. Every result
      // is annotated with what it is worth to the task (src/context/annotate.ts). All
      // results of one batch belong to the drawing revision the batch started from.
      const batch: Array<{ call: { name: string; input: Record<string, unknown> }; result: ToolResult }> = []
      for (const s of settled) {
        const call = { name: s.tu.name, input: s.tu.input }
        if (s.kind === 'subagent') {
          const { agent } = s.tu.input as { agent: string }
          yield { type: 'subagent_end', id: s.tu.id, name: agent, summary: s.summary }
          // A report is a record, but not an unbounded one.
          const summary =
            s.summary.length > MAX_DELEGATE_REPORT_CHARS
              ? `${s.summary.slice(0, MAX_DELEGATE_REPORT_CHARS)}\n… [report truncated at ${MAX_DELEGATE_REPORT_CHARS} chars]`
              : s.summary
          const result: ToolResult = { result: summary }
          const { ctx } = annotate(tracker, call, result)
          batch.push({ call, result })
          messages.push({ role: 'tool', tool_use_id: s.tu.id, content: summary, meta: { ctx } })
        } else if (s.kind === 'ask') {
          const q = (s.tu.input as { questions?: string })?.questions
          if (typeof q === 'string' && q.trim()) yield { type: 'text', text: q }
          const { ctx } = annotate(tracker, call, s.result)
          batch.push({ call, result: s.result })
          messages.push({ role: 'tool', tool_use_id: s.tu.id, content: JSON.stringify(s.result.result), meta: { ctx } })
        } else {
          yield { type: 'tool_end', id: s.tu.id, name: s.tu.name, result: s.result }
          const isRefImage =
            s.tu.name === 'fetch_url' && !s.result.error && (s.result.result as { kind?: string } | undefined)?.kind === 'image'
          const { ctx, docKeys } = annotate(tracker, call, s.result)
          batch.push({ call, result: s.result })
          let content = buildToolResultContent(s.tu.name, s.result, config.sendSnapshotsToModel ?? false)
          // restore / load_file discard a timeline: what was built on it no longer exists.
          const rolledBack = markDeadTimeline(messages, tracker, call, ctx)
          if (rolledBack > 0 && typeof content === 'string') {
            content += `\n[host] ${rolledBack} earlier tool result(s) in this conversation describe the discarded state. Their ids and measurements no longer exist — do not reuse them.`
          }
          messages.push({
            role: 'tool',
            tool_use_id: s.tu.id,
            content,
            meta: { ctx, ...(isRefImage ? { referenceImage: true } : {}), ...(docKeys?.length ? { docKeys } : {}) },
          })
        }
      }
      advance(tracker, batch)
      lastBatchOnlyRead = batch.length > 0 && batch.every((b) => !b.result.error && !['delegate', 'ask_user', 'notes', 'docs', 'list_methods'].includes(b.call.name)) &&
        messages.slice(-batch.length).every((m) => m.meta?.ctx?.kind === 'state-read')

      // ask_user suspends the turn — the user's reply is the only thing that may
      // continue this conversation (asking must block, not decorate).
      if (settled.some((s) => s.kind === 'ask')) {
        yield { type: 'done', messages }
        return
      }

      // Loop continues — model will see tool results and respond
    }

    // History first: running out of iterations must not cost the user the whole turn.
    yield { type: 'done', messages }
    yield { type: 'error', error: `Agent loop exceeded max iterations (${maxIterations}).` }
  } catch (e: any) {
    // An unexpected failure mid-round: keep the history valid and hand it back.
    closeOpenToolCalls(messages)
    yield { type: 'done', messages }
    yield { type: 'error', error: e?.message || String(e) }
  }
}

// ─── Context management ───────────────────────────────────────────────────────

const DEFAULT_CONTEXT_TOKENS = 120000
const MAX_DELEGATE_REPORT_CHARS = 12000

// Learned per model, for the lifetime of the page: the real window when a provider
// named it in an overflow error, and the chars→tokens ratio from its usage numbers.
const learnedLimits = new Map<string, number>()
const learnedTokensPerChar = new Map<string, number>()

/**
 * Every tool_use needs a tool result or the next request is rejected. After an
 * unexpected failure mid-batch, close the calls that never got one.
 */
function closeOpenToolCalls(messages: Message[]): void {
  let lastAssistant = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      lastAssistant = i
      break
    }
  }
  if (lastAssistant < 0) return
  const assistant = messages[lastAssistant] as Extract<Message, { role: 'assistant' }>
  const answered = new Set(messages.slice(lastAssistant + 1).flatMap((m) => (m.role === 'tool' ? [m.tool_use_id] : [])))
  for (const b of assistant.content) {
    if (b.type === 'tool_use' && !answered.has(b.id)) {
      messages.push({ role: 'tool', tool_use_id: b.id, content: JSON.stringify({ error: 'Interrupted before this call finished — its outcome is unknown.' }) })
    }
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
      'do not guess and do not default to list_methods for v1. Then fetch the docs of every method the task needs ' +
      'in ONE docs([...]) call before your first run_script. (list_methods is still for filtering, or for the reflected ' +
      'non-v1 namespaces — facade/structure/interaction/selection/geometry — which are NOT in this index.)\n\n' +
      index
  }
  const docIndex = getDocIndex()
  if (docIndex) {
    prompt +=
      '\n\n## Document Index\n' +
      'The data contract (DATA, STRUCTURE, GRAPHICS: what api.tree()/api.graphic() return), recipes (composed ' +
      'workflows) and guides (cross-cutting behavior), key — title. Fetch with docs([...]); ' +
      'list_methods({ namespace: "v1", filter }) also ranks these by topic.\n\n' +
      docIndex
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

  // A fetched image is sent as a vision block — the model must SEE the reference
  // it just pulled, not read a description of it. (Registered as a conversation
  // reference image in the loop, so the gates arm on it.)
  if (toolName === 'fetch_url' && result.result && typeof result.result === 'object') {
    const f = result.result as { kind?: string; image?: string; mediaType?: string; finalUrl?: string; bytes?: number; note?: string }
    if (f.kind === 'image' && f.image) {
      return [
        { type: 'image', source: { type: 'base64', media_type: f.mediaType ?? 'image/png', data: f.image } },
        { type: 'text', text: JSON.stringify({ finalUrl: f.finalUrl, mediaType: f.mediaType, bytes: f.bytes, note: f.note }) },
      ]
    }
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
