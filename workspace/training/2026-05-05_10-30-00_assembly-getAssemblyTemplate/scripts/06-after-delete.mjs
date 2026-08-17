export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  const t1 = (await api.v1.assembly.assemblyTemplate({ name: 'Keep' })).result
  const t2 = (await api.v1.assembly.assemblyTemplate({ name: 'Remove' })).result
  const t3 = (await api.v1.assembly.assemblyTemplate({ name: 'AlsoKeep' })).result
  console.log('[06] created:', t1, t2, t3)

  const before = await api.v1.assembly.getAssemblyTemplate()
  console.log('[06] before delete:', before.result)

  // Delete the middle one
  const delRes = await api.v1.assembly.deleteTemplate({ ids: [t2] })
  console.log('[06] delete result:', delRes.result, 'maxLevel:', delRes.maxLevel)

  const after = await api.v1.assembly.getAssemblyTemplate()
  console.log('[06] after delete:', after.result)

  // Try finding deleted by name
  const rRemove = await api.v1.assembly.getAssemblyTemplate({ name: 'Remove' })
  console.log('[06] find deleted:', rRemove.result, 'maxLevel:', rRemove.maxLevel)

  // Confirm survivors still findable
  const rKeep = await api.v1.assembly.getAssemblyTemplate({ name: 'Keep' })
  const rAlso = await api.v1.assembly.getAssemblyTemplate({ name: 'AlsoKeep' })
  console.log('[06] Keep:', rKeep.result, 'AlsoKeep:', rAlso.result)

  filewrite({
    before: before.result,
    deletedId: t2,
    deleteResult: { result: delRes.result, maxLevel: delRes.maxLevel },
    after: after.result,
    findDeleted: { result: rRemove.result, maxLevel: rRemove.maxLevel },
    survivorsFound: rKeep.result === t1 && rAlso.result === t3,
  }, 'after-delete')

  return { asmId }
}
