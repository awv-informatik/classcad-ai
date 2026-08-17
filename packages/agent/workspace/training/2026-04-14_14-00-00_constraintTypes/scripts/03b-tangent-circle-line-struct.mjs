// Test TANGENT circle-line — use structure tree for circle center verification
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'TangentCL' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Fixed horizontal line at y=0
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [100, 0, 0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [lineId] })

  // Circle at (50, 30), radius 15 — not tangent
  const circR = await api.v1.sketch.circle({ id: skId, centerPos: [50, 30, 0], radius: 15 })
  const circId = circR.result
  console.log('[03b] circId:', circId)

  // Get circle center from structure tree before
  const circNodeBefore = Object.values(circR.structure.tree).find(n => n.id === circId)
  const cxBefore = circNodeBefore?.members?.center?.value
  console.log('[03b] circle center before:', JSON.stringify(cxBefore))

  await snapshot('before')

  // TANGENT circle-line
  const r = await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [circId, lineId] })
  console.log('[03b] TANGENT result:', r.result, 'maxLevel:', r.maxLevel)

  // Get circle center from structure tree after
  const circNodeAfter = Object.values(r.structure.tree).find(n => n.id === circId)
  const cxAfter = circNodeAfter?.members?.center?.value
  const radiusAfter = circNodeAfter?.members?.radius?.value
  console.log('[03b] circle center after:', JSON.stringify(cxAfter))
  console.log('[03b] radius after:', radiusAfter)

  await snapshot('after')

  // For tangent to horizontal line at y=0: center.y should = radius
  const tangent = cxAfter && radiusAfter && Math.abs(cxAfter.y - radiusAfter) < 0.1

  filewrite({
    constraintResult: r.result,
    maxLevel: r.maxLevel,
    centerBefore: cxBefore,
    centerAfter: cxAfter,
    radiusAfter: radiusAfter,
    tangent: tangent
  }, 'tangent-circle-line')

  return { partId }
}
