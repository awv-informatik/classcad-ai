// 12 — out-of-range [-0.2], [1.5], mixed [0.5,1.5]: clamp / extrapolate / error / drop / atomic-fail?
// ERROR-case: run individually. Each case on its own fresh line (one part).
import { makeSketch, line, positions, summarizeSplit, firstError } from './_setup.mjs'

async function probe(api, skId, y, values, filewrite, tag) {
  const l = await line(api, skId, [0, y, 0], [100, y, 0])
  const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: l, values }] })
  const isArr = Array.isArray(r.result)
  const segs = isArr ? r.result[0].splittedCurves : []
  // for any produced segment, read endpoints to detect extrapolation (vertex outside [0,100] in x)
  const verts = []
  for (const s of segs) {
    const p = await positions(api, s.id)
    verts.push({ interval: s.interval, startPos: p.startPos, endPos: p.endPos })
  }
  filewrite({ values, result: r.result, messages: r.messages, maxLevel: r.maxLevel, verts }, `12-${tag}`)
  console.log(`[12] values=${JSON.stringify(values)}`, JSON.stringify(summarizeSplit(r)),
    isArr ? `verts=${JSON.stringify(verts.map(v => v.endPos))}` : `err=${JSON.stringify(firstError(r))}`)
  // classify
  let verdict = 'unknown'
  if (!isArr) verdict = `error(${r.maxLevel})`
  else {
    const xs = verts.flatMap(v => [v.startPos?.[0], v.endPos?.[0]]).filter(x => x != null)
    const outside = xs.some(x => x < -1e-6 || x > 100 + 1e-6)
    verdict = outside ? 'EXTRAPOLATE (vertex outside source!)' : (segs.length === 1 ? 'drop/no-op' : `produced ${segs.length} segs in-range (clamp?)`)
  }
  console.log(`[12] ${tag} verdict:`, verdict)
  return { values, isArr, maxLevel: r.maxLevel, nSegs: segs.length, verdict }
}

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const out = []
  out.push(await probe(api, skId, 0, [-0.2], filewrite, 'neg'))
  out.push(await probe(api, skId, 10, [1.5], filewrite, 'over'))
  out.push(await probe(api, skId, 20, [0.5, 1.5], filewrite, 'mixed'))
  return { out }
}
