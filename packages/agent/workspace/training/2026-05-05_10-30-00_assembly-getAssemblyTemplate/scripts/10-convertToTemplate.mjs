export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  // Create a regular assembly template
  const regTpl = (await api.v1.assembly.assemblyTemplate({ name: 'Regular' })).result
  console.log('[10] regular template:', regTpl, 'asmId:', asmId)

  // List before convert
  const beforeList = await api.v1.assembly.getAssemblyTemplate()
  console.log('[10] before convert:', beforeList.result)

  // Convert the root assembly to a template
  const convRes = await api.v1.assembly.convertToTemplate({ name: 'ConvertedRoot' })
  console.log('[10] convertToTemplate result:', convRes.result, 'maxLevel:', convRes.maxLevel)

  // List after convert — should now include the converted root
  const afterList = await api.v1.assembly.getAssemblyTemplate()
  console.log('[10] after convert:', afterList.result)

  // Find by name
  const rConverted = await api.v1.assembly.getAssemblyTemplate({ name: 'ConvertedRoot' })
  console.log('[10] find converted:', rConverted.result, 'maxLevel:', rConverted.maxLevel)

  // Is the converted template the original asmId?
  console.log('[10] converted id === asmId?', rConverted.result === asmId)

  filewrite({
    asmId,
    regularTemplateId: regTpl,
    convertResult: { result: convRes.result, maxLevel: convRes.maxLevel },
    beforeConvert: beforeList.result,
    afterConvert: afterList.result,
    findConverted: { result: rConverted.result, maxLevel: rConverted.maxLevel },
    convertedIsOriginalRoot: rConverted.result === asmId,
  }, 'convert-results')

  return {}
}
