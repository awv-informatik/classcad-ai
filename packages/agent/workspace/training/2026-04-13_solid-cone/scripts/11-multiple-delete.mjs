// Multiple cones in one EIF + deleteSolid
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiDelete' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create 3 cones with different positions
  const c1 = (await api.v1.solid.cone({ id: eifId, height: 80, bDiameter: 40, tDiameter: 10 })).result
  const c2 = (await api.v1.solid.cone({ id: eifId, height: 60, bDiameter: 30, tDiameter: 5, translation: [80, 0, 0] })).result
  const c3 = (await api.v1.solid.cone({ id: eifId, height: 100, bDiameter: 50, tDiameter: 20, translation: [0, 80, 0] })).result
  console.log('[11] three cones:', c1, c2, c3)

  await snapshot('three-cones')

  // Delete one specific cone
  const del = await api.v1.solid.deleteSolid({ id: eifId, ids: [c2] })
  console.log('[11] delete c2:', del.result, 'maxLevel:', del.maxLevel)

  await snapshot('after-delete-one')

  // Delete remaining with no ids (clear all)
  const delAll = await api.v1.solid.deleteSolid({ id: eifId })
  console.log('[11] delete all:', delAll.result, 'maxLevel:', delAll.maxLevel)

  await snapshot('after-delete-all')
  return { partId, eifId }
}
