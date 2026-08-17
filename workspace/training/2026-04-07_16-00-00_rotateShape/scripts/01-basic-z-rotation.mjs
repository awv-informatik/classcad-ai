// 01 — Basic rotation around Z axis (90 degrees = PI/2)
// NOTE: snapshot() calls recalc which invalidates shape IDs. Do transforms BEFORE snapshots.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotateTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Outline' })).result

  // Create an L-shaped polyline so rotation is visually obvious
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 40, ya: 0 },
      { xa: 40, ya: 10 },
      { xa: 10, ya: 10 },
      { xa: 10, ya: 30 },
      { xa: 0, ya: 30 },
    ],
    close: true,
  })

  // Rotate 90 degrees around Z (PI/2 radians) — do BEFORE any snapshot
  const r = await api.v1.curve.rotateShape({ id: shapeId, rotation: [0, 0, Math.PI / 2] })
  console.log('[01] rotateShape result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'rotate-response')

  await snapshot('after-z-90')

  return { partId, shapeId }
}
