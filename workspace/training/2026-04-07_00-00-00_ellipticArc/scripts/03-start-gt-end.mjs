// startAngle > endAngle — complement arc behavior
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  const PI = Math.PI

  // Normal: start=0, end=PI/2 → 90° CCW arc
  const r1 = await api.v1.curve.ellipticArc({
    id: shapeId, centerPos: [-40, 0, 0],
    startAngle: 0, endAngle: PI / 2, radius1: 20, radius2: 10,
  })
  console.log('[03] normal (0→PI/2):', r1.result, 'maxLevel:', r1.maxLevel)

  // Reversed: start=PI/2, end=0 → should be 270° complement arc
  const r2 = await api.v1.curve.ellipticArc({
    id: shapeId, centerPos: [40, 0, 0],
    startAngle: PI / 2, endAngle: 0, radius1: 20, radius2: 10,
  })
  console.log('[03] reversed (PI/2→0):', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('start-gt-end')
  return { partId }
}
