// 17 — Offset center: arcs with non-origin center to confirm centerPos works correctly
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OffsetCenter' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Offset' })).result

  // Arc at (50, 30, 0) with radius 20
  const r = await api.v1.curve.arcByCenterRadAngle({
    id: shapeId, centerPos: [50, 30, 0], startAngle: 0, endAngle: Math.PI, radius: 20,
  })
  console.log('[17] offset center:', r.result, 'maxLevel:', r.maxLevel)

  // Add a reference point (tiny line) at center to visually confirm
  await api.v1.curve.line({ id: shapeId, startPos: [49, 30, 0], endPos: [51, 30, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [50, 29, 0], endPos: [50, 31, 0] })

  filewrite({ maxLevel: r.maxLevel, msgs: r.messages }, 'offset-response')
  await snapshot('offset-center')
  return { partId }
}
