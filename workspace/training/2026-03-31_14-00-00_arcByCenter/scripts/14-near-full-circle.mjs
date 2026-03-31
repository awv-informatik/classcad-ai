// 14 — Near-full-circle: start and end very close (1 degree apart)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Start at angle 0, end at angle ~1 degree (0.0175 rad) — CW should give ~359 degree arc
  const angle = 0.0175
  const r = 20
  const r1 = await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [0, 0, 0],
    startPos: [r, 0, 0],
    endPos: [r * Math.cos(angle), r * Math.sin(angle), 0],
    isClockwise: true,
  })
  console.log('[14] near-full CW:', r1.result, 'maxLevel:', r1.maxLevel)

  // CCW version — should be a tiny ~1 degree arc
  const r2 = await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [60, 0, 0],
    startPos: [60 + r, 0, 0],
    endPos: [60 + r * Math.cos(angle), r * Math.sin(angle), 0],
    isClockwise: false,
  })
  console.log('[14] tiny CCW:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('near-full')
  return { partId, shapeId }
}
