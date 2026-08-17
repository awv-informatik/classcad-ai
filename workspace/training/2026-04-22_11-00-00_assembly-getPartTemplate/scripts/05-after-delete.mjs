export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  const t1 = (await api.v1.assembly.partTemplate({ name: 'Keep' })).result
  const t2 = (await api.v1.assembly.partTemplate({ name: 'Remove' })).result
  const t3 = (await api.v1.assembly.partTemplate({ name: 'AlsoKeep' })).result

  console.log('[05] created:', t1, t2, t3)

  // Verify all exist
  const rBefore = await api.v1.assembly.getPartTemplate()
  console.log('[05] before delete:', JSON.stringify(rBefore.result))

  // Delete the middle one
  const del = await api.v1.assembly.deleteTemplate({ ids: [t2] })
  console.log('[05] delete result:', del.result, 'maxLevel:', del.maxLevel)

  // List all after deletion
  const rAfter = await api.v1.assembly.getPartTemplate()
  console.log('[05] after delete:', JSON.stringify(rAfter.result))

  // Try to find the deleted one by name
  const rRemoved = await api.v1.assembly.getPartTemplate({ name: 'Remove' })
  console.log('[05] find deleted:', rRemoved.result, 'maxLevel:', rRemoved.maxLevel)

  // Find remaining by name
  const rKeep = await api.v1.assembly.getPartTemplate({ name: 'Keep' })
  console.log('[05] find Keep:', rKeep.result)

  const rAlsoKeep = await api.v1.assembly.getPartTemplate({ name: 'AlsoKeep' })
  console.log('[05] find AlsoKeep:', rAlsoKeep.result)

  filewrite({
    beforeDelete: rBefore.result,
    afterDelete: rAfter.result,
    deletedLookup: { result: rRemoved.result, maxLevel: rRemoved.maxLevel, messages: rRemoved.messages },
    keepLookup: rKeep.result,
    alsoKeepLookup: rAlsoKeep.result,
  }, 'after-delete')

  return { asmId }
}
