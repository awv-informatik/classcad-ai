export default async function (api, { filewrite }) {
  // What happens if we convert multiple times with the same name?
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result
  const partTpl = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: partTpl, length: 30, width: 20, height: 10 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  await api.v1.assembly.instance({ productId: partTpl, ownerId: asmId })

  // Convert with name "Sub"
  const r1 = await api.v1.assembly.convertToTemplate({ name: 'Sub' })
  const root2 = r1.structure?.root
  console.log('[15] 1st convert: root =', root2)

  // Add instance and convert again with same name "Sub"
  await api.v1.assembly.instance({ productId: asmId, ownerId: root2 })
  const r2 = await api.v1.assembly.convertToTemplate({ name: 'Sub' })
  const root3 = r2.structure?.root
  console.log('[15] 2nd convert: root =', root3)

  // List assembly templates
  const all = await api.v1.assembly.getAssemblyTemplate({})
  console.log('[15] all assembly templates:', all.result)

  // Find by name "Sub" — which one does it return? (should return first? or error?)
  const findSub = await api.v1.assembly.getAssemblyTemplate({ name: 'Sub' })
  console.log('[15] find "Sub":', findSub.result)

  // Check names of both templates
  const tree = r2.structure?.tree
  console.log('[15] template 12 name:', tree?.['12']?.name)
  console.log('[15] template', root2, 'name:', tree?.[String(root2)]?.name)

  filewrite({
    allTemplates: all.result,
    findSubResult: findSub.result,
    template12Name: tree?.['12']?.name,
    template2Name: tree?.[String(root2)]?.name,
  }, 'duplicate-names')

  return {}
}
