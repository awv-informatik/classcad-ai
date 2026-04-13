// Multiple spheres in one EIF — verify coexistence and deleteSolid
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiSphere' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const s1 = (await api.v1.solid.sphere({ id: eifId, radius: 25 })).result
  const s2 = (await api.v1.solid.sphere({ id: eifId, radius: 20, translation: [60, 0, 0] })).result
  const s3 = (await api.v1.solid.sphere({ id: eifId, radius: 15, translation: [0, 60, 0] })).result

  console.log('[09] sphere IDs:', s1, s2, s3)
  await snapshot('three-spheres')

  // Delete the middle sphere
  const delR = await api.v1.solid.deleteSolid({ id: eifId, ids: [s2] })
  console.log('[09] deleteSolid result:', delR.result, 'maxLevel:', delR.maxLevel)

  await snapshot('after-delete')

  filewrite({
    sphereIds: [s1, s2, s3],
    deleteResult: delR.result,
    deleteMaxLevel: delR.maxLevel,
  }, 'multi-sphere')

  return { partId, eifId }
}
