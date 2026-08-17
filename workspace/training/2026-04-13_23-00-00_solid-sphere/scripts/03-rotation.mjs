// Sphere with rotation — does rotation matter for a perfect sphere?
// A sphere is symmetric, so rotation alone should produce visually identical results.
// But does the API accept it? And does it change internal representation?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereRotation' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Unrotated sphere
  const r1 = await api.v1.solid.sphere({ id: eifId, radius: 40 })
  console.log('[03] unrotated:', r1.result, 'maxLevel:', r1.maxLevel)

  // Rotated sphere — 45° around Z
  const r2 = await api.v1.solid.sphere({ id: eifId, radius: 40, rotation: [0, 0, Math.PI / 4], translation: [100, 0, 0] })
  console.log('[03] rotated:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    unrotatedId: r1.result,
    rotatedId: r2.result,
  }, 'rotation-response')

  await snapshot('rotation-comparison')

  return { partId, eifId }
}
