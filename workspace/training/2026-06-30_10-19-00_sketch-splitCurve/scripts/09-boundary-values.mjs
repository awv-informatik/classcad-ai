// 09 — boundary values [0], [1], [0,1]: no-op vs degenerate zero-length vs error.
// One part, one sketch, a fresh line per case (regime D).
import { makeSketch, line, positions, summarizeSplit, firstError, vecApprox } from './_setup.mjs'

async function probe(api, skId, y, values, filewrite, tag) {
  const l = await line(api, skId, [0, y, 0], [100, y, 0])
  const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: l, values }] })
  const isArr = Array.isArray(r.result)
  const segs = isArr ? r.result[0].splittedCurves : []
  // detect degenerate zero-length intervals
  const degen = []
  for (const s of segs) {
    const w = s.interval[1] - s.interval[0]
    if (Math.abs(w) < 1e-9) {
      const p = await positions(api, s.id)
      degen.push({ id: s.id, interval: s.interval, startEqEnd: vecApprox(p.startPos, p.endPos) })
    }
  }
  filewrite({ values, result: r.result, messages: r.messages, maxLevel: r.maxLevel }, `09-${tag}`)
  console.log(`[09] values=${JSON.stringify(values)}`, JSON.stringify(summarizeSplit(r)),
    isArr ? `degenerate=${JSON.stringify(degen)}` : `err=${JSON.stringify(firstError(r))}`)
  return { values, isArr, maxLevel: r.maxLevel, nSegs: segs.length, intervals: segs.map(s => s.interval), degen }
}

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const out = []
  out.push(await probe(api, skId, 0, [0], filewrite, 'v0'))
  out.push(await probe(api, skId, 10, [1], filewrite, 'v1'))
  out.push(await probe(api, skId, 20, [0, 1], filewrite, 'v01'))
  return { out }
}
