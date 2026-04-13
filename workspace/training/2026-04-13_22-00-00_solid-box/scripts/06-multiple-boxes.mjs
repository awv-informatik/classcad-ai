export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiBox' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create three boxes of different sizes in one EIF
  const box1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 40, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 60, translation: [100, 0, 0] })).result
  const box3 = (await api.v1.solid.box({ id: eifId, length: 50, width: 50, height: 50, translation: [0, 80, 0] })).result

  console.log('[06] box1:', box1, 'box2:', box2, 'box3:', box3)

  // Delete box2
  const delR = await api.v1.solid.deleteSolid({ id: eifId, ids: [box2] })
  console.log('[06] delete box2 result:', delR.result, 'maxLevel:', delR.maxLevel)

  filewrite({ box1, box2, box3, deleteResult: delR.result, deleteMaxLevel: delR.maxLevel }, 'multi-box')

  await snapshot('after-delete')
  return { partId }
}
