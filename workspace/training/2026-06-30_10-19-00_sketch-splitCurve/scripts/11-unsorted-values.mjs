// 11 — unsorted values [0.75,0.25]: internal sort (intervals [0,0.25],[0.25,0.75],[0.75,1]) vs input order?
import { makeSketch, line, positions, summarizeSplit, vecApprox } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const l = await line(api, skId, [0, 0, 0], [100, 0, 0])

  const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: l, values: [0.75, 0.25] }] })
  const segs = r.result[0].splittedCurves
  const pos = []
  for (const s of segs) pos.push({ interval: s.interval, ...(await positions(api, s.id)) })
  filewrite({ result: r.result, pos }, '11-result')
  console.log('[11]', JSON.stringify(summarizeSplit(r)))
  for (const p of pos) console.log('[11] seg', JSON.stringify(p.interval), JSON.stringify(p.startPos), '->', JSON.stringify(p.endPos))

  const ivs = segs.map(s => s.interval)
  const ascending = ivs.every((iv, i) => i === 0 || iv[0] >= ivs[i - 1][0])
  const checks = {
    threeSegments: segs.length === 3,
    sortedAscending: ascending,
    contiguousFrom0to1: ivs[0][0] === 0 && ivs[ivs.length - 1][1] === 1,
    cutsAt25and75: vecApprox(pos[0].endPos, [25, 0, 0]) && vecApprox(pos[1].endPos, [75, 0, 0]),
  }
  console.log('[11] CHECKS', JSON.stringify(checks))
  console.log('[11]', Object.values(checks).every(Boolean) ? 'PASS (sorted)' : 'NOTE: not sorted / see data')
  return { checks, intervals: ivs }
}
