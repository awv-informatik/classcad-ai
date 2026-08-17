export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  // Create templates in specific order
  const tplC = (await api.v1.assembly.assemblyTemplate({ name: 'Charlie' })).result
  const tplA = (await api.v1.assembly.assemblyTemplate({ name: 'Alpha' })).result
  const tplB = (await api.v1.assembly.assemblyTemplate({ name: 'Bravo' })).result
  console.log('[04] created: Charlie=', tplC, 'Alpha=', tplA, 'Bravo=', tplB)

  // List all — check ordering (creation order or alphabetical?)
  const listBefore = await api.v1.assembly.getAssemblyTemplate()
  console.log('[04] listBefore:', JSON.stringify(listBefore.result))

  // Delete the middle one (Alpha)
  const delR = await api.v1.assembly.deleteTemplate({ ids: [tplA] })
  console.log('[04] deleteTemplate result:', delR.result, 'maxLevel:', delR.maxLevel)

  // List again — should reflect deletion
  const listAfter = await api.v1.assembly.getAssemblyTemplate()
  console.log('[04] listAfter:', JSON.stringify(listAfter.result))

  // Try to find deleted template by name
  const findDeleted = await api.v1.assembly.getAssemblyTemplate({ name: 'Alpha' })
  console.log('[04] findDeleted result:', findDeleted.result, 'maxLevel:', findDeleted.maxLevel)

  filewrite({
    createdIds: { tplC, tplA, tplB },
    listBefore: listBefore.result,
    listAfter: listAfter.result,
    findDeleted: { result: findDeleted.result, maxLevel: findDeleted.maxLevel, messages: findDeleted.messages },
  }, 'delete-ordering')

  return { asmId }
}
