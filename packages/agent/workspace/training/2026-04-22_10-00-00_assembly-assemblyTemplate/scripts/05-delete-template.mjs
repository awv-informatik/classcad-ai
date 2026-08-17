export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'DeleteTest' })).result

  const t1 = (await api.v1.assembly.assemblyTemplate({ name: 'Del1' })).result
  const t2 = (await api.v1.assembly.assemblyTemplate({ name: 'Del2' })).result
  const t3 = (await api.v1.assembly.assemblyTemplate({ name: 'Del3' })).result
  console.log('[05] created templates:', t1, t2, t3)

  // Verify all exist
  const before = await api.v1.assembly.getAssemblyTemplate()
  console.log('[05] before delete:', JSON.stringify(before.result))

  // Delete one assembly template
  const rDel = await api.v1.assembly.deleteTemplate({ ids: [t2] })
  console.log('[05] deleteTemplate result:', rDel.result, 'maxLevel:', rDel.maxLevel)
  filewrite({ result: rDel.result, messages: rDel.messages, maxLevel: rDel.maxLevel }, 'delete-one-response')

  // Verify it's gone
  const after = await api.v1.assembly.getAssemblyTemplate()
  console.log('[05] after delete one:', JSON.stringify(after.result))

  // Delete multiple
  const rDel2 = await api.v1.assembly.deleteTemplate({ ids: [t1, t3] })
  console.log('[05] deleteTemplate multiple result:', rDel2.result, 'maxLevel:', rDel2.maxLevel)

  const afterAll = await api.v1.assembly.getAssemblyTemplate()
  console.log('[05] after delete all:', JSON.stringify(afterAll.result))

  // Delete already-deleted (error case)
  const rDelAgain = await api.v1.assembly.deleteTemplate({ ids: [t2] })
  console.log('[05] delete already-deleted:', rDelAgain.result, 'maxLevel:', rDelAgain.maxLevel)
  filewrite({ result: rDelAgain.result, messages: rDelAgain.messages, maxLevel: rDelAgain.maxLevel }, 'delete-again-response')

  return { t1, t2, t3 }
}
