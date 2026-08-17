export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateName' })).result

  const wcs = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [80, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result
  const box1 = (await api.v1.part.box({ id: partId, name: 'Box1', length: 40, width: 40, height: 30 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Box2', length: 30, width: 30, height: 50, references: [wcs] })).result

  const delId = (await api.v1.part.entityDeletion({ id: partId, name: 'OrigName', targets: [box2] })).result
  console.log('[15] delId:', delId)

  // Check structure to see original name
  const r1 = await api.v1.common.recalc({})
  filewrite(r1.structure, 'structure-before-rename')

  // Rename via update
  await api.v1.part.openFeature({ id: delId })
  const r2 = await api.v1.part.updateEntityDeletion({ id: delId, name: 'RenamedDeletion' })
  await api.v1.part.closeFeature({ id: delId })
  console.log('[15] rename result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Check structure after rename
  const r3 = await api.v1.common.recalc({})
  filewrite(r3.structure, 'structure-after-rename')

  return { partId, delId }
}
