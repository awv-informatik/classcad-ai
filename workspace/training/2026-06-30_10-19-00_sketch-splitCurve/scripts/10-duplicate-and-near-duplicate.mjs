// 10 — duplicate [0.5,0.5] and near-duplicate [0.5, 0.5+1e-10]: dedup (2 segs) vs zero-length/sliver middle (3 segs).
import { makeSketch, line, positions, summarizeSplit, firstError, vecApprox } from './_setup.mjs'

async function probe(api, skId, y, values, filewrite, tag) {
  const l = await line(api, skId, [0, y, 0], [100, y, 0])
  const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: l, values }] })
  const isArr = Array.isArray(r.result)
  const segs = isArr ? r.result[0].splittedCurves : []
  let sliver = null
  for (const s of segs) {
    const w = s.interval[1] - s.interval[0]
    if (Math.abs(w) < 1e-6) {
      const p = await positions(api, s.id)
      sliver = { id: s.id, interval: s.interval, width: w, startEqEnd: vecApprox(p.startPos, p.endPos) }
    }
  }
  filewrite({ values, result: r.result, messages: r.messages, maxLevel: r.maxLevel }, `10-${tag}`)
  console.log(`[10] values=${JSON.stringify(values)}`, JSON.stringify(summarizeSplit(r)),
    isArr ? `sliver=${JSON.stringify(sliver)}` : `err=${JSON.stringify(firstError(r))}`)
  return { values, isArr, nSegs: segs.length, intervals: segs.map(s => s.interval), sliver }
}

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const out = []
  out.push(await probe(api, skId, 0, [0.5, 0.5], filewrite, 'dup'))
  out.push(await probe(api, skId, 10, [0.5, 0.5000000001], filewrite, 'neardup'))
  console.log('[10] dup nSegs', out[0].nSegs, '| neardup nSegs', out[1].nSegs)
  return { out }
}
