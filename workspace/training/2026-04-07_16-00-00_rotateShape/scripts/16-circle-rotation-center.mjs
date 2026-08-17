// 16 — Rotation center test with circles (visually unambiguous)
// Circle A at origin, Circle B offset. Both rotated 90° around Z.
// If rotation is around origin, Circle B moves to a new position.
// If around its own center, Circle B stays put.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CircleCenterTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Reference: unrotated circle at (50, 0) — stays fixed for comparison
  const sRef = (await api.v1.curve.shape({ id: eifId, name: 'Reference' })).result
  await api.v1.curve.circle({ id: sRef, centerPos: [50, 0, 0], radius: 5 })

  // Test circle at (50, 0) — will be rotated 90° around Z
  const sTest = (await api.v1.curve.shape({ id: eifId, name: 'Rotated' })).result
  await api.v1.curve.circle({ id: sTest, centerPos: [50, 0, 0], radius: 8 })

  // Add a small marker at origin for reference
  const sOrigin = (await api.v1.curve.shape({ id: eifId, name: 'Origin' })).result
  await api.v1.curve.circle({ id: sOrigin, centerPos: [0, 0, 0], radius: 2 })

  // Rotate test circle 90° around Z
  const r = await api.v1.curve.rotateShape({ id: sTest, rotation: [0, 0, Math.PI / 2] })
  console.log('[16] rotateShape result:', r.result, 'maxLevel:', r.maxLevel)

  // If around origin: circle moves from (50,0) to (0,50)
  // If around center (50,0): circle stays at (50,0) — no visible change for 90° rotation of a circle

  // Actually a circle rotated around its own center looks the same...
  // So if it moves, rotation is around origin.
  // If it stays put, rotation is around center.

  await snapshot('circle-rotation-center')

  return { partId }
}
