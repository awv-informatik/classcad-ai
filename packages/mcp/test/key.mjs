// The local engine's key from the backend (src/engine/key.ts), against stand-ins for Firebase and
// the key service: sign-in required, fetched and kept, renewed ahead, kept through an outage,
// refusals final, CLASSCAD_TOKEN for CI, the plan's export formats, gone with the sign-out.
import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { createServer } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fakeAuth } from './fake-auth.mjs'

const auth = await fakeAuth()
const keyFile = join(mkdtempSync(join(tmpdir(), 'classcad-key-')), 'engine-key.json')
let mode = 'ok'
let plan = { plan: 'free', exportFormats: ['stl'] }
let exp = () => Date.now() + 90 * 24 * 3600 * 1000
const seen = []
let unconfirmed = null
const service = createServer((req, res) => {
  let body = ''
  req.on('data', c => (body += c))
  req.on('end', () => {
    seen.push({ authorization: req.headers.authorization, body: JSON.parse(body || '{}') })
    res.setHeader('content-type', 'application/json')
    if (mode === 'down') {
      res.statusCode = 503
      return res.end(JSON.stringify({ code: 'unavailable', message: 'down' }))
    }
    // Refuses the sign-in it saw first as unconfirmed; a fresh one passes
    if (mode === 'unverified' && (!unconfirmed || unconfirmed === req.headers.authorization)) {
      unconfirmed = req.headers.authorization
      res.statusCode = 403
      return res.end(JSON.stringify({ code: 'email_not_verified', message: 'Confirm your email address first.' }))
    }
    if (mode === 'refuse') {
      res.statusCode = 403
      return res.end(JSON.stringify({ code: 'native_not_in_plan', message: 'refused by plan' }))
    }
    res.end(JSON.stringify({ key: `KEY${seen.length}`, exp: exp(), ...plan }))
  })
})
await new Promise(r => service.listen(0, '127.0.0.1', r))
service.unref()

Object.assign(process.env, auth.env, {
  CLASSCAD_KEY_URL: `http://127.0.0.1:${service.address().port}/api/v1/key`,
  CLASSCAD_KEY_FILE: keyFile,
})
delete process.env.CLASSCAD_WASM_KEY
delete process.env.CLASSCAD_TOKEN
const { engineKey, exportAllowed, KeyRefused } = await import('../dist/engine/key.js')
const { logout } = await import('../dist/auth.js')

test('a signed-in machine gets a key with its sign-in, and keeps it', async () => {
  const k = await engineKey('test')
  assert.equal(k.key, 'KEY1')
  assert.equal(k.plan, 'free')
  assert.match(seen[0].authorization, /^Bearer [^.]+\.[^.]+\./, 'the Firebase ID token goes along')
  assert.deepEqual(seen[0].body, { appType: 'wasm', client: 'test' })
  assert.equal((await engineKey('test')).key, 'KEY1')
  assert.equal(seen.length, 1, 'kept, not fetched again')
})

test("the plan's export formats: Free exports STL (and GLB), not STEP, OFB or JSON", () => {
  assert.equal(exportAllowed('STL').ok, true)
  assert.equal(exportAllowed('GLB').ok, true)
  for (const f of ['STP', 'OFB', 'JSON']) {
    const r = exportAllowed(f)
    assert.equal(r.ok, false, f)
    assert.match(r.message, /classcad\.ch\/subscriptions/)
  }
})

test('a key near its end is used and renewed for the next start', async () => {
  const kept = JSON.parse(readFileSync(keyFile, 'utf8'))
  writeFileSync(keyFile, JSON.stringify({ ...kept, iat: Date.now() - 80 * 24 * 3600 * 1000, exp: Date.now() + 3600 * 1000 }))
  plan = { plan: 'solo', exportFormats: ['stl', 'step', 'ofb'] }
  assert.equal((await engineKey()).key, 'KEY1')
  await new Promise(r => setTimeout(r, 300))
  assert.equal(JSON.parse(readFileSync(keyFile, 'utf8')).key, 'KEY2')
  assert.equal(exportAllowed('STP').ok, true, 'Solo exports STEP')
})

test('while the key service is down, a kept key that has not expired starts the engine', async () => {
  const kept = JSON.parse(readFileSync(keyFile, 'utf8'))
  writeFileSync(keyFile, JSON.stringify({ ...kept, exp: Date.now() + 30 * 1000 }))
  mode = 'down'
  assert.equal((await engineKey()).key, 'KEY2')
})

test('a sign-in kept from before the address was confirmed is renewed for the key', async () => {
  writeFileSync(keyFile, '{}')
  mode = 'unverified'
  const before = seen.length
  assert.ok((await engineKey()).key)
  const asked = seen.slice(before)
  assert.equal(asked.length, 2, 'refused once, then asked again')
  assert.notEqual(asked[0].authorization, asked[1].authorization, 'with a fresh sign-in')
  mode = 'ok'
})

test('a refusal is final', async () => {
  writeFileSync(keyFile, '{}')
  mode = 'refuse'
  await assert.rejects(engineKey(), e => e instanceof KeyRefused && /refused by plan/.test(e.message))
})

test('on CI a secret token stands in for the sign-in', async () => {
  mode = 'ok'
  process.env.CLASSCAD_TOKEN = 'ccsk_ci'
  try {
    await engineKey()
    assert.equal(seen.at(-1).authorization, 'Bearer ccsk_ci')
  } finally {
    delete process.env.CLASSCAD_TOKEN
  }
})

test('signing out forgets the key; without a sign-in there is none', async () => {
  await engineKey()
  assert.ok(existsSync(keyFile))
  logout()
  assert.equal(existsSync(keyFile), false)
  await assert.rejects(engineKey(), e => e instanceof KeyRefused && /Sign-in required/.test(e.message))
})
