// 01 — REPRO (💀 hang): part.revolve on a construction-ONLY profile (a real axis line). revolve routes through the
// same OperationsHelper.UpdateRegion as extrusion, so it should hang identically. 8s JS timeout. Restart after.
import { makeSketch } from './_setup.mjs'
import { withTimeout } from './_timeout.mjs'

export default async function (api, { filewrite }) {
  const { partId, skId } = await makeSketch(api, { name: 'ReproRevolve' })
  const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [40, 40, 0], isConstruction: true })).result
  const axis = (await api.v1.sketch.line({ id: skId, startPos: [-15, 0, 0], endPos: [-15, 40, 0] })).result   // normal axis line
  console.log('[01] construction rect', JSON.stringify(rect), 'axis', axis, '— calling part.revolve (8s timeout)...')
  const res = await withTimeout(api.v1.part.revolve({ id: partId, references: rect, axisIds: [axis] }), 8000, 'part.revolve')
  const out = res.hung
    ? { verdict: 'HUNG', note: `part.revolve did not return within ${res.ms}ms` }
    : { verdict: 'RETURNED', result: res.r?.result ?? null, maxLevel: res.r?.maxLevel, msgs: (res.r?.messages || []).map(m => ({ level: m.level, code: m.code, message: m.message?.slice(0, 120) })) }
  filewrite(out, '01-repro-revolve')
  console.log('[01] VERDICT', out.verdict, JSON.stringify(out))
  return out
}
