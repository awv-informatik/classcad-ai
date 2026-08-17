export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  // Create part templates AND assembly templates
  const pt1 = (await api.v1.assembly.partTemplate({ name: 'PartA' })).result
  const pt2 = (await api.v1.assembly.partTemplate({ name: 'PartB' })).result
  const at1 = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result

  console.log('[10] parts:', pt1, pt2, 'assembly:', at1)

  // getPartTemplate should NOT return assembly templates
  const rParts = await api.v1.assembly.getPartTemplate()
  console.log('[10] getPartTemplate() all:', JSON.stringify(rParts.result))

  // Try to find assembly template by name through getPartTemplate
  const rCross = await api.v1.assembly.getPartTemplate({ name: 'SubAsm' })
  console.log('[10] getPartTemplate({name:"SubAsm"}):', rCross.result, 'maxLevel:', rCross.maxLevel)

  // Verify getAssemblyTemplate only returns assembly templates
  const rAsms = await api.v1.assembly.getAssemblyTemplate()
  console.log('[10] getAssemblyTemplate() all:', JSON.stringify(rAsms.result))

  // Try to find part through getAssemblyTemplate
  const rCross2 = await api.v1.assembly.getAssemblyTemplate({ name: 'PartA' })
  console.log('[10] getAssemblyTemplate({name:"PartA"}):', rCross2.result, 'maxLevel:', rCross2.maxLevel)

  filewrite({
    partList: rParts.result,
    asmList: rAsms.result,
    crossPartToAsm: { result: rCross.result, maxLevel: rCross.maxLevel, messages: rCross.messages },
    crossAsmToPart: { result: rCross2.result, maxLevel: rCross2.maxLevel, messages: rCross2.messages },
  }, 'cross-contamination')

  return { asmId }
}
