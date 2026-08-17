export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GetTest' })).result

  const t1 = (await api.v1.assembly.assemblyTemplate({ name: 'Alpha' })).result
  const t2 = (await api.v1.assembly.assemblyTemplate({ name: 'Beta' })).result
  const t3 = (await api.v1.assembly.assemblyTemplate({ name: 'Gamma' })).result

  // Get by name
  const rAlpha = await api.v1.assembly.getAssemblyTemplate({ name: 'Alpha' })
  console.log('[04] getAssemblyTemplate(Alpha):', rAlpha.result, 'maxLevel:', rAlpha.maxLevel)

  const rBeta = await api.v1.assembly.getAssemblyTemplate({ name: 'Beta' })
  console.log('[04] getAssemblyTemplate(Beta):', rBeta.result)

  // Get all (no params)
  const rAll = await api.v1.assembly.getAssemblyTemplate()
  console.log('[04] getAssemblyTemplate() all:', JSON.stringify(rAll.result))

  // Get non-existent name
  const rNone = await api.v1.assembly.getAssemblyTemplate({ name: 'Nonexistent' })
  console.log('[04] getAssemblyTemplate(Nonexistent):', rNone.result, 'maxLevel:', rNone.maxLevel)
  filewrite({ result: rNone.result, messages: rNone.messages, maxLevel: rNone.maxLevel }, 'nonexistent-response')

  // Get with empty name
  const rEmpty = await api.v1.assembly.getAssemblyTemplate({ name: '' })
  console.log('[04] getAssemblyTemplate(""):', JSON.stringify(rEmpty.result), 'maxLevel:', rEmpty.maxLevel)

  return { t1, t2, t3, alpha: rAlpha.result, beta: rBeta.result, all: rAll.result }
}
