export default async function (api, { filewrite }) {
  // Test: does the ident param enable lookup via getAssemblyTemplate or similar?
  const asmId = (await api.v1.assembly.create({ name: 'IdentTest', ident: 'ROOT-001' })).result
  console.log('[11] asmId:', asmId)

  // Create a part template with ident
  const tplId = (await api.v1.assembly.partTemplate({ name: 'PartA' })).result
  console.log('[11] tplId:', tplId)

  // Return to assembly context
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Try getPartTemplate by name
  const found = (await api.v1.assembly.getPartTemplate({ name: 'PartA' })).result
  console.log('[11] getPartTemplate by name:', found)

  // Try getPartTemplate with no name (should return all)
  const all = (await api.v1.assembly.getPartTemplate({})).result
  console.log('[11] getPartTemplate all:', JSON.stringify(all))

  // Check if ident is stored somewhere - dump IdentMap
  const r = await api.v1.assembly.create // can't recalc without breaking...
  // Let's just dump the structure to see the IdentToIdMap contents
  const structure = (await api.v1.common.recalc({}))
  filewrite(structure.structure, 'ident-structure')

  return { asmId, tplId, found }
}
