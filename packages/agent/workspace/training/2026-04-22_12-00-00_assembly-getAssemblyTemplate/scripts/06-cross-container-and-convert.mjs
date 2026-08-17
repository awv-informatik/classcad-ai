export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  // Create a part template and an assembly template with the same name
  const partTpl = (await api.v1.assembly.partTemplate({ name: 'Widget' })).result
  const asmTpl = (await api.v1.assembly.assemblyTemplate({ name: 'Widget' })).result
  console.log('[06] partTpl:', partTpl, 'asmTpl:', asmTpl)

  // getAssemblyTemplate should NOT find the part template
  const findWidget = await api.v1.assembly.getAssemblyTemplate({ name: 'Widget' })
  console.log('[06] findWidget (asm):', findWidget.result, '=== asmTpl?', findWidget.result === asmTpl)

  // getPartTemplate should NOT find the assembly template
  const findWidgetPart = await api.v1.assembly.getPartTemplate({ name: 'Widget' })
  console.log('[06] findWidget (part):', findWidgetPart.result, '=== partTpl?', findWidgetPart.result === partTpl)

  // List all assembly templates — should not include part templates
  const asmList = (await api.v1.assembly.getAssemblyTemplate()).result
  console.log('[06] asmList:', JSON.stringify(asmList))
  console.log('[06] asmList includes partTpl?', asmList.includes(partTpl))

  // convertToTemplate — convert root assembly to template
  const convR = await api.v1.assembly.convertToTemplate({ name: 'ConvertedAsm' })
  console.log('[06] convertToTemplate result:', convR.result, 'maxLevel:', convR.maxLevel)

  // Now list assembly templates — should include the converted one
  const asmListAfter = (await api.v1.assembly.getAssemblyTemplate()).result
  console.log('[06] asmListAfter:', JSON.stringify(asmListAfter))

  // Find the converted template by name
  const findConverted = await api.v1.assembly.getAssemblyTemplate({ name: 'ConvertedAsm' })
  console.log('[06] findConverted:', findConverted.result, 'maxLevel:', findConverted.maxLevel)

  filewrite({
    ids: { partTpl, asmTpl },
    findWidgetAsm: findWidget.result,
    findWidgetPart: findWidgetPart.result,
    asmList,
    asmListAfter,
    findConverted: { result: findConverted.result, maxLevel: findConverted.maxLevel },
  }, 'cross-container')

  return { asmId }
}
