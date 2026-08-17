// 04 — characterize sketch.copyFrom({ id: DEST, toCopyId: SRC }). Verify: merges (not replaces), copies
// constraints (no flag), no offset (same positions), self-copy duplicates, empty no-op, return VOID, errors.
import { makeSketch, addSketch, line, circle, positions } from './_setup.mjs'

const sum = (r, label) => ({
  label, result: r?.result ?? null,
  resultType: Array.isArray(r?.result) ? `id[${r.result.length}]` : (r?.result == null ? 'null/VOID' : typeof r.result),
  maxLevel: r?.maxLevel, hasStructure: !!r?.structure,
  msgs: (r?.messages || []).map(m => ({ level: m.level, code: m.code, message: m.message })),
})
const census = tree => {
  const c = {}
  for (const n of Object.values(tree || {})) {
    const cls = n.class || ''
    if (/^CC_(Line|Circle|Arc|Point)$/.test(cls) || /Constraint|RadiusConstraint|Distance/i.test(cls)) c[cls] = (c[cls] || 0) + 1
  }
  return c
}
const counts = g => ({ lines: g.lines.length, circles: (g.circles || []).length, arcs: (g.arcs || []).length, points: (g.points || []).length })

export default async function (api, { filewrite }) {
  const out = {}
  const { partId, skId: src, planeId } = await makeSketch(api, { name: 'CopyFrom' })
  // SOURCE: rectangle + circle + a RADIUS dimension (a constraint we can track by class)
  await api.v1.sketch.rectangle({ id: src, startPos: [0, 0, 0], endPos: [40, 30, 0] })
  const srcCircle = (await api.v1.sketch.circle({ id: src, centerPos: [60, 15, 0], radius: 10 })).result
  await api.v1.sketch.dimension({ id: src, type: 'RADIUS', geomIds: [srcCircle], value: 10 })

  // DEST: starts with one line (to prove MERGE, not replace). Capture its structure as the "before" tree.
  const dst = await addSketch(api, partId, planeId, 'DST')
  const dstLineResp = await api.v1.sketch.line({ id: dst, startPos: [0, 50, 0], endPos: [10, 50, 0] })
  const beforeTree = census(dstLineResp?.structure?.tree)
  const dstBefore = counts((await api.v1.sketch.getGeometry({ id: dst })).result)

  // ---- basic copy src -> dst ----
  const rCopy = await api.v1.sketch.copyFrom({ id: dst, toCopyId: src })
  out.copy = sum(rCopy, 'copyFrom src->dst')
  const afterTree = census(rCopy?.structure?.tree)
  const dstAfter = counts((await api.v1.sketch.getGeometry({ id: dst })).result)
  out.merge = { dstBefore, dstAfter, note: 'dst kept its 1 line AND gained src rect(4 lines)+circle' }
  out.constraintCensus = { beforeTree, afterTree }

  // ---- no-offset: read the copied circle's center in dst, compare to src [60,15] ----
  const dstGeo = (await api.v1.sketch.getGeometry({ id: dst })).result
  const centers = []
  for (const cid of dstGeo.circles || []) { const p = (await api.v1.sketch.getPoints({ id: cid })).result; if (p?.centerId) centers.push((await positions(api, p.centerId)).pos) }
  out.noOffset = { copiedCircleCenters: centers, srcCircleCenter: [60, 15, 0] }

  // ---- self-copy: dst -> dst duplicates ----
  const selfBefore = counts((await api.v1.sketch.getGeometry({ id: dst })).result)
  const rSelf = await api.v1.sketch.copyFrom({ id: dst, toCopyId: dst })
  const selfAfter = counts((await api.v1.sketch.getGeometry({ id: dst })).result)
  out.selfCopy = { ...sum(rSelf, 'self-copy dst->dst'), selfBefore, selfAfter }

  // ---- empty source no-op ----
  const emptySk = await addSketch(api, partId, planeId, 'EMPTY')
  const dst2 = await addSketch(api, partId, planeId, 'DST2')
  await api.v1.sketch.line({ id: dst2, startPos: [0, 0, 0], endPos: [5, 0, 0] })
  const d2Before = counts((await api.v1.sketch.getGeometry({ id: dst2 })).result)
  const rEmpty = await api.v1.sketch.copyFrom({ id: dst2, toCopyId: emptySk })
  const d2After = counts((await api.v1.sketch.getGeometry({ id: dst2 })).result)
  out.emptySource = { ...sum(rEmpty, 'copy empty->dst2'), d2Before, d2After }

  // ---- errors ----
  out.errPartAsDest = sum(await api.v1.sketch.copyFrom({ id: partId, toCopyId: src }), 'err: part id as dest')
  out.errBadSource = sum(await api.v1.sketch.copyFrom({ id: dst, toCopyId: 999999 }), 'err: invalid toCopyId')

  filewrite(out, '04-copyFrom')
  console.log('[04] copy', JSON.stringify(out.copy))
  console.log('[04] merge dstBefore', JSON.stringify(dstBefore), '-> dstAfter', JSON.stringify(dstAfter))
  console.log('[04] census before', JSON.stringify(beforeTree), '\n[04] census after ', JSON.stringify(afterTree))
  console.log('[04] noOffset copiedCenters', JSON.stringify(centers))
  console.log('[04] selfCopy', JSON.stringify(out.selfCopy.selfBefore), '->', JSON.stringify(out.selfCopy.selfAfter))
  console.log('[04] emptySource', JSON.stringify(out.emptySource.d2Before), '->', JSON.stringify(out.emptySource.d2After), 'result', out.emptySource.result, 'max', out.emptySource.maxLevel)
  console.log('[04] errPartAsDest', JSON.stringify(out.errPartAsDest.msgs))
  console.log('[04] errBadSource', JSON.stringify(out.errBadSource.msgs))
  return { ok: true }
}
