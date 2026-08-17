// Sphere + box in same EIF — realistic usage with mixed primitives
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereBoxMix' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Box as base
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 80, height: 30 })).result
  console.log('[10] box:', boxId)

  // Sphere sitting on top of box, centered
  const sphereId = (await api.v1.solid.sphere({ id: eifId, radius: 25, translation: [40, 40, 30] })).result
  console.log('[10] sphere:', sphereId)

  await snapshot('sphere-on-box')

  filewrite({ boxId, sphereId }, 'sphere-box-ids')

  return { partId, eifId }
}
