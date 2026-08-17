// 09 — (A) postTrim recreates constraints (Auto_Coinc at corner, Auto_H/V new ids);
// (B) contiguous surviving segments of one source COALESCE into one curve.
import { makeSketch, addSketch, line, positions, vecApprox } from './_setup.mjs'

const consByName = tree => Object.values(tree || {}).filter(n => /Constraint/.test(n.class || '')).map(n => ({ id: n.id, name: n.name, class: n.class }))
async function segTouching(api, entry, point) {
  for (const s of entry.splittedCurves) { const p = await positions(api, s.id); if (vecApprox(p.startPos, point, 1e-6) || vecApprox(p.endPos, point, 1e-6)) return s.id }
  return null
}

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)

  // A: L-trim, observe constraints before/after
  const h = await line(api, skId, [0, 50, 0], [100, 50, 0])
  const v = await line(api, skId, [50, 0, 0], [50, 100, 0])
  const consBefore = consByName((await api.v1.sketch.getGeometry({ id: skId })).structure?.tree)
  const pre = await api.v1.sketch.preTrim({ id: skId })
  const leftH = await segTouching(api, pre.result.find(e => e.sourceId === h), [0, 50, 0])
  const botV = await segTouching(api, pre.result.find(e => e.sourceId === v), [50, 0, 0])
  await api.v1.sketch.trim({ id: skId, curveIds: [leftH, botV] })
  const rPost = await api.v1.sketch.postTrim({ id: skId })
  const consAfter = consByName(rPost.structure?.tree)
  const autoCoinc = consAfter.find(c => /Coinc/i.test(c.name || '') || c.class === 'CC_2DCoincidentConstraint')
  filewrite({ consBefore, consAfter, autoCoinc }, '09A-constraints')
  console.log('[09] A consBefore', JSON.stringify(consBefore.map(c => c.name)))
  console.log('[09] A consAfter ', JSON.stringify(consAfter.map(c => c.name + ':' + c.class)))
  console.log('[09] A Auto_Coinc at corner?', JSON.stringify(autoCoinc))

  // B: one line crossed by 2 verticals -> 3 segs; trim LEFT seg; middle+right should coalesce into ONE line
  const skB = await addSketch(api, partId, planeId, 'B')
  const lng = await line(api, skB, [0, 50, 0], [120, 50, 0])
  await line(api, skB, [40, 0, 0], [40, 100, 0])
  await line(api, skB, [80, 0, 0], [80, 100, 0])
  const preB2 = await api.v1.sketch.preTrim({ id: skB }) // all curves: verticals cut lng at x=40,80
  const lngE = preB2.result.find(e => e.sourceId === lng)
  const leftSeg = await segTouching(api, lngE, [0, 50, 0])
  await api.v1.sketch.trim({ id: skB, curveIds: [leftSeg] })
  await api.v1.sketch.postTrim({ id: skB })
  const geoB = (await api.v1.sketch.getGeometry({ id: skB })).result
  // find the survivor that came from lng: a horizontal line spanning x=40..120 at y=50
  const survivors = []
  for (const id of geoB.lines) { const p = await positions(api, id); survivors.push({ id, start: p.startPos, end: p.endPos }) }
  const coalesced = survivors.filter(s => vecApprox(s.start, [40, 50, 0]) && vecApprox(s.end, [120, 50, 0]) || vecApprox(s.start, [120, 50, 0]) && vecApprox(s.end, [40, 50, 0]))
  filewrite({ lngSegs: lngE.splittedCurves.length, survivors, coalesced }, '09B-coalesce')
  console.log('[09] B lng split into', lngE.splittedCurves.length, 'segs; survivors', JSON.stringify(survivors))
  console.log('[09] B coalesced (40,50)->(120,50) as ONE line?', coalesced.length === 1, JSON.stringify(coalesced))

  const checks = {
    A_hasAutoCoinc: !!autoCoinc,
    A_constraintsRecreated: consAfter.length >= consBefore.length,
    B_lngThreeSegs: lngE.splittedCurves.length === 3,
    B_coalescedToOne: coalesced.length === 1,
  }
  console.log('[09] CHECKS', JSON.stringify(checks))
  console.log('[09]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
