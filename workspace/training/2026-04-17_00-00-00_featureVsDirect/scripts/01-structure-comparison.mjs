export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'StructureTest' })).result

  // Feature-based box
  const featBoxId = (await api.v1.part.box({
    id: partId, name: 'FeatBox', length: 80, width: 60, height: 40,
  })).result
  console.log('[01] part.box returned:', featBoxId, typeof featBoxId)

  // Get structure after feature box
  const r1 = await api.v1.common.getAppVersion({})
  filewrite(r1.structure, 'structure-after-feat-box')

  await snapshot('feat-box')

  // Now create EIF + solid box in same part
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  console.log('[01] entityInjection returned:', eifId, typeof eifId)

  const solidBoxId = (await api.v1.solid.box({
    id: eifId, length: 50, width: 50, height: 50,
    translation: [100, 0, 0],
  })).result
  console.log('[01] solid.box returned:', solidBoxId, typeof solidBoxId)

  // Get structure after both
  const r2 = await api.v1.common.getAppVersion({})
  filewrite(r2.structure, 'structure-after-both')

  await snapshot('both-boxes')

  return { partId, featBoxId, eifId, solidBoxId }
}
