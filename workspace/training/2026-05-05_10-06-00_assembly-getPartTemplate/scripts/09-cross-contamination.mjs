export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Test' })).result

  // Create part templates
  const pt1 = (await api.v1.assembly.partTemplate({ name: 'PartA' })).result
  const pt2 = (await api.v1.assembly.partTemplate({ name: 'PartB' })).result

  // Create an assembly template
  const at1 = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // List each type
  const rParts = await api.v1.assembly.getPartTemplate()
  const rAsms = await api.v1.assembly.getAssemblyTemplate()

  // Cross-lookup: find assembly template by name using getPartTemplate
  const rCross1 = await api.v1.assembly.getPartTemplate({ name: 'SubAsm' })
  // And vice versa
  const rCross2 = await api.v1.assembly.getAssemblyTemplate({ name: 'PartA' })

  console.log('[09] part IDs:', pt1, pt2, 'assembly ID:', at1)
  console.log('[09] getPartTemplate():', JSON.stringify(rParts.result))
  console.log('[09] getAssemblyTemplate():', JSON.stringify(rAsms.result))
  console.log('[09] part lookup SubAsm:', rCross1.result, 'maxLevel:', rCross1.maxLevel)
  console.log('[09] asm lookup PartA:', rCross2.result, 'maxLevel:', rCross2.maxLevel)

  filewrite({
    partTemplates: rParts.result,
    asmTemplates: rAsms.result,
    crossLookup1: { result: rCross1.result, maxLevel: rCross1.maxLevel },
    crossLookup2: { result: rCross2.result, maxLevel: rCross2.maxLevel },
  }, 'cross-contamination')

  return { asmId }
}
