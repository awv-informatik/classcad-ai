// Live counterpart of share.mjs for a session on a ClassCAD worker. An app
// that docks sets database settings of its own (Buerligons does on every
// connect: doCurveTessellation off, which puts the brep edges of a container
// into `lines`/`arcs` and leaves no `edges`); a script of the MCP's must still
// see `edges`, as packages/script/docs/DATA.md promises.
//   1. the app docks through the MCP's link: share/hub.ts pipes it to the
//      server and keeps the settings the MCP's graphics need in its command
//   2. the app joins with an invite of the server's, past the hub: the client
//      puts its settings back before its next pull
// Skips without a worker (CLASSCAD_URL, default ws://localhost:9094/).
import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import WebSocket from 'ws'
import { normalizeResult, runScript } from '@classcad/script'
import { fakeAuth } from './fake-auth.mjs'

// The listener asks whether the machine is signed in: set that up before it is loaded.
Object.assign(process.env, (await fakeAuth()).env)
const { connect } = await import('../dist/client.js')
const { createSessionHub } = await import('../dist/share/hub.js')
const { listen, offerInvite } = await import('../dist/share/server.js')

const url = process.env.CLASSCAD_URL ?? 'ws://localhost:9094/'
const reachable = await new Promise(resolve => {
  const ws = new WebSocket(url)
  const timer = setTimeout(() => (ws.terminate(), resolve(false)), 1500)
  ws.once('open', () => (clearTimeout(timer), ws.close(), resolve(true)))
  ws.once('error', () => (clearTimeout(timer), resolve(false)))
})
const live = reachable ? test : (name, fn) => test(name, { skip: `no worker at ${url}` }, fn)

/** The session adapter run_script uses (tools/script.ts). */
const sessionFor = c => ({
  env: 'node', execute: t => c.execute(t), getTree: o => c.getTree(o), getGraphic: o => c.getGraphic(o),
  getEmissionConfig: () => c.getEmissionConfig(), setEmissionConfig: p => c.setEmissionConfig(p),
})

/** What Buerligons sets on every connect (buerligons/src/initBuerli.ts). */
const APP_SETTINGS = { isGraphicEnabled: true, isCCGraphicEnabled: false, isInvisibleGraphicEnabled: true, isSketchGraphicEnabled: false, facetingParamsMode: 1, chordHeightTol: 0.1, angleTol: 0, doCurveTessellation: false }

/** An app in the session: its requests, answered by their Results. */
async function app(guestUrl) {
  const ws = new WebSocket(guestUrl)
  const waiting = new Map()
  ws.on('message', (data, isBinary) => {
    if (isBinary) return
    const frame = JSON.parse(data.toString())
    if (frame.command !== 'Result' || !waiting.has(frame._transactionID_)) return
    waiting.get(frame._transactionID_)(normalizeResult(frame))
    waiting.delete(frame._transactionID_)
  })
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject) })
  let n = 0
  const execute = task => new Promise(resolve => {
    const transactionID = `app-${++n}`
    waiting.set(transactionID, resolve)
    ws.send(JSON.stringify({ command: 'Execute', commandVersion: 'v1', transactionID, task: [task], options: { undoable: false } }))
  })
  return {
    setSettings: () => execute({ 'v1.common.setDatabaseSettings': [APP_SETTINGS] }),
    curveTessellation: async () => (await execute({ 'v1.common.getDatabaseSettings': [{}] })).result?.doCurveTessellation,
    close: () => ws.close(),
  }
}

const BOX = `
  const part = (await api.v1.part.create({ name: 'Box' })).result
  await api.v1.part.box({ id: part, length: 40, width: 30, height: 20 })
`
// The DATA.md idiom: the top edges are those whose every point is at zTop.
const TOP_EDGES = `
  const solids = (await api.graphic()).containers.filter(c => c.type === 1)
  const edges = solids.flatMap(c => c.edges)
  const zTop = Math.max(...edges.flatMap(e => e.points.filter((_, i) => i % 3 === 2)))
  const top = edges.filter(e => e.points.every((v, i) => i % 3 !== 2 || Math.abs(v - zTop) < 1e-6))
  return { edges: edges.length, top: top.length, lines: solids.some(c => 'lines' in c) }
`

async function runOk(c, code) {
  const res = await runScript(code, sessionFor(c))
  assert.equal(res.ok, true, res.error)
  return res.returned
}

live('worker session: an app docked through the MCP\'s link keeps the settings the MCP\'s graphics need', async () => {
  const c = await connect(url, { engine: 'drogon' })
  const hub = createSessionHub({ client: c, queue: work => work(), toHost: () => {} })
  const invite = hub.createInvite('edit', 'app')
  const unoffer = offerInvite(invite.invite, hub)
  let a
  try {
    await runOk(c, BOX)
    assert.deepEqual(await runOk(c, TOP_EDGES), { edges: 12, top: 4, lines: false })
    const { port } = await listen()
    a = await app(`ws://127.0.0.1:${port}/session/?invite=${invite.invite}`)
    assert.equal((await a.setSettings()).maxLevel, 31)
    assert.equal(await a.curveTessellation(), 1, 'the hub kept it on in the app\'s own command')
    assert.deepEqual(await runOk(c, TOP_EDGES), { edges: 12, top: 4, lines: false })
  } finally {
    a?.close()
    unoffer()
    hub.close()
    await c.execute({ 'v1.common.clear': [{}] }).catch(() => {})
    c.close()
  }
})

live('worker session: an app that joined past the MCP\'s link cannot take the edges away either', async () => {
  const c = await connect(url, { engine: 'drogon' })
  let a
  try {
    await runOk(c, BOX)
    assert.deepEqual(await runOk(c, TOP_EDGES), { edges: 12, top: 4, lines: false })
    const { result } = await c.request('CreateInvite', { role: 'edit', name: 'app' }, { track: false })
    a = await app(`${url.replace(/\/+$/, '')}/?invite=${encodeURIComponent(result.invite)}`)
    assert.equal((await a.setSettings()).maxLevel, 31)
    assert.equal(await a.curveTessellation(), 0, 'the app\'s settings are in force')
    assert.deepEqual(await runOk(c, TOP_EDGES), { edges: 12, top: 4, lines: false })
    assert.equal(await a.curveTessellation(), 1, 'put back by the MCP before its pull')
  } finally {
    a?.close()
    await c.execute({ 'v1.common.clear': [{}] }).catch(() => {})
    c.close()
  }
})
