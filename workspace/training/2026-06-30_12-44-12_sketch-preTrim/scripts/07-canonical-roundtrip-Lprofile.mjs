// 07 — canonical round-trip: cross two lines, trim the two overhangs, postTrim -> clean L.
// Survivors get BRAND-NEW ids. trim/postTrim return VOID, maxLevel 31.
import { makeSketch, line, positions, vecApprox } from './_setup.mjs'

// pick the segment of an entry whose start OR end ~ point
async function segTouching(api, entry, point) {
  for (const s of entry.splittedCurves) {
    const p = await positions(api, s.id)
    if (vecApprox(p.startPos, point, 1e-6) || vecApprox(p.endPos, point, 1e-6)) return { id: s.id, p }
  }
  return null
}

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const h = await line(api, skId, [0, 50, 0], [100, 50, 0])
  const v = await line(api, skId, [50, 0, 0], [50, 100, 0])

  const pre = await api.v1.sketch.preTrim({ id: skId })
  const hE = pre.result.find(e => e.sourceId === h)
  const vE = pre.result.find(e => e.sourceId === v)
  const leftH = await segTouching(api, hE, [0, 50, 0])   // overhang to remove
  const botV = await segTouching(api, vE, [50, 0, 0])     // overhang to remove
  console.log('[07] preTrim h segs', hE.splittedCurves.length, 'v segs', vE.splittedCurves.length, '| trimming', leftH.id, botV.id)

  const rTrim = await api.v1.sketch.trim({ id: skId, curveIds: [leftH.id, botV.id] })
  const rPost = await api.v1.sketch.postTrim({ id: skId })
  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  const survivors = []
  for (const id of geo.lines) { const p = await positions(api, id); survivors.push({ id, start: p.startPos, end: p.endPos }) }
  filewrite({ trimRes: rTrim.result, trimMax: rTrim.maxLevel, postRes: rPost.result, postMax: rPost.maxLevel, geo, survivors, originals: [h, v], trimmed: [leftH.id, botV.id] }, '07-roundtrip')
  console.log('[07] trim result', JSON.stringify(rTrim.result), 'max', rTrim.maxLevel, '| postTrim result', JSON.stringify(rPost.result), 'max', rPost.maxLevel)
  console.log('[07] survivors', JSON.stringify(survivors))

  const hasSeg = (a, b) => survivors.some(s => (vecApprox(s.start, a) && vecApprox(s.end, b)) || (vecApprox(s.start, b) && vecApprox(s.end, a)))
  const checks = {
    trimVoid: rTrim.result === null && rTrim.maxLevel <= 31,
    postVoid: rPost.result === null && rPost.maxLevel <= 31,
    twoSurvivors: geo.lines.length === 2,
    rightHalfH: hasSeg([50, 50, 0], [100, 50, 0]),
    topHalfV: hasSeg([50, 50, 0], [50, 100, 0]),
    survivorsNewIds: geo.lines.every(id => id !== h && id !== v && id !== leftH.id && id !== botV.id),
  }
  console.log('[07] CHECKS', JSON.stringify(checks))
  console.log('[07]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
