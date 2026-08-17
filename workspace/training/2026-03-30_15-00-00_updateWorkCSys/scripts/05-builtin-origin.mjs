// Test: update built-in Origin CSys
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const originId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Origin' })).result
  console.log('[05] Origin:', originId)

  // Try to update offset
  await api.v1.part.openFeature({ id: originId })
  const r1 = await api.v1.part.updateWorkCSys({ id: originId, offset: [10, 10, 10] })
  console.log('[05] update offset:', r1.result, r1.maxLevel)
  console.log('[05] messages:', JSON.stringify(r1.messages))
  await api.v1.part.closeFeature({ id: originId })

  // Try to rename
  await api.v1.part.openFeature({ id: originId })
  const r2 = await api.v1.part.updateWorkCSys({ id: originId, name: 'MyOrigin' })
  console.log('[05] rename:', r2.result, r2.maxLevel)
  console.log('[05] messages:', JSON.stringify(r2.messages))
  await api.v1.part.closeFeature({ id: originId })

  // Check if rename took effect
  const findOld = await api.v1.part.getWorkGeometry({ id: partId, name: 'Origin' })
  const findNew = await api.v1.part.getWorkGeometry({ id: partId, name: 'MyOrigin' })
  console.log('[05] find Origin:', findOld.result, 'find MyOrigin:', findNew.result)

  filewrite({
    updateOffset: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    rename: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    findOld: findOld.result, findNew: findNew.result
  }, 'builtin-responses')
  return { partId }
}
