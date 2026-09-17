// Non-strict probe runner: node workspace/example-check/probe.mjs <file.js>
// The file body runs as an async function (api, show); show(label, result) records result + message codes.
import { readFileSync } from 'fs'
import { connectSession, buildScriptApi } from '@classcad/script/node'
import registry from '@classcad/skill/method-registry.json' with { type: 'json' }
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const session = await connectSession(undefined, {})
const api = buildScriptApi(session, { registry, strict: false })
const out = {}
const show = (label, r) => { out[label] = r && typeof r === 'object' && 'maxLevel' in r
  ? { result: r.result, maxLevel: r.maxLevel, msgs: (r.messages ?? []).map(m => `${m.code}: ${String(m.message).slice(0, 110)}`) } : r; return r }
try { await new AsyncFunction('api', 'show', readFileSync(process.argv[2], 'utf8'))(api, show) } catch (e) { out.__error = String(e?.message ?? e).slice(0, 300) }
try { await api.v1.common.clear() } catch {}
console.log(JSON.stringify(out, null, 1))
try { await session.close?.() } catch {}
process.exit(0)
