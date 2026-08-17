// 01 — REPRO (💀 hang): part.extrusion on a construction-ONLY profile. 8s JS timeout converts the hang into a
// visible HUNG result. Worker stays wedged server-side afterwards → restart before the next step.
import { makeSketch } from './_setup.mjs'
import { withTimeout } from './_timeout.mjs'

export default async function (api, { filewrite }) {
  const { partId, skId } = await makeSketch(api, { name: 'ReproExtrude' })
  const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [40, 40, 0], isConstruction: true })).result
  console.log('[01] construction rect', JSON.stringify(rect), '— calling part.extrusion (8s timeout)...')
  const res = await withTimeout(api.v1.part.extrusion({ id: partId, references: rect, limit2: 25 }), 8000, 'part.extrusion')
  const out = res.hung
    ? { verdict: 'HUNG', note: `part.extrusion did not return within ${res.ms}ms` }
    : { verdict: 'RETURNED', result: res.r?.result ?? null, maxLevel: res.r?.maxLevel, msgs: (res.r?.messages || []).map(m => ({ level: m.level, code: m.code, message: m.message?.slice(0, 120) })) }
  filewrite(out, '01-repro-extrusion')
  console.log('[01] VERDICT', out.verdict, JSON.stringify(out))
  return out
}
