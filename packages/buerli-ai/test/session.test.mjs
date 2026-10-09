// The browser session's graphic database settings, on a fake buerli (fixtures/fake-buerli.mjs):
// an app that sets its own on every connect (Buerligons, doCurveTessellation off), a reconnect,
// another participant of the session. A script reads `container.edges` as DATA.md shows.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as nodeModule from 'node:module'
import { runScript } from '@classcad/script'
import { resolve } from './fixtures/fake-buerli-hook.mjs'

console.debug = () => {} // the session's emission trace
if (typeof nodeModule.registerHooks === 'function') nodeModule.registerHooks({ resolve })
else nodeModule.register('./fixtures/fake-buerli-hook.mjs', import.meta.url) // Node 20
const { browserSession, refreshAfterScript, withEmissionConfig, SUPPRESS_GRAPHICS } = await import('../dist/tools/session.js')
const { engine, createApi, getDrawing, APP_SETTINGS } = await import('./fixtures/fake-buerli.mjs')

const BUILD = `
  const part = (await api.v1.part.create({ name: 'P' })).result
  await api.v1.part.box({ id: part, length: 40, width: 30, height: 20 })
`
const READ = `
  const solids = (await api.graphic()).containers.filter(c => c.type === 1)
  return solids.reduce((n, c) => n + c.edges.length, 0)
`

/** Runs a script as run_script does (tools/script.ts): graphic suppressed, one pull afterwards. */
async function runAsAssistant(script) {
  const session = browserSession('d', { suppressGraphics: true })
  session.withRunScope = run => withEmissionConfig('d', SUPPRESS_GRAPHICS, run)
  const res = await runScript(script, session, { timeoutMs: 10_000 })
  await refreshAfterScript('d')
  assert.ok(res.ok, res.error)
  return res.returned
}

test('a script reads the edges after the app reconnected', async () => {
  engine.connect()
  assert.equal(await runAsAssistant(BUILD + READ), 12)
  engine.connect() // the app's settings again
  assert.equal(await runAsAssistant(BUILD + READ), 12)
})

test('a script reads the edges after another participant set its own settings', async () => {
  engine.connect()
  await runAsAssistant(BUILD)
  assert.equal(await runAsAssistant(READ), 12)
  engine.foreign(APP_SETTINGS) // leaves the store as it was: only the settings read tells
  assert.equal(await runAsAssistant(READ), 12)
  assert.equal(engine.settings.doCurveTessellation, 1)
})

test('a model the app built under its own settings is read with its edges', async () => {
  engine.connect()
  await createApi('d').v1.part.box({})
  assert.ok(Object.values(getDrawing('d').graphic.containers).every(c => !c.edges), 'the app made it without edges')
  assert.equal(await runAsAssistant(READ), 12)
})

test('settings in place cost one read: nothing set, nothing pulled', async () => {
  engine.connect()
  const session = browserSession('d')
  await session.getGraphic()
  assert.deepEqual(engine.log, ['getDatabaseSettings', 'setDatabaseSettings', 'GetTree'], 'the app\'s settings put back')
  engine.log = []
  await createApi('d').v1.part.box({}) // the app's command: its graphic comes under these settings
  const graphic = await session.getGraphic()
  assert.deepEqual(engine.log, ['getDatabaseSettings'])
  assert.equal(graphic.containers[0].edges.length, 12)
})
