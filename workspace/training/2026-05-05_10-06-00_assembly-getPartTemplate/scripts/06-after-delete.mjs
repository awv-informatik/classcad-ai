export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Test' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Keep' })).result
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Remove' })).result
  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'AlsoKeep' })).result

  const rBefore = await api.v1.assembly.getPartTemplate()
  console.log('[06] before:', JSON.stringify(rBefore.result))

  // Delete the middle template
  const delR = await api.v1.assembly.deleteTemplate({ ids: [tpl2] })
  console.log('[06] delete result:', delR.result, 'maxLevel:', delR.maxLevel)

  const rAfter = await api.v1.assembly.getPartTemplate()
  const rRemoved = await api.v1.assembly.getPartTemplate({ name: 'Remove' })
  const rKeep = await api.v1.assembly.getPartTemplate({ name: 'Keep' })

  console.log('[06] after:', JSON.stringify(rAfter.result))
  console.log('[06] lookup Remove:', rRemoved.result, 'maxLevel:', rRemoved.maxLevel)
  console.log('[06] lookup Keep:', rKeep.result, 'maxLevel:', rKeep.maxLevel)

  filewrite({
    before: rBefore.result,
    afterDelete: rAfter.result,
    removedLookup: { result: rRemoved.result, maxLevel: rRemoved.maxLevel },
    keepLookup: { result: rKeep.result, maxLevel: rKeep.maxLevel },
  }, 'after-delete')

  return { asmId }
}
