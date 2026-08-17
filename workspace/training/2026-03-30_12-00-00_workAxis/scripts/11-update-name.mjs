// Test: updateWorkAxis — rename (with openFeature)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const waId = (await api.v1.part.workAxis({
    id: partId,
    name: 'OrigName',
    direction: [0, 0, 1]
  })).result
  console.log('[11] created:', waId)

  // Open, rename, close
  await api.v1.part.openFeature({ id: waId })
  const r1 = await api.v1.part.updateWorkAxis({ id: waId, name: 'NewName' })
  console.log('[11] rename result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[11] rename messages:', JSON.stringify(r1.messages))
  await api.v1.part.closeFeature({ id: waId })

  // Verify old name no longer found
  const oldFind = await api.v1.part.getWorkGeometry({ id: partId, name: 'OrigName' })
  console.log('[11] find OrigName:', oldFind.result, 'maxLevel:', oldFind.maxLevel)

  // Verify new name found
  const newFind = await api.v1.part.getWorkGeometry({ id: partId, name: 'NewName' })
  console.log('[11] find NewName:', newFind.result, 'maxLevel:', newFind.maxLevel)

  filewrite({
    rename: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    oldNameFind: { result: oldFind.result, maxLevel: oldFind.maxLevel },
    newNameFind: { result: newFind.result, maxLevel: newFind.maxLevel }
  }, 'rename-responses')

  return { partId }
}
