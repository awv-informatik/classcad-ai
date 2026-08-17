// 07 — postTrim {id}-only error map: missing 1004, non-existent 1006, wrong-type 1001 ['sketch']; result VOID;
// staging UNTOUCHED after a mid-workflow error (resumable).
import { makeSketch, addSketch, line, positions, containers, firstError, vecApprox } from './_setup.mjs'

const lastErr = r => { const e = firstError(r); return e[e.length - 1] || {} }
const typeList = r => { const m = (firstError(r) || []).map(e => e.message).join(' '); const mt = m.match(/\[("[^"]+"(?:,\s*"[^"]+")*)\]/); return mt ? mt[0] : null }

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)
  const L = await line(api, skId, [0, 50, 0], [100, 50, 0])
  const pointId = (await api.v1.sketch.getPoints({ id: L })).result?.startId

  async function probe(label, param) {
    const r = await api.v1.sketch.postTrim(param)
    const e = lastErr(r)
    const row = { label, maxLevel: r.maxLevel, isVoid: r.result === null, code: e.code, list: typeList(r), msg: e.message }
    console.log('[07]', JSON.stringify(row))
    return row
  }
  const out = []
  out.push(await probe('missing', {}))
  out.push(await probe('badId', { id: 999999 }))
  out.push(await probe('partId', { id: partId }))
  out.push(await probe('pointId', { id: pointId }))
  out.push(await probe('lineId', { id: L }))

  // mid-workflow error: stage a sketch, bad postTrim, staging untouched, then correct postTrim finalizes
  const skB = await addSketch(api, partId, planeId, 'B')
  const hB = await line(api, skB, [0, 50, 0], [100, 50, 0]); await line(api, skB, [50, 0, 0], [50, 100, 0])
  const pre = await api.v1.sketch.preTrim({ id: skB })
  const seg = await (async () => { for (const s of pre.result.find(e => e.sourceId === hB).splittedCurves) { const p = await positions(api, s.id); if (vecApprox(p.startPos, [0, 50, 0], 1e-6)) return s.id } })()
  await api.v1.sketch.trim({ id: skB, curveIds: [seg] })
  const scBefore = containers((await api.v1.sketch.getGeometry({ id: skB })).structure?.tree).find(c => c.name === 'SplittedCurves')?.childCount
  await api.v1.sketch.postTrim({ id: pointId }) // BAD postTrim mid-workflow
  const scAfter = containers((await api.v1.sketch.getGeometry({ id: skB })).structure?.tree).find(c => c.name === 'SplittedCurves')?.childCount
  const rFix = await api.v1.sketch.postTrim({ id: skB }) // correct finalize
  const geoB = (await api.v1.sketch.getGeometry({ id: skB })).result
  filewrite({ out, scBefore, scAfter, fixMax: rFix.maxLevel, geoBlines: geoB.lines.length }, '07-errors')
  console.log('[07] mid-workflow: SplittedCurves childCount before bad postTrim', scBefore, 'after', scAfter, '| corrective postTrim max', rFix.maxLevel, 'final lines', geoB.lines.length)

  const checks = {
    missing1004: out[0].code === 1004 && out[0].isVoid,
    badId1006: out[1].code === 1006 && out[1].isVoid,
    wrongTypeSketchList: out[2].list === '["sketch"]' && out[3].list === '["sketch"]' && out[4].list === '["sketch"]',
    allVoid: out.every(o => o.isVoid && o.maxLevel >= 51),
    stagingUntouched: scBefore === scAfter,
    resumable: rFix.maxLevel <= 31,
  }
  console.log('[07] CHECKS', JSON.stringify(checks))
  console.log('[07]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
