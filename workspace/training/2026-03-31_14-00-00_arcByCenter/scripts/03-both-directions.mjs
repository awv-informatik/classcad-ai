// 03 — Both directions side by side: CW vs CCW with same center/start/end
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Arc 1: clockwise (default) — should be the major arc
  await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [0, 0, 0],
    startPos: [30, 0, 0],
    endPos: [0, 30, 0],
    isClockwise: true,
  })

  // Arc 2: counterclockwise — offset to the right, should be the minor arc
  await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [80, 0, 0],
    startPos: [110, 0, 0],
    endPos: [80, 30, 0],
    isClockwise: false,
  })

  await snapshot('both-directions')
  return { partId, shapeId }
}
