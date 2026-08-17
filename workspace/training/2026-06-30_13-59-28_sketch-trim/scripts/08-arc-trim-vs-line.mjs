// 08 — trim accepts a CIRCLE arc segment like a line segment; survivor arc gets a new id; arc dies immediately.
import { makeSketch, line, circle, positions, vecApprox } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  const C = await circle(api, skId, [50, 50, 0], 40)
  const L = await line(api, skId, [0, 50, 0], [100, 50, 0]) // cuts C at (10,50) and (90,50)
  const pre = await api.v1.sketch.preTrim({ id: skId })
  const circE = pre.result.find(e => e.sourceId === C)

  // both arcs accept getPositions; classify by midpoint y
  const arcs = []
  for (const s of circE.splittedCurves) {
    const p = await positions(api, s.id)
    // arc midpoint: sample — use endpoints to find which side; the arc through (50,90) is top, (50,10) bottom
    arcs.push({ id: s.id, max: p.maxLevel, start: p.startPos, end: p.endPos })
  }
  console.log('[08] circle arcs', circE.splittedCurves.length, 'getPositions maxLevels', JSON.stringify(arcs.map(a => a.max)))
  for (const a of arcs) console.log('[08]   arc', a.id, JSON.stringify(a.start), '->', JSON.stringify(a.end))

  // trim the FIRST arc; check VOID + immediate death + survivor
  const bottom = arcs[0]
  const rTrim = await api.v1.sketch.trim({ id: skId, curveIds: [bottom.id] })
  const arcAfterMax = (await positions(api, bottom.id)).maxLevel
  console.log('[08] trim(arc) result', JSON.stringify(rTrim.result), 'max', rTrim.maxLevel, '| arc dead immediately?', arcAfterMax >= 51)

  await api.v1.sketch.postTrim({ id: skId })
  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  const survArcs = []
  for (const id of geo.arcs || []) { const p = await positions(api, id); survArcs.push({ id, start: p.startPos, end: p.endPos }) }
  filewrite({ arcs, trimArcMax: rTrim.maxLevel, arcAfterMax, geo, survArcs }, '08-arc')
  console.log('[08] survivor arcs', JSON.stringify(geo.arcs), JSON.stringify(survArcs))

  const onCut = v => vecApprox(v, [10, 50, 0], 1e-4) || vecApprox(v, [90, 50, 0], 1e-4)
  const checks = {
    arcsQueryable: arcs.every(a => a.max <= 31),
    trimArcVoid: rTrim.result === null && rTrim.maxLevel <= 31,
    arcDiedImmediately: arcAfterMax >= 51,
    oneSurvivorArc: (geo.arcs || []).length === 1,
    survivorEndpointsOnCuts: survArcs.length === 1 && onCut(survArcs[0].start) && onCut(survArcs[0].end),
    survivorNewId: survArcs.length === 1 && survArcs[0].id !== bottom.id && survArcs[0].id !== C,
  }
  console.log('[08] CHECKS', JSON.stringify(checks))
  console.log('[08]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
