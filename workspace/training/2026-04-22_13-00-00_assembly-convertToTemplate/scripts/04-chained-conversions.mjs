export default async function (api, { snapshot, filewrite }) {
  // Build hierarchy from bottom up using repeated convertToTemplate calls
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  // Create part template
  const boxTpl = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: boxTpl, length: 40, width: 30, height: 20 })

  // Add an instance to root
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  await api.v1.assembly.instance({ productId: boxTpl, ownerId: asmId, name: 'Box1' })

  // First conversion: root → "Level1"
  const r1 = await api.v1.assembly.convertToTemplate({ name: 'Level1' })
  const root2 = r1.structure?.root
  console.log('[04] after 1st convert: root =', root2)

  // Add another instance into new root
  await api.v1.assembly.instance({ productId: asmId, ownerId: root2, name: 'Level1Inst' })

  // Second conversion: root → "Level2"
  const r2 = await api.v1.assembly.convertToTemplate({ name: 'Level2' })
  const root3 = r2.structure?.root
  console.log('[04] after 2nd convert: root =', root3)

  // Instance the second-level template
  await api.v1.assembly.instance({ productId: root2, ownerId: root3, name: 'Level2Inst' })

  // Third conversion: root → "Level3"
  const r3 = await api.v1.assembly.convertToTemplate({ name: 'Level3' })
  const root4 = r3.structure?.root
  console.log('[04] after 3rd convert: root =', root4)

  // Instance the third-level
  await api.v1.assembly.instance({ productId: root3, ownerId: root4, name: 'Level3Inst' })

  // Check the assembly container now has 3 assembly templates
  const allTemplates = await api.v1.assembly.getAssemblyTemplate({})
  console.log('[04] all assembly templates:', allTemplates.result)

  filewrite({
    root4,
    allTemplates: allTemplates.result,
    finalInstances: r3.structure?.tree?.[String(root4)]?.instances,
  }, 'chained-result')

  await snapshot('chained-3-deep')

  return { root4 }
}
