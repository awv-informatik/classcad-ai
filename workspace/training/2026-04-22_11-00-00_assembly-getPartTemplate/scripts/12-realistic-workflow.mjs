export default async function (api, { filewrite, snapshot }) {
  // Realistic workflow: create assembly, add templates, find them by name, build, instance
  const asmId = (await api.v1.assembly.create({ name: 'Machine' })).result

  // Create several part templates
  await api.v1.assembly.partTemplate({ name: 'Bracket' })
  await api.v1.assembly.partTemplate({ name: 'Shaft' })
  await api.v1.assembly.partTemplate({ name: 'Housing' })

  // Use getPartTemplate to find them by name (the realistic use case)
  const bracketId = (await api.v1.assembly.getPartTemplate({ name: 'Bracket' })).result
  const shaftId = (await api.v1.assembly.getPartTemplate({ name: 'Shaft' })).result
  const housingId = (await api.v1.assembly.getPartTemplate({ name: 'Housing' })).result

  console.log('[12] found: Bracket=', bracketId, 'Shaft=', shaftId, 'Housing=', housingId)

  // Build geometry in each template
  await api.v1.part.box({ id: bracketId, name: 'BracketBox', length: 80, width: 40, height: 10 })
  await api.v1.part.cylinder({ id: shaftId, name: 'ShaftCyl', radius: 5, height: 60 })
  await api.v1.part.box({ id: housingId, name: 'HousingBox', length: 100, width: 100, height: 50 })

  // Switch to assembly context and create instances
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  await api.v1.assembly.instance({ productId: bracketId, ownerId: asmId, name: 'Bracket_1' })
  await api.v1.assembly.instance({
    productId: shaftId, ownerId: asmId, name: 'Shaft_1',
    transformation: [[0, 0, 30], [1, 0, 0], [0, 1, 0]],
  })
  await api.v1.assembly.instance({
    productId: housingId, ownerId: asmId, name: 'Housing_1',
    transformation: [[-10, -30, 0], [1, 0, 0], [0, 1, 0]],
  })

  await snapshot('assembled')

  // Verify all templates are still accessible after instancing
  const allTemplates = (await api.v1.assembly.getPartTemplate()).result
  console.log('[12] all templates after instancing:', JSON.stringify(allTemplates))
  console.log('[12] count:', allTemplates.length)

  filewrite({
    bracketId,
    shaftId,
    housingId,
    allAfterInstance: allTemplates,
  }, 'workflow')

  return { asmId }
}
