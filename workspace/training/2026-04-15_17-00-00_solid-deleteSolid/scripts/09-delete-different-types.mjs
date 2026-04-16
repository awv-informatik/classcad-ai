// Test: delete different solid types (sphere, cylinder, cone — not just boxes)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeleteTypes' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const sphereId = (await api.v1.solid.sphere({ id: eifId, radius: 25, translation: [80, 0, 0] })).result
  const cylId = (await api.v1.solid.cylinder({ id: eifId, radius: 15, height: 50, translation: [0, 80, 0] })).result
  console.log('[09] boxId:', boxId, 'sphereId:', sphereId, 'cylId:', cylId)

  await snapshot('before')

  // Delete just the sphere
  const r1 = await api.v1.solid.deleteSolid({ id: eifId, ids: [sphereId] })
  console.log('[09] delete sphere — maxLevel:', r1.maxLevel)

  await snapshot('after-sphere-deleted')

  // Delete remaining two
  const r2 = await api.v1.solid.deleteSolid({ id: eifId, ids: [boxId, cylId] })
  console.log('[09] delete box+cyl — maxLevel:', r2.maxLevel)

  await snapshot('after-all-deleted')

  return { partId, eifId }
}
