// 01 — characterize sketch.copyGeometry. Verify every claim in the existing doc against live behavior.
// API: copyGeometry({ id, geomIds, translation, doCopyConstraints=TRUE }) -> { result: id[]|VOID, messages?, maxLevel }
import { makeSketch, addSketch, line, circle, positions } from './_setup.mjs'

const sum = (r, label) => ({
  label,
  result: r?.result ?? null,
  resultType: Array.isArray(r?.result) ? `id[${r.result.length}]` : (r?.result === null || r?.result === undefined ? 'null/VOID' : typeof r.result),
  maxLevel: r?.maxLevel,
  msgs: (r?.messages || []).map(m => ({ level: m.level, code: m.code, message: m.message })),
})

export default async function (api, { filewrite }) {
  const out = []
  const { partId, skId, planeId } = await makeSketch(api, { name: 'CopyGeom' })

  // ---- A: basic copy, doCopyConstraints omitted (default TRUE). Is result really null? Does geometry appear? ----
  const l1 = await line(api, skId, [0, 0, 0], [40, 0, 0])
  const before = (await api.v1.sketch.getGeometry({ id: skId })).result
  const rA = await api.v1.sketch.copyGeometry({ id: skId, geomIds: [l1], translation: [0, 30, 0] })
  const afterA = (await api.v1.sketch.getGeometry({ id: skId })).result
  out.push({ ...sum(rA, 'A default(true): copy 1 line +[0,30,0]'), linesBefore: before.lines.length, linesAfter: afterA.lines.length })

  // ---- B: doCopyConstraints:false. Is result id[]? ----
  const rB = await api.v1.sketch.copyGeometry({ id: skId, geomIds: [l1], translation: [0, 60, 0], doCopyConstraints: false })
  out.push(sum(rB, 'B false: copy 1 line +[0,60,0]'))

  // ---- C: translation omitted → error 1004? ----
  const rC = await api.v1.sketch.copyGeometry({ id: skId, geomIds: [l1] })
  out.push(sum(rC, 'C: translation omitted'))

  // ---- D: empty geomIds ----
  const rD = await api.v1.sketch.copyGeometry({ id: skId, geomIds: [], translation: [0, 10, 0] })
  out.push(sum(rD, 'D: empty geomIds'))

  // ---- E: invalid id ----
  const rE = await api.v1.sketch.copyGeometry({ id: skId, geomIds: [999999], translation: [0, 10, 0] })
  out.push(sum(rE, 'E: invalid id 999999'))

  // ---- F: null in geomIds ----
  const rF = await api.v1.sketch.copyGeometry({ id: skId, geomIds: [l1, null], translation: [0, 10, 0] })
  out.push(sum(rF, 'F: null in geomIds'))

  // ---- G: multi-geom + order. Copy 3 lines with false, check result length/order ----
  const g1 = await line(api, skId, [0, 0, 0], [10, 0, 0])
  const g2 = await line(api, skId, [0, 0, 0], [0, 10, 0])
  const g3 = await circle(api, skId, [5, 5, 0], 3)
  const rG = await api.v1.sketch.copyGeometry({ id: skId, geomIds: [g1, g2, g3], translation: [50, 0, 0], doCopyConstraints: false })
  out.push({ ...sum(rG, 'G false: copy [line,line,circle] +[50,0,0]'), inputs: [g1, g2, g3] })

  // ---- H: copy a circle — does the copy include the child center point? Inspect copied circle's center ----
  const cH = await api.v1.sketch.circle({ id: skId, centerPos: [5, 5, 0], radius: 4 })
  const rH = await api.v1.sketch.copyGeometry({ id: skId, geomIds: [cH.result], translation: [80, 0, 0], doCopyConstraints: false })
  let copiedCenter = null
  if (Array.isArray(rH.result) && rH.result[0]) {
    const pts = (await api.v1.sketch.getPoints({ id: rH.result[0] })).result
    if (pts?.centerId) copiedCenter = (await positions(api, pts.centerId)).pos
  }
  out.push({ ...sum(rH, 'H false: copy 1 circle +[80,0,0]'), copiedCenter, origCenter: [5, 5, 0] })

  // ---- I: constraint carry-over. Fresh sketch: 2 lines + a COINCIDENT + a DIMENSION, copy true vs false,
  //         then count constraint/dimension nodes in the structure tree before/after each. ----
  const sk2 = await addSketch(api, partId, planeId, 'C2')
  const a = (await api.v1.sketch.line({ id: sk2, startPos: [0, 0, 0], endPos: [30, 0, 0] })).result
  const b = (await api.v1.sketch.line({ id: sk2, startPos: [30, 0, 0], endPos: [30, 20, 0] })).result
  await api.v1.sketch.dimension({ id: sk2, type: 'HORIZONTAL_DISTANCE', geomIds: [a], value: 30 })
  const treeBefore = (await api.v1.sketch.getGeometry({ id: sk2 })).result
  const countNodes = (tree) => {
    const vals = Object.values(tree || {})
    return { constraints: vals.filter(n => n.class?.startsWith?.('CC_Constraint') || /Coinc|Tangent|Horizontal|Vertical|Fixation|Dist/i.test(n.class || '')).length }
  }
  const rItrue = await api.v1.sketch.copyGeometry({ id: sk2, geomIds: [a, b], translation: [0, 50, 0] }) // default true
  const rIfalse = await api.v1.sketch.copyGeometry({ id: sk2, geomIds: [a, b], translation: [0, 80, 0], doCopyConstraints: false })
  out.push(sum(rItrue, 'I true: copy 2 constrained lines'))
  out.push(sum(rIfalse, 'I false: copy 2 constrained lines'))

  filewrite(out, '01-probe')
  for (const o of out) console.log(`[${o.label}] result=${JSON.stringify(o.result)} type=${o.resultType} maxLevel=${o.maxLevel}${o.msgs?.length ? ' MSG=' + JSON.stringify(o.msgs) : ''}${o.linesAfter !== undefined ? ` lines ${o.linesBefore}->${o.linesAfter}` : ''}${o.copiedCenter ? ' copiedCenter=' + JSON.stringify(o.copiedCenter) : ''}`)
  return { probes: out.length }
}
