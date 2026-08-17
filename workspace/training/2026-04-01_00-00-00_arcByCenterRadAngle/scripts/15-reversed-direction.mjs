// 15 — Reversed direction (clockwise): startAngle > endAngle to confirm arc goes "backwards"
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ReversedDir' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Forward: 0 to PI/2 (CCW, 90° arc)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Forward' })).result
  await api.v1.curve.arcByCenterRadAngle({
    id: s1, centerPos: [0, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 15,
  })
  // Also add reference line to mark startAngle=0 direction
  await api.v1.curve.line({ id: s1, startPos: [0, 0, 0], endPos: [20, 0, 0] })

  // Reversed: PI/2 to 0 (should this be CW 90°, or CCW 270°?)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Reversed' })).result
  await api.v1.curve.arcByCenterRadAngle({
    id: s2, centerPos: [40, 0, 0], startAngle: Math.PI / 2, endAngle: 0, radius: 15,
  })
  await api.v1.curve.line({ id: s2, startPos: [40, 0, 0], endPos: [60, 0, 0] })

  // Reversed wider: PI to PI/4 (should be CW 135° or CCW 225°?)
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'ReversedWide' })).result
  const r3 = await api.v1.curve.arcByCenterRadAngle({
    id: s3, centerPos: [80, 0, 0], startAngle: Math.PI, endAngle: Math.PI / 4, radius: 15,
  })
  console.log('[15] reversed wide PI to PI/4:', r3.result, 'maxLevel:', r3.maxLevel)

  // Dump graphic data for forward and reversed to compare edge counts
  const fwdGraphic = (await api.v1.curve.arcByCenterRadAngle({
    id: (await api.v1.curve.shape({ id: eifId, name: 'FwdData' })).result,
    centerPos: [120, 0, 0], startAngle: 0, endAngle: Math.PI / 2, radius: 10,
  })).graphic
  const revGraphic = r3.graphic

  filewrite({
    fwdEdgeCount: fwdGraphic ? Object.keys(fwdGraphic).length : 'null',
    revEdgeCount: revGraphic ? Object.keys(revGraphic).length : 'null',
  }, 'graphic-comparison')

  await snapshot('reversed-direction')
  return { partId }
}
