export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeleteTest' })).result

  // Feature box
  const featBoxId = (await api.v1.part.box({
    id: partId, name: 'FeatBox', length: 80, width: 60, height: 40,
  })).result

  // EIF with solid box
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const solidBoxId = (await api.v1.solid.box({
    id: eifId, length: 50, width: 50, height: 50,
    translation: [100, 0, 0],
  })).result

  await snapshot('before-delete')

  // Delete the feature box via part.deleteFeature
  const delFeatR = await api.v1.part.deleteFeature({ id: featBoxId })
  console.log('[07] deleteFeature result:', delFeatR.result, 'maxLevel:', delFeatR.maxLevel)
  filewrite({ result: delFeatR.result, messages: delFeatR.messages, maxLevel: delFeatR.maxLevel }, 'delete-feat-result')

  await snapshot('after-feat-delete')

  // Delete the solid box via solid.deleteSolid
  const delSolidR = await api.v1.solid.deleteSolid({ id: eifId, ids: [solidBoxId] })
  console.log('[07] deleteSolid result:', delSolidR.result, 'maxLevel:', delSolidR.maxLevel)
  filewrite({ result: delSolidR.result, messages: delSolidR.messages, maxLevel: delSolidR.maxLevel }, 'delete-solid-result')

  await snapshot('after-solid-delete')

  // Try deleting feature box with solid.deleteSolid (wrong API)
  const partId2 = (await api.v1.part.create({ name: 'DeleteTest2' })).result
  const featBox2 = (await api.v1.part.box({
    id: partId2, name: 'FeatBox2', length: 80, width: 60, height: 40,
  })).result
  const wrongDelR = await api.v1.solid.deleteSolid({ id: featBox2 })
  console.log('[07] deleteSolid on feat box result:', wrongDelR.result, 'maxLevel:', wrongDelR.maxLevel)
  filewrite({ result: wrongDelR.result, messages: wrongDelR.messages, maxLevel: wrongDelR.maxLevel }, 'wrong-delete-result')

  // Try deleteFeature on solid box ID
  const partId3 = (await api.v1.part.create({ name: 'DeleteTest3' })).result
  const eifId3 = (await api.v1.part.entityInjection({ id: partId3, name: 'EIF3' })).result
  const solidBox3 = (await api.v1.solid.box({
    id: eifId3, length: 50, width: 50, height: 50,
  })).result
  const wrongDel2R = await api.v1.part.deleteFeature({ id: solidBox3 })
  console.log('[07] deleteFeature on solid box result:', wrongDel2R.result, 'maxLevel:', wrongDel2R.maxLevel)
  filewrite({ result: wrongDel2R.result, messages: wrongDel2R.messages, maxLevel: wrongDel2R.maxLevel }, 'wrong-delete2-result')

  return { partId }
}
