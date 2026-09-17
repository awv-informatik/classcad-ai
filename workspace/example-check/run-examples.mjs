// Runs every extracted skill Working Example against the ClassCAD worker.
// Usage: node workspace/example-check/run-examples.mjs <batch-dir> <out.json>
// Each example runs in a cleared drawing with strict api (maxLevel >= 51 throws).
// A disconnect marks the example CRASH; the worker is restarted and the run continues.
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { connectSession, buildScriptApi } from '@classcad/script/node'
import registry from '@classcad/skill/method-registry.json' with { type: 'json' }

const [batchDir, outFile] = process.argv.slice(2)
const RESTART = '/private/tmp/claude-501/-Users-dev-dev-awv-classcad/a1557866-6caa-45dd-be30-58eb0681332f/scratchpad/worker/kill-restart.sh'
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`TIMEOUT ${ms}ms`)), ms))])

const items = readdirSync(batchDir).filter(f => f.endsWith('.json')).sort().flatMap(f => JSON.parse(readFileSync(join(batchDir, f), 'utf8')))
const results = {}
let session = await connectSession(undefined, {})
let api = buildScriptApi(session, { registry, strict: true })

for (const { key, code } of items) {
  let status = 'PASS', error = null
  try {
    await withTimeout(api.v1.common.clear(), 10000)
    await withTimeout(new AsyncFunction('api', code)(api), 30000)
  } catch (e) {
    const msg = String(e?.message ?? e)
    status = /disconnected|ECONNREFUSED|socket|closed/i.test(msg) ? 'CRASH' : /TIMEOUT/.test(msg) ? 'TIMEOUT' : 'FAIL'
    error = msg.replace(/\s+/g, ' ').slice(0, 220)
  }
  if (status === 'CRASH' || status === 'TIMEOUT') {
    try { await session.close?.() } catch {}
    execSync(`bash ${RESTART}`, { stdio: 'ignore' })
    session = await connectSession(undefined, {})
    api = buildScriptApi(session, { registry, strict: true })
  }
  results[key] = error ? { status, error } : { status }
  process.stdout.write(`${status.padEnd(7)} ${key}${error ? '  — ' + error.slice(0, 120) : ''}\n`)
}
try { await api.v1.common.clear() } catch {}
try { await session.close?.() } catch {}
writeFileSync(outFile, JSON.stringify(results, null, 2))
const counts = Object.values(results).reduce((a, r) => ((a[r.status] = (a[r.status] || 0) + 1), a), {})
console.log('\nSUMMARY', JSON.stringify(counts))
process.exit(0)
