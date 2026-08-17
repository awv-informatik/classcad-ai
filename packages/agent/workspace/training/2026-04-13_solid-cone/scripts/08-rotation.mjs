// Rotation — rotate cone around axes
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotationTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Reference cone at origin (upright)
  const ref = (await api.v1.solid.cone({ id: eifId, height: 100, bDiameter: 50, tDiameter: 10 })).result

  // Rotated 90° around X (cone lies along Y)
  const r1 = await api.v1.solid.cone({
    id: eifId, height: 100, bDiameter: 50, tDiameter: 10,
    rotation: [Math.PI / 2, 0, 0], translation: [120, 0, 0]
  })
  console.log('[08] rotated X result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Rotated 90° around Y (cone lies along X)
  const r2 = await api.v1.solid.cone({
    id: eifId, height: 100, bDiameter: 50, tDiameter: 10,
    rotation: [0, -Math.PI / 2, 0], translation: [0, 120, 0]
  })
  console.log('[08] rotated Y result:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('rotations')
  return { partId, eifId }
}
