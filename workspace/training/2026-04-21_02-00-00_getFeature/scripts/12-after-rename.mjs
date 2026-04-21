export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'OriginalName' })).result

  // Verify original name
  const r1 = await api.v1.part.getFeature({ id: partId, name: 'OriginalName' })
  console.log('[12] before rename "OriginalName":', r1.result)

  // Rename via setObjectName
  await api.v1.common.setObjectName({ id: boxId, name: 'NewName' })

  // Old name should fail
  const r2 = await api.v1.part.getFeature({ id: partId, name: 'OriginalName' })
  console.log('[12] after rename "OriginalName":', r2.result, 'maxLevel:', r2.maxLevel)

  // New name should work
  const r3 = await api.v1.part.getFeature({ id: partId, name: 'NewName' })
  console.log('[12] after rename "NewName":', r3.result, 'match:', r3.result === boxId)

  // Rename via updateBox
  await api.v1.part.updateBox({ id: boxId, name: 'UpdatedName' })

  const r4 = await api.v1.part.getFeature({ id: partId, name: 'NewName' })
  const r5 = await api.v1.part.getFeature({ id: partId, name: 'UpdatedName' })
  console.log('[12] after updateBox "NewName":', r4.result)
  console.log('[12] after updateBox "UpdatedName":', r5.result, 'match:', r5.result === boxId)

  filewrite({
    before: r1.result,
    afterSetObj_old: r2.result,
    afterSetObj_new: r3.result,
    afterUpdate_old: r4.result,
    afterUpdate_new: r5.result,
  }, 'after-rename')

  return { partId }
}
