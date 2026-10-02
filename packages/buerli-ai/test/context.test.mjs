// Pure-function tests for task-aware context compaction (src/context), run against dist.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  advance, annotate, buildJournal, calibrate, checkWireInvariants, compact, createTracker, digestTree, estimateTokens,
  isContextOverflow, isReadOnlyScript, markDeadTimeline, measure, parseLimitFromError, renderContext, servedDocKeys, thresholds,
  ELIDED_SCRIPT_MARKER,
} from '../dist/context/index.js'

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}-structure.json`, import.meta.url), 'utf8'))
const cal = { tokensPerChar: 0.25, fixedChars: 0 }

// ── a tiny conversation builder that goes through the real annotate/advance path ──
function session() {
  const messages = [{ role: 'user', content: 'Build a bracket.' }]
  const tracker = createTracker([])
  let n = 0
  const round = (calls) => {
    const blocks = calls.map((c) => ({ type: 'tool_use', id: `t${++n}`, name: c.name, input: c.input ?? {} }))
    messages.push({ role: 'assistant', content: [{ type: 'thinking', thinking: 'plan', signature: 'sig' }, ...blocks] })
    const batch = []
    calls.forEach((c, i) => {
      const call = { name: c.name, input: c.input ?? {} }
      const result = c.result ?? { result: c.value ?? null }
      const { ctx, docKeys } = annotate(tracker, call, result)
      markDeadTimeline(messages, tracker, call, ctx)
      batch.push({ call, result })
      messages.push({ role: 'tool', tool_use_id: blocks[i].id, content: c.content ?? JSON.stringify(result), meta: { ctx, ...(docKeys?.length ? { docKeys } : {}), ...(c.referenceImage ? { referenceImage: true } : {}) } })
    })
    advance(tracker, batch)
  }
  return { messages, tracker, round }
}
const big = (n, ch = 'x') => ch.repeat(n)
const script = (label, ops, returned, extra = {}) => ({
  name: 'run_script',
  input: { label, script: `// ${label}\n${big(1500, 's')}` },
  result: { result: { returned, logs: [] }, diag: { ops: ops.map((method) => ({ method })) }, ...extra },
})
const byTool = (messages, tool) => messages.filter((m) => m.meta?.ctx?.tool === tool)

test('read-only scripts are recognised; anything uncertain counts as a change', () => {
  assert.equal(isReadOnlyScript('await api.v1.part.calculateMassProperties({id})', { ops: [{ method: 'v1.part.calculateMassProperties' }] }), true)
  assert.equal(isReadOnlyScript('await api.v1.part.getExpression({})', { ops: [{ method: 'v1.part.getExpression' }, { method: 'v1.common.isVisible' }] }), true)
  assert.equal(isReadOnlyScript('await api.v1.part.box({})', { ops: [{ method: 'v1.part.box' }] }), false)
  assert.equal(isReadOnlyScript('const t = await api.tree()', { ops: [] }), true, 'pure tree read')
  assert.equal(isReadOnlyScript('await api.facade.undo()', { ops: [] }), false, 'non-core namespace emits no ops')
  assert.equal(isReadOnlyScript('await api.v1.part.issue()', { ops: [{ method: 'v1.part.issue' }] }), false, '"is" must be followed by a capital')
  assert.equal(isReadOnlyScript('x', { ops: [{ method: 'v1.part.getExpression' }], pending: true }), false, 'timed out: outcome unknown')
  assert.equal(isReadOnlyScript('x', undefined), false)
})

test('epochs: a mutation makes earlier readings stale, a batch shares its starting revision', () => {
  const s = session()
  s.round([{ name: 'tree', value: { nodeCount: 10 } }])
  s.round([script('Plate', ['v1.part.box'], { box: 56 }), { name: 'find', input: { type: 'CC_Box' }, value: { count: 1 } }])
  s.round([script('measure', ['v1.part.calculateMassProperties'], { volume: 192000 })])
  const [tree] = byTool(s.messages, 'tree')
  const [find] = byTool(s.messages, 'find')
  const [build, measureStep] = byTool(s.messages, 'run_script')
  assert.equal(tree.meta.ctx.kind, 'state-read')
  assert.equal(build.meta.ctx.kind, 'build')
  assert.equal(measureStep.meta.ctx.kind, 'state-read')
  assert.equal(find.meta.ctx.epoch, build.meta.ctx.epoch, 'same batch, same revision')
  assert.ok(find.meta.ctx.epoch < s.tracker.epoch, 'a read next to a mutation is stale right away')
  assert.equal(measureStep.meta.ctx.epoch, s.tracker.epoch, 'a read-only script does not advance the revision')
  assert.match(build.meta.ctx.digest, /"Plate" {2}part\.box×1 → ok \{"box":56\}/)
})

test('a new user turn starts a new revision and keeps checkpoints', () => {
  const s = session()
  s.round([{ name: 'checkpoint', input: { label: 'cp' }, value: { label: 'cp' } }])
  s.round([{ name: 'tree', value: { nodeCount: 3 } }])
  const next = createTracker(s.messages)
  assert.equal(next.epoch, s.tracker.epoch + 1, 'the user may have edited the drawing in between')
  assert.equal(next.step, s.tracker.step)
  assert.equal(next.checkpoints.get('cp'), 1)
})

test('restore marks the discarded timeline dead — but not docs, records or the restore itself', () => {
  const s = session()
  s.round([script('Plate', ['v1.part.box'], { box: 56 })])
  s.round([{ name: 'checkpoint', input: { label: 'before-holes' }, value: { label: 'before-holes' } }])
  s.round([{ name: 'docs', input: { keys: ['v1.part.boolean'] }, value: '# ═══ v1.part.boolean ═══\n…' }])
  s.round([script('Holes', ['v1.part.cylinder', 'v1.part.boolean'], null, { error: 'v1.part.boolean: already consumed' })])
  s.round([{ name: 'tree', value: { nodeCount: 40 } }])
  s.round([{ name: 'restore', input: { label: 'before-holes' }, value: { restored: 'before-holes' } }])
  const dead = s.messages.filter((m) => m.meta?.ctx?.dead).map((m) => m.meta.ctx.tool)
  assert.deepEqual(dead, ['run_script', 'tree'])
  assert.equal(byTool(s.messages, 'run_script')[0].meta.ctx.dead, undefined, 'built before the checkpoint: still exists')
  // an unknown label proves nothing dead
  const u = session()
  u.round([script('Plate', ['v1.part.box'], {})])
  u.round([{ name: 'restore', input: { label: 'ghost' }, value: { restored: 'ghost' } }])
  assert.equal(u.messages.filter((m) => m.meta?.ctx?.dead).length, 0)
})

test('load_file discards everything built before it', () => {
  const s = session()
  s.round([script('Plate', ['v1.part.box'], {})])
  s.round([{ name: 'load_file', input: { name: 'gear.stp' }, value: { loaded: 'gear.stp' } }])
  assert.deepEqual(s.messages.filter((m) => m.meta?.ctx?.dead).map((m) => m.meta.ctx.tool), ['run_script'])
})

test('docs: only keys that were actually served count as read', () => {
  const text = '# ═══ response budget reached ═══\nServed 1 of 3 docs. NOT included yet — request these next in another docs call: ["v1.part.slice","api/part"]\n\n# ═══ recipes/verification ═══\n…\n\n# ═══ not found ═══\nv1.part.boxx: Unknown method'
  assert.deepEqual(servedDocKeys(['recipes/verification', 'v1.part.slice', 'api/part', 'v1.part.boxx'], text), ['recipes/verification'])
})

test('estimate: an image is a constant, not its base64; old thinking does not count', () => {
  const image = { type: 'image', source: { type: 'base64', media_type: 'image/png', data: big(400000) } }
  const u = measure([
    { role: 'user', content: [{ type: 'text', text: 'see' }, image] },
    { role: 'assistant', content: [{ type: 'thinking', thinking: big(5000) }, { type: 'text', text: 'a' }] },
    { role: 'user', content: 'go' },
    { role: 'assistant', content: [{ type: 'thinking', thinking: big(100) }, { type: 'text', text: 'b' }] },
  ])
  assert.equal(u.images, 1)
  assert.ok(u.chars < 200, `chars ${u.chars}`)
  const learned = calibrate(cal, 30000, [{ role: 'user', content: big(100000) }])
  assert.ok(learned.tokensPerChar > 0.25 && learned.tokensPerChar < 0.31, String(learned.tokensPerChar))
})

// ── a long build that needs every tier ──
function longBuild() {
  const s = session()
  s.round([{ name: 'docs', input: { keys: ['recipes/verification', 'v1.part.box'] }, content: big(30000, 'd'), value: '# ═══ recipes/verification ═══' }])
  s.round([{ name: 'tree', content: big(12000, 't'), value: { nodeCount: 300 } }])
  s.round([{ name: 'checkpoint', input: { label: 'cp1' }, value: { label: 'cp1' } }])
  s.round([{ ...script('Holes', ['v1.part.cylinder', 'v1.part.boolean'], null, { error: 'v1.part.boolean: Entity already consumed' }), content: big(6000, 'e') }])
  s.round([{ name: 'restore', input: { label: 'cp1' }, value: { restored: 'cp1' } }])
  for (let i = 0; i < 8; i++) {
    s.round([{ ...script(`Step ${i}`, ['v1.part.box', 'v1.part.fillet'], { id: 100 + i }), content: big(5000, 'r') }])
    s.round([{ name: 'tree', content: big(12000, 't'), value: { nodeCount: 300 + i } }])
  }
  s.round([{ name: 'fetch_url', input: { url: 'https://x/drawing.png' }, value: { kind: 'image' }, referenceImage: true, content: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: big(1000) } }] }])
  s.messages.push({ role: 'assistant', content: [{ type: 'text', text: 'The bracket is built: plate #56, 8 steps.' }] })
  s.messages.push({ role: 'user', content: 'Now add a slot.' })
  for (let i = 0; i < 5; i++) s.round([{ ...script(`Slot ${i}`, ['v1.part.box'], { id: 200 + i }), content: big(3000, 'r') }])
  return s
}

test('tier A alone: dead, superseded and stale readings go first, nothing else is touched', () => {
  const s = longBuild()
  const before = estimateTokens(renderContext(s.messages), cal)
  const report = compact(s.messages, { reason: 't', targetTokens: before - 12000, cal, epoch: s.tracker.epoch, buildState: () => 'STATE' })
  assert.equal(report.tier, 'A')
  assert.ok(report.counts.dead >= 1 && report.counts.superseded >= 1)
  assert.equal(report.counts.bulk + report.counts.docs + report.counts.collapsedGroups, 0)
  assert.ok(report.afterTokens <= before - 12000 + 200)
  const stubbed = s.messages.filter((m) => m.meta?.ctx?.stub)
  assert.ok(stubbed.every((m) => ['tree', 'run_script'].includes(m.meta.ctx.tool)))
  assert.ok(stubbed.some((m) => /ROLLED BACK/.test(m.meta.ctx.stub)) && stubbed.some((m) => /Superseded/.test(m.meta.ctx.stub)))
  assert.equal(s.messages.filter((m) => m.meta?.ledger).length, 0, 'no ledger without a collapse')
})

test('full compaction: wire invariants hold, history is untouched, the protected survive', () => {
  const s = longBuild()
  const contentBefore = s.messages.map((m) => m.content)
  const thinkingBefore = s.messages.filter((m) => m.role === 'assistant').map((m) => m.content[0])
  const report = compact(s.messages, { reason: 'full', targetTokens: 6000, cal, epoch: s.tracker.epoch, buildState: () => 'STATE BLOCK' })
  assert.equal(report.tier, 'C')
  assert.ok(report.counts.collapsedGroups > 0)
  assert.ok(report.freedTokens > 20000, String(report.freedTokens))

  const view = renderContext(s.messages)
  assert.deepEqual(checkWireInvariants(view), [])
  // stored content is never rewritten (ledger messages are additions)
  const stored = s.messages.filter((m) => !m.meta?.ledger)
  stored.forEach((m, i) => assert.equal(m.content, contentBefore[i]))
  // thinking blocks of kept assistant messages are the very same objects
  const keptAssistants = view.filter((m) => m.role === 'assistant')
  for (const a of keptAssistants) if (a.content[0]?.type === 'thinking') assert.ok(thinkingBefore.includes(a.content[0]))

  const text = JSON.stringify(view)
  assert.ok(text.includes('Build a bracket.') && text.includes('Now add a slot.'), 'user messages stay')
  assert.ok(text.includes('The bracket is built'), 'the answer that closed the earlier turn stays')
  assert.ok(view.some((m) => m.meta?.referenceImage), 'reference image stays')
  assert.ok(text.includes('Slot 4'), 'the latest groups stay')

  const journal = view.find((m) => m.meta?.ledger === 'journal')
  const state = view[view.length - 1]
  assert.equal(state.meta?.ledger, 'state')
  assert.equal(state.content, 'STATE BLOCK')
  assert.match(journal.content, /Session ledger/)
  assert.match(journal.content, /FAILED: v1\.part\.boolean: Entity already consumed.*rolled back/)
  assert.match(journal.content, /docs read in those steps.*recipes\/verification/)
  assert.ok(report.docKeys.includes('recipes/verification'))
  // the journal is history: it sits before the work that is still live
  const firstLiveSlot = view.findIndex((m) => m.role === 'assistant' && JSON.stringify(m.content).includes('Slot'))
  assert.ok(view.indexOf(journal) >= 0 && view.indexOf(journal) < firstLiveSlot)
})

test('rendering is stable between events and compaction is idempotent at its target', () => {
  const s = longBuild()
  compact(s.messages, { reason: 'x', targetTokens: 6000, cal, epoch: s.tracker.epoch, buildState: () => 'S' })
  const a = JSON.stringify(renderContext(s.messages))
  assert.equal(JSON.stringify(renderContext(s.messages)), a)
  const again = compact(s.messages, { reason: 'x', targetTokens: estimateTokens(renderContext(s.messages), cal) + 10, cal, epoch: s.tracker.epoch, buildState: () => 'S' })
  assert.equal(again, null, 'already under the target: nothing to do')
  assert.equal(JSON.stringify(renderContext(s.messages)), a)
})

test('a second collapse regenerates ONE ledger covering everything condensed so far', () => {
  const s = longBuild()
  compact(s.messages, { reason: '1', targetTokens: 9000, cal, epoch: s.tracker.epoch, buildState: () => 'S1' })
  for (let i = 0; i < 6; i++) s.round([{ ...script(`More ${i}`, ['v1.part.box'], {}), content: big(8000, 'm') }])
  const r2 = compact(s.messages, { reason: '2', targetTokens: 6000, cal, epoch: s.tracker.epoch, buildState: () => 'S2' })
  assert.ok(r2.counts.collapsedGroups > 0)
  const ledgers = s.messages.filter((m) => m.meta?.ledger)
  assert.deepEqual(ledgers.map((m) => m.meta.ledger), ['journal', 'state'])
  assert.match(ledgers[0].content, /Step 0/)
  assert.match(ledgers[0].content, /More 0/)
  assert.equal(ledgers[1].content, 'S2')
  assert.deepEqual(checkWireInvariants(renderContext(s.messages)), [])
})

test('tier B elides old script sources with a marker that cannot be run', () => {
  const s = longBuild()
  const before = estimateTokens(renderContext(s.messages), cal)
  compact(s.messages, { reason: 'b', targetTokens: before - 30000, cal, epoch: s.tracker.epoch, buildState: () => 'S' })
  const view = renderContext(s.messages)
  const inputs = view.flatMap((m) => (m.role === 'assistant' ? m.content.filter((b) => b.type === 'tool_use' && b.name === 'run_script').map((b) => b.input.script) : []))
  assert.ok(inputs.some((src) => src.startsWith(ELIDED_SCRIPT_MARKER) && /ops: part\.box×1/.test(src)))
  const storedInputs = s.messages.flatMap((m) => (m.role === 'assistant' ? m.content.filter((b) => b.type === 'tool_use' && b.name === 'run_script').map((b) => b.input.script) : []))
  assert.ok(storedInputs.every((src) => !src.startsWith(ELIDED_SCRIPT_MARKER)), 'the stored source is intact')
})

test('journal keeps builds and failures when it has to shrink', () => {
  const s = session()
  for (let i = 0; i < 120; i++) s.round([{ name: 'find', input: { name: `thing-${i}-${big(60, 'n')}` }, value: { count: 1 } }])
  s.round([script('The one build', ['v1.part.box'], { id: 1 })])
  for (const m of s.messages) if (m.role !== 'user') m.meta = { ...m.meta, collapsed: true }
  const journal = buildJournal(s.messages)
  assert.ok(journal.length < 7500, String(journal.length))
  assert.match(journal, /The one build/)
  assert.match(journal, /older readings\/lookups omitted/)
})

test('digestTree reads a real part and a real assembly', () => {
  const part = digestTree(fixture('part'))
  assert.match(part, /#4 Part "Bracket" \[root, current\]/)
  assert.match(part, /#56 Box "Plate"[\s\S]*#93 ConstantRadiusFillet "Round"[\s\S]*#115 WorkCSys "HoleCS"[\s\S]*#123 Cylinder "Hole"/)
  assert.doesNotMatch(part, /"Origin"|"XAxis"|"Top"/, 'default work geometry is noise')
  assert.match(part, /current solids: 2/)
  assert.match(part, /W = 120/)
  assert.match(part, /H = W \/ 6 \(20\)/)
  assert.match(part, /#140 "Profile" \(4 curves, 9 constraints\)/)
  const asm = digestTree(fixture('assembly'))
  assert.match(asm, /AssemblyRoot "Rig" \[root, current\]/)
  assert.match(asm, /#\d+ "Arm1" → #\d+ "Arm"/)
  assert.match(asm, /RevoluteConstraint "Hinge"/)
  assert.match(asm, /L = 80/)
  assert.equal(digestTree(null), 'The drawing is empty.')
  assert.ok(digestTree(fixture('assembly'), { maxChars: 300 }).length <= 300)
})

test('digestTree counts sheets apart from solids and leaves consumed bodies out', () => {
  // A part after a slice by sheet: the box (30) and the cutting sheet (31) are consumed,
  // the slab (32) is the current solid; 33 is a second sheet nobody has used yet.
  const body = (id, cls, consumed) => ({ id, class: cls, name: cls, parent: 20, members: { consumed: { value: consumed } } })
  const part = (...bodies) => ({
    root: 10, currentProduct: 10,
    tree: Object.fromEntries([
      { id: 10, class: 'CC_Part', name: 'Part', parent: 1, children: [20] },
      { id: 20, class: 'CC_EntitySet', name: 'EntitySet', parent: 10, children: bodies.map(b => b.id) },
      ...bodies,
    ].map(n => [n.id, n])),
  })
  const sliced = part(body(30, 'CC_Solid', 1), body(31, 'CC_Sheet', 1), body(32, 'CC_Solid', 0), body(33, 'CC_Sheet', 0))
  assert.match(digestTree(sliced), /current solids: 1, sheets \(open bodies\): 1$/m)
  assert.match(digestTree(part(body(33, 'CC_Sheet', 0))), /current solids: 0, sheets \(open bodies\): 1$/m, 'a part that holds only a sheet')
  assert.match(digestTree(part(body(32, 'CC_Solid', 0), body(34, 'CC_DecoratedSolid', 0))), /current solids: 2$/m, 'a decorated solid is a solid')
  assert.doesNotMatch(digestTree(part(body(30, 'CC_Solid', 1), body(31, 'CC_Sheet', 1))), /current solids/, 'consumed bodies are not current')
})

test('a consumed body is a solid or a sheet with consumed 1 — not a curve shape', async () => {
  const { isBody, isConsumedBody } = await import('../dist/bodies.js')
  const node = (cls, consumed) => ({ class: cls, members: { consumed: { value: consumed } } })
  assert.ok(isConsumedBody(node('CC_Solid', 1)) && isConsumedBody(node('CC_Sheet', 1)) && isConsumedBody(node('CC_DecoratedSolid', 1)))
  assert.ok(!isConsumedBody(node('CC_Solid', 0)) && !isConsumedBody(node('CC_Sheet', 0)))
  assert.ok(!isConsumedBody(node('CC_CurveEntity', 1)), 'a curve shape carries consumed 1 while it is live')
  assert.ok(!isConsumedBody(undefined) && !isConsumedBody({ class: 'CC_Solid' }), 'unknown owner, body without members: kept')
  assert.ok(isBody(node('CC_Sheet', 0)) && !isBody(node('CC_Part', 0)))
})

test('api.graphic() keeps the containers of what is current', async () => {
  const { liveContainers } = await import('../dist/bodies.js')
  const node = (cls, consumed) => ({ class: cls, members: { consumed: { value: consumed } } })
  const tree = { 30: node('CC_Solid', 1), 31: node('CC_Sheet', 1), 32: node('CC_Solid', 0), 33: node('CC_Sheet', 0), 50: node('CC_CurveEntity', 1) }
  const containers = [30, 31, 32, 33, 50, 99, undefined].map((owner, i) => ({ id: 100 + i, owner }))
  assert.deepEqual(liveContainers(containers, tree).map(c => c.owner), [32, 33, 50, 99, undefined], 'the consumed solid and the consumed sheet are left out; a curve shape, an unknown owner and a container without owner stay')
  assert.equal(liveContainers(containers, {}).length, 7, 'without a tree nothing is known to be consumed')
})

test('overflow errors are recognised per provider, transient ones are not', () => {
  assert.ok(isContextOverflow({ status: 400, body: '{"error":{"type":"invalid_request_error","message":"prompt is too long: 210000 tokens > 200000 maximum"}}' }))
  assert.ok(isContextOverflow({ status: 400, body: '{"error":{"code":"context_length_exceeded","message":"This model\'s maximum context length is 128000 tokens."}}' }))
  assert.ok(isContextOverflow({ status: 400, body: 'prompt token count of 140000 exceeds the limit of 128000' }))
  assert.ok(isContextOverflow({ message: 'Responses request failed: {"status":"failed","code":"context_length_exceeded"}' }))
  assert.ok(isContextOverflow({ status: 413, body: '' }))
  assert.ok(isContextOverflow({ status: 400, body: 'Bad Request' }, 0.9), 'bare 400 near the limit')
  assert.ok(!isContextOverflow({ status: 400, body: 'Bad Request' }, 0.3))
  assert.ok(!isContextOverflow({ status: 502, body: 'Bad Gateway' }, 0.95))
  assert.ok(!isContextOverflow({ status: 429, body: 'rate limit' }, 0.95))
  assert.equal(parseLimitFromError({ body: "This model's maximum context length is 32768 tokens." }), 32768)
  assert.equal(parseLimitFromError({ body: 'prompt token count of 140000 exceeds the limit of 128000' }), 128000)
  assert.equal(parseLimitFromError({ body: 'nope' }), undefined)
})

test('thresholds leave room for the output and scale with small windows', () => {
  const big128 = thresholds(128000, 8192)
  assert.ok(big128.boundaryTrigger < big128.trigger && big128.target < big128.boundaryTrigger)
  const small = thresholds(30000, 8192)
  assert.ok(small.trigger <= 30000 - 8192)
})
