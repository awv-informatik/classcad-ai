// The agent loop with a scripted provider and an injected tool executor (no CAD session needed).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runAgentLoop } from '../dist/agentLoop.js'
import { checkWireInvariants, renderContext } from '../dist/context/index.js'

const big = (n, ch = 'x') => ch.repeat(n)
let ids = 0
const call = (name, input = {}) => ({ type: 'tool_use', id: `c${++ids}`, name, input })

/** Provider that plays back a list of responses (or functions of the request) and records what it was sent. */
function scripted(steps) {
  const sent = []
  let i = 0
  return {
    sent,
    async chat(params) {
      sent.push(params.messages)
      const step = steps[Math.min(i++, steps.length - 1)]
      const out = typeof step === 'function' ? step(params, sent.length) : step
      if (out instanceof Error) throw out
      return out
    },
  }
}
const chars = (messages) => JSON.stringify(messages).length
const usageOf = (params) => ({ inputTokens: Math.round(chars(params.messages) * 0.25), outputTokens: 50 })

async function run(provider, { history = [], contextLimit = 20000, executeTool, text = 'Build it.' } = {}) {
  const events = []
  const config = {
    provider,
    drawingId: 'test',
    contextLimit,
    maxTokens: 2000,
    systemPrompt: 'test',
    executeTool: executeTool ?? (async (name, input) => ({ result: { ok: true, name, echo: input.payload ?? null } })),
    readStructure: () => ({ tree: { 1: { id: 1, class: 'CC_Part', name: 'P', children: [] } }, root: 1, currentProduct: 1 }),
  }
  for await (const e of runAgentLoop(text, history, config)) events.push(e)
  return events
}

test('a long build compacts at the threshold, reports it, and keeps going', async () => {
  let round = 0
  const provider = scripted([
    (params) => {
      round++
      if (round <= 14) {
        return { content: [{ type: 'text', text: `step ${round}` }, call('run_script', { label: `Step ${round}`, script: big(800, 's'), payload: big(6000, 'r') })], stop_reason: 'tool_use', usage: usageOf(params) }
      }
      return { content: [{ type: 'text', text: 'All done.' }], stop_reason: 'end_turn', usage: usageOf(params) }
    },
  ])
  const executeTool = async (name, input) => ({ result: { returned: { n: input.label }, logs: [input.payload] }, diag: { ops: [{ method: 'v1.part.box' }] } })
  const events = await run(provider, { executeTool })

  const compactions = events.filter((e) => e.type === 'compaction')
  const done = compactions.filter((e) => e.phase === 'done' && e.report)
  assert.ok(done.length >= 1, 'compaction happened')
  assert.equal(compactions.filter((e) => e.phase === 'start').length, compactions.filter((e) => e.phase === 'done').length, 'every start has a done')
  assert.ok(done.some((e) => e.report.counts.collapsedGroups > 0), 'long enough to need the ledger')
  const withLedger = done.find((e) => e.report.state)
  assert.match(withLedger.report.state, /Session state as of step/)
  assert.match(withLedger.report.state, /#1 Part "P"/, 'state comes from the injected drawing structure')
  assert.match(withLedger.report.journal, /"Step 1" {2}part\.box×1 → ok/)

  // Everything sent stayed within the window and was valid on the wire.
  for (const messages of provider.sent) {
    assert.deepEqual(checkWireInvariants(messages), [])
    assert.ok(chars(messages) * 0.25 < 20000, `sent ${Math.round(chars(messages) * 0.25)} tokens`)
  }
  // the heads-up rides inside a tool result (view only), once per compaction cycle — never as a user message
  const noticed = provider.sent.filter((messages) => JSON.stringify(messages.at(-1)).includes('[host] Context is about'))
  assert.ok(noticed.length >= 1 && noticed.length <= done.length + 1, String(noticed.length))
  assert.ok(noticed.every((messages) => messages.at(-1).role === 'tool'))
  assert.equal(events.at(-1).type, 'done')
  assert.equal(events.filter((e) => e.type === 'error').length, 0)
  // the stored history still holds every full result
  const history = events.at(-1).messages
  assert.equal(history.filter((m) => m.role === 'tool' && JSON.stringify(m.content).includes(big(6000, 'r'))).length, 14)
  assert.ok(!JSON.stringify(history).includes('[host] Context is about'), 'the notice is never stored')
})

test('a context overflow compacts hard and retries exactly once', async () => {
  const overflow = Object.assign(new Error('Copilot request failed (400): prompt token count of 50000 exceeds the limit of 12000'), {
    status: 400,
    body: 'prompt token count of 50000 exceeds the limit of 12000',
  })
  let n = 0
  const provider = scripted([
    (params) => {
      n++
      if (n <= 6) return { content: [call('tree', { payload: big(4000, 't') })], stop_reason: 'tool_use', usage: usageOf(params) }
      if (n === 7) return overflow
      return { content: [{ type: 'text', text: 'Recovered.' }], stop_reason: 'end_turn', usage: usageOf(params) }
    },
  ])
  const events = await run(provider, { contextLimit: 200000 })
  assert.equal(provider.sent.length, 8, 'one retry, not three')
  const forced = events.filter((e) => e.type === 'compaction' && e.phase === 'done' && e.report)
  assert.equal(forced.length, 1)
  assert.match(forced[0].reason, /rejected/)
  assert.ok(chars(provider.sent[7]) < chars(provider.sent[6]), 'the retry is smaller')
  assert.equal(events.filter((e) => e.type === 'error').length, 0)
  assert.ok(events.some((e) => e.type === 'text' && e.text === 'Recovered.'))
})

test('a failing provider still hands back the history (done before error)', async () => {
  let n = 0
  const provider = scripted([
    (params) => {
      n++
      if (n === 1) return { content: [call('tree')], stop_reason: 'tool_use', usage: usageOf(params) }
      return Object.assign(new Error('LLM request failed (401): unauthorized'), { status: 401, body: 'unauthorized' })
    },
  ])
  const events = await run(provider)
  const types = events.map((e) => e.type)
  assert.ok(types.indexOf('done') >= 0 && types.indexOf('done') < types.indexOf('error'))
  const history = events.find((e) => e.type === 'done').messages
  assert.deepEqual(checkWireInvariants(renderContext(history)), [], 'the persisted history is valid for the next turn')
  assert.equal(history.filter((m) => m.role === 'tool').length, 1)
})

test('a tool executor that throws leaves no tool_use unanswered', async () => {
  const provider = scripted([(params) => ({ content: [call('tree'), call('find')], stop_reason: 'tool_use', usage: usageOf(params) })])
  const events = await run(provider, {
    executeTool: async () => {
      throw new Error('boom')
    },
  })
  const history = events.find((e) => e.type === 'done').messages
  assert.deepEqual(checkWireInvariants(renderContext(history)), [])
  assert.match(events.at(-1).error, /boom/)
})

test('annotations persist: the next user turn sees earlier readings as stale', async () => {
  const first = await run(scripted([
    (params) => ({ content: [call('tree', { payload: big(3000, 't') })], stop_reason: 'tool_use', usage: usageOf(params) }),
    (params) => ({ content: [{ type: 'text', text: 'Looked.' }], stop_reason: 'end_turn', usage: usageOf(params) }),
  ]))
  const history = first.at(-1).messages
  const treeMeta = history.find((m) => m.role === 'tool').meta.ctx
  assert.equal(treeMeta.kind, 'state-read')
  const second = await run(scripted([
    (params) => ({ content: [call('tree', { payload: big(3000, 't') })], stop_reason: 'tool_use', usage: usageOf(params) }),
    (params) => ({ content: [{ type: 'text', text: 'Again.' }], stop_reason: 'end_turn', usage: usageOf(params) }),
  ]), { history, text: 'And now?' })
  const trees = second.at(-1).messages.filter((m) => m.meta?.ctx?.tool === 'tree')
  assert.equal(trees.length, 2)
  assert.ok(trees[1].meta.ctx.epoch > trees[0].meta.ctx.epoch, 'a new turn is a new drawing revision')
  assert.equal(trees[1].meta.ctx.step, trees[0].meta.ctx.step + 1)
})
