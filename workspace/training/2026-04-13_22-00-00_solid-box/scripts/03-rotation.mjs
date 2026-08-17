export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoxRotation' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Reference box at origin
  const box1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 30, height: 20 })).result
  console.log('[03] box1 (unrotated):', box1)

  // Rotated box — 45° around Z axis
  const r = await api.v1.solid.box({
    id: eifId, length: 80, width: 30, height: 20,
    rotation: [0, 0, Math.PI / 4],
    translation: [0, 80, 0]
  })
  console.log('[03] box2 (rotated 45° Z):', r.result, 'maxLevel:', r.maxLevel)

  filewrite({ box1, box2: r.result, maxLevel: r.maxLevel }, 'rotation-response')

  await snapshot('rotated-box')
  return { partId }
}
