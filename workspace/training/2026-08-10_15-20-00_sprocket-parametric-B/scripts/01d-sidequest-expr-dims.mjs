/**
 * 01d — SIDE QUEST: why did the skill claim "@expr.NAME not supported in
 * dimensions"? Hypothesis: the 2026-04-14 tests created their expression with
 * a MALFORMED part.expression call ({id,name,value} instead of toCreate:[...]),
 * which silently no-ops while returning result=1/maxLevel=31 — so every
 * @expr test referenced a NONEXISTENT expression.
 *
 * Arms:
 *  1. reproduce the malformed call on TODAY's server → expect same failure
 *  2. getExpression proves the malformed call created nothing
 *  3. correct form → @expr in dimension() works
 *  4. updateDimension('@expr.X') — does it BIND live (not just evaluate)?
 *  5. linkWithExpression on a dimension id (old claim: no linkable member)
 *  6. ANGLE dim with @expr — unit semantics (radians vs deg)
 */
export default async function (api, { filewrite }) {
  const out = {}
  const partR = await api.v1.part.create({ name: 'SideQuest' })
  const partId = partR.result
  const top = Object.values(partR.structure.tree).find((o) => o.class === 'CC_WorkPlane' && o.name === 'Top').id
  const sk = (await api.v1.sketch.create({ id: partId, planeId: top, name: 'S' })).result

  // --- arm 1+2: malformed expression call (exact 2026-04-14 form)
  const bad = await api.v1.part.expression({ id: partId, name: 'myWidth', value: 40 })
  const get1 = await api.v1.part.getExpression({ id: partId, name: 'myWidth' })
  out.malformedCall = { result: bad.result, maxLevel: bad.maxLevel, getExpression: get1.result, getLevel: get1.maxLevel }
  console.log('[01d] malformed part.expression:', JSON.stringify(out.malformedCall))

  const l1 = (await api.v1.sketch.line({ id: sk, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const pts1 = (await api.v1.sketch.getPoints({ id: l1 })).result
  await api.v1.sketch.constraint({ id: sk, type: 'FIXATION', geomIds: [pts1.startId] })
  const dimBad = await api.v1.sketch.dimension({ id: sk, type: 'OFFSET', geomIds: [l1], value: '@expr.myWidth' })
  const end1 = (await api.v1.sketch.getPositions({ id: pts1.endId })).result
  out.dimOnMissingExpr = { result: dimBad.result, maxLevel: dimBad.maxLevel, msgs: dimBad.messages, endX: end1?.pos?.x }
  console.log('[01d] dim @expr on NONEXISTENT expression:', JSON.stringify(out.dimOnMissingExpr))

  // --- arm 3: correct form, same name
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'myWidth', value: 40 }, { name: 'ang', value: 0.5236 }] })
  const get2 = await api.v1.part.getExpression({ id: partId, name: 'myWidth' })
  const l2 = (await api.v1.sketch.line({ id: sk, startPos: [0, 20, 0], endPos: [80, 20, 0] })).result
  const pts2 = (await api.v1.sketch.getPoints({ id: l2 })).result
  await api.v1.sketch.constraint({ id: sk, type: 'FIXATION', geomIds: [pts2.startId] })
  const dimGood = await api.v1.sketch.dimension({ id: sk, type: 'OFFSET', geomIds: [l2], value: '@expr.myWidth' })
  const end2 = (await api.v1.sketch.getPositions({ id: pts2.endId })).result
  out.dimOnRealExpr = { getExpr: get2.result, result: dimGood.result, maxLevel: dimGood.maxLevel, endX: end2?.pos?.x, bound: Math.abs((end2?.pos?.x ?? 0) - 40) < 1e-9 }
  console.log('[01d] dim @expr on REAL expression:', JSON.stringify(out.dimOnRealExpr))

  // liveness of creation-binding
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'myWidth', value: 55 }] })
  const end2b = (await api.v1.sketch.getPositions({ id: pts2.endId })).result
  out.createBindingLive = { endX: end2b?.pos?.x, live: Math.abs((end2b?.pos?.x ?? 0) - 55) < 1e-9 }
  console.log('[01d] creation-binding live:', JSON.stringify(out.createBindingLive))

  // --- arm 4: updateDimension('@expr.X') binding + liveness
  const l3 = (await api.v1.sketch.line({ id: sk, startPos: [0, 40, 0], endPos: [70, 40, 0] })).result
  const pts3 = (await api.v1.sketch.getPoints({ id: l3 })).result
  await api.v1.sketch.constraint({ id: sk, type: 'FIXATION', geomIds: [pts3.startId] })
  const dim3 = (await api.v1.sketch.dimension({ id: sk, type: 'OFFSET', geomIds: [l3], value: 70 })).result
  const upd = await api.v1.sketch.updateDimension({ id: dim3, value: '@expr.myWidth' })
  const end3 = (await api.v1.sketch.getPositions({ id: pts3.endId })).result
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'myWidth', value: 62 }] })
  const end3b = (await api.v1.sketch.getPositions({ id: pts3.endId })).result
  out.updateDimBinding = {
    updResult: upd.result, updLevel: upd.maxLevel,
    endAfterUpdate: end3?.pos?.x, endAfterExprChange: end3b?.pos?.x,
    boundAndLive: Math.abs((end3?.pos?.x ?? 0) - 55) < 1e-9 && Math.abs((end3b?.pos?.x ?? 0) - 62) < 1e-9,
  }
  console.log('[01d] updateDimension @expr bind+live:', JSON.stringify(out.updateDimBinding))

  // --- arm 5: linkWithExpression on a dimension
  const l4 = (await api.v1.sketch.line({ id: sk, startPos: [0, 60, 0], endPos: [70, 60, 0] })).result
  const pts4 = (await api.v1.sketch.getPoints({ id: l4 })).result
  await api.v1.sketch.constraint({ id: sk, type: 'FIXATION', geomIds: [pts4.startId] })
  const dim4 = (await api.v1.sketch.dimension({ id: sk, type: 'OFFSET', geomIds: [l4], value: 70 })).result
  const link = await api.v1.part.linkWithExpression({ id: dim4, exprName: 'myWidth', name: 'value' })
  const end4 = (await api.v1.sketch.getPositions({ id: pts4.endId })).result
  out.linkWithExpression = { result: link.result, maxLevel: link.maxLevel, msgs: link.messages, endX: end4?.pos?.x, worked: Math.abs((end4?.pos?.x ?? 0) - 62) < 1e-9 }
  console.log('[01d] linkWithExpression on dim:', JSON.stringify(out.linkWithExpression))

  // --- arm 6: ANGLE dim with @expr (expression 0.5236 rad ≈ 30°)
  const lA = (await api.v1.sketch.line({ id: sk, startPos: [0, 80, 0], endPos: [50, 80, 0] })).result
  const lB = (await api.v1.sketch.line({ id: sk, startPos: [0, 80, 0], endPos: [50, 100, 0] })).result
  const ptsA = (await api.v1.sketch.getPoints({ id: lA })).result
  await api.v1.sketch.constraint([
    { id: sk, type: 'FIXATION', geomIds: [lA] },
    { id: sk, type: 'COINCIDENT', geomIds: [ptsA.startId, (await api.v1.sketch.getPoints({ id: lB })).result.startId] },
  ])
  const dimA = await api.v1.sketch.dimension({ id: sk, type: 'ANGLE', geomIds: [lA, lB], value: '@expr.ang' })
  const endB = (await api.v1.sketch.getPositions({ id: (await api.v1.sketch.getPoints({ id: lB })).result.endId })).result
  const angObs = Math.atan2((endB?.pos?.y ?? 0) - 80, endB?.pos?.x ?? 1)
  out.angleExpr = { result: dimA.result, maxLevel: dimA.maxLevel, observedDeg: +(angObs * 180 / Math.PI).toFixed(3), radiansSemantics: Math.abs(angObs - 0.5236) < 1e-3 }
  console.log('[01d] ANGLE @expr (0.5236 rad):', JSON.stringify(out.angleExpr))

  filewrite(out, 'sidequest')
  return out
}
