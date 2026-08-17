export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  // Create a PART template and an ASSEMBLY template with the SAME name
  const partTpl = (await api.v1.assembly.partTemplate({ name: 'Widget' })).result
  const asmTpl = (await api.v1.assembly.assemblyTemplate({ name: 'Widget' })).result
  console.log('[09] partTpl:', partTpl, 'asmTpl:', asmTpl)

  // getAssemblyTemplate should NOT find the part template
  const rAsmList = await api.v1.assembly.getAssemblyTemplate()
  const rAsmName = await api.v1.assembly.getAssemblyTemplate({ name: 'Widget' })

  // getPartTemplate should NOT find the assembly template
  const rPartList = await api.v1.assembly.getPartTemplate()
  const rPartName = await api.v1.assembly.getPartTemplate({ name: 'Widget' })

  console.log('[09] asm list:', rAsmList.result, '(expect only', asmTpl, ')')
  console.log('[09] asm name Widget:', rAsmName.result, '(expect', asmTpl, ')')
  console.log('[09] part list:', rPartList.result, '(expect only', partTpl, ')')
  console.log('[09] part name Widget:', rPartName.result, '(expect', partTpl, ')')

  filewrite({
    ids: { partTpl, asmTpl },
    assemblyQuery: { list: rAsmList.result, byName: rAsmName.result },
    partQuery: { list: rPartList.result, byName: rPartName.result },
    noContamination: rAsmName.result === asmTpl && rPartName.result === partTpl,
    asmListExcludesPart: !rAsmList.result.includes(partTpl),
    partListExcludesAsm: !rPartList.result.includes(asmTpl),
  }, 'cross-contamination')

  return { asmId }
}
