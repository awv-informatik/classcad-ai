export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RenameBoxTest' })).result

  const boxId = (await api.v1.part.box({ id: partId, name: 'OldName', length: 50, width: 50, height: 50 })).result
  console.log('[08] boxId:', boxId)

  const beforeStructure = (await api.v1.common.recalc({}))
  filewrite(beforeStructure.structure, 'structure-before')

  // Update only name
  await api.v1.part.openFeature({ id: boxId })
  const ur = await api.v1.part.updateBox({ id: boxId, name: 'NewName' })
  await api.v1.part.closeFeature({ id: boxId })

  console.log('[08] rename result:', ur.result, 'maxLevel:', ur.maxLevel)
  filewrite({ result: ur.result, messages: ur.messages, maxLevel: ur.maxLevel }, 'rename-response')

  const afterStructure = (await api.v1.common.recalc({}))
  filewrite(afterStructure.structure, 'structure-after')

  return { partId, boxId }
}
