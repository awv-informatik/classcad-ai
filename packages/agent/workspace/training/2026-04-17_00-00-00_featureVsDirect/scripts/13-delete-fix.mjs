export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeleteFix' })).result

  // Feature boxes
  const box1 = (await api.v1.part.box({
    id: partId, name: 'Box1', length: 80, width: 60, height: 40,
  })).result
  const box2 = (await api.v1.part.box({
    id: partId, name: 'Box2', length: 40, width: 40, height: 80,
  })).result

  await snapshot('before-delete')

  // deleteFeature takes `ids` array, not singular `id`
  const delR = await api.v1.part.deleteFeature({ ids: [box1] })
  console.log('[13] deleteFeature result:', delR.result, 'maxLevel:', delR.maxLevel)
  filewrite({ result: delR.result, messages: delR.messages, maxLevel: delR.maxLevel }, 'delete-feature-result')

  await snapshot('after-delete-one')

  // EIF with solid boxes for comparison
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const solid1 = (await api.v1.solid.box({
    id: eifId, length: 30, width: 30, height: 30,
    translation: [60, 0, 0],
  })).result
  const solid2 = (await api.v1.solid.box({
    id: eifId, length: 30, width: 30, height: 30,
    translation: [100, 0, 0],
  })).result

  await snapshot('with-solids')

  // Delete one solid
  const delSolid = await api.v1.solid.deleteSolid({ id: eifId, ids: [solid1] })
  console.log('[13] deleteSolid one:', delSolid.result, 'maxLevel:', delSolid.maxLevel)

  await snapshot('after-delete-solid')

  // Can we delete the EIF itself as a feature?
  const delEif = await api.v1.part.deleteFeature({ ids: [eifId] })
  console.log('[13] deleteFeature EIF:', delEif.result, 'maxLevel:', delEif.maxLevel)
  filewrite({ result: delEif.result, messages: delEif.messages, maxLevel: delEif.maxLevel }, 'delete-eif-result')

  await snapshot('after-delete-eif')

  return { partId }
}
