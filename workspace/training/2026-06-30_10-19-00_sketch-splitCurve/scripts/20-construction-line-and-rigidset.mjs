// 20 — does splitCurve split a CONSTRUCTION line and a RIGIDSET member (which the trim workflow refuses)?
// And does splitting a rigidSet member leave a dangling reference?
import { makeSketch, line, summarizeSplit, firstError } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)

  // Case A: construction line
  const cl = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [100, 0, 0], isConstruction: true })).result
  const rA = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: cl, values: [0.5] }] })
  const segsA = Array.isArray(rA.result) ? rA.result[0].splittedCurves.length : 0
  console.log('[20] construction-line split:', JSON.stringify(summarizeSplit(rA)), 'err', JSON.stringify(firstError(rA)))

  // Case B: rigidSet member
  const l1 = await line(api, skId, [0, 40, 0], [100, 40, 0])
  const l2 = await line(api, skId, [0, 60, 0], [100, 60, 0])
  const rs = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })).result
  console.log('[20] rigidSet id', rs, 'members', l1, l2)
  const rB = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: l1, values: [0.5] }] })
  const segsB = Array.isArray(rB.result) ? rB.result[0].splittedCurves.length : 0
  console.log('[20] rigidSet-member split:', JSON.stringify(summarizeSplit(rB)), 'err', JSON.stringify(firstError(rB)))

  // dangling check: does the rigidSet node still reference the now-replaced l1 id?
  const struct = (await api.v1.sketch.getGeometry({ id: skId })).result
  const tree = rB.structure?.tree || {}
  const rsNode = tree[rs] || Object.values(tree).find(n => n.id === rs)
  const rsRefs = rsNode ? JSON.stringify(rsNode) : '(rigidSet node not found in returned tree)'
  filewrite({ constructionSegs: segsA, rigidSetSegs: segsB, l1, l2, rs, rsNode, struct }, '20-result')
  console.log('[20] rigidSet node:', rsRefs.slice(0, 400))

  const findings = {
    constructionSplittable: segsA > 1,
    rigidSetMemberSplittable: segsB > 1,
  }
  console.log('[20] FINDINGS', JSON.stringify(findings))
  return { findings }
}
