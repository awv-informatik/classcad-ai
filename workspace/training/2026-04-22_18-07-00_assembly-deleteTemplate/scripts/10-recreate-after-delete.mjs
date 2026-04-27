export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RecreateTest' })).result

  // Create, instance, delete, then recreate with same name
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
  await api.v1.part.box({ id: tpl1, length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  console.log('[10] tpl1:', tpl1, 'inst1:', inst1)

  // Delete template (cascade removes instance)
  await api.v1.assembly.deleteTemplate({ ids: [tpl1] })
  console.log('[10] deleted tpl1')

  // Recreate with same name
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
  await api.v1.part.box({ id: tpl2, length: 60, width: 40, height: 30 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result
  console.log('[10] tpl2:', tpl2, 'inst2:', inst2)

  // Verify structure is clean
  const tplList = (await api.v1.assembly.getPartTemplate({})).result
  console.log('[10] templates:', JSON.stringify(tplList))

  // Lookup by name
  const found = await api.v1.assembly.getPartTemplate({ name: 'Bracket' })
  console.log('[10] getPartTemplate by name:', found.result, 'maxLevel:', found.maxLevel)
  filewrite({ tplList, found: found.result }, 'recreate-state')

  await snapshot('after-recreate')

  return { asmId }
}
