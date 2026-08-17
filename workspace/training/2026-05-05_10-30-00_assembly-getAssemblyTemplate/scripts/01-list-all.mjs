export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result
  console.log('[01] asmId:', asmId)

  const t1 = (await api.v1.assembly.assemblyTemplate({ name: 'Alpha' })).result
  const t2 = (await api.v1.assembly.assemblyTemplate({ name: 'Beta' })).result
  const t3 = (await api.v1.assembly.assemblyTemplate({ name: 'Gamma' })).result
  console.log('[01] templates created:', t1, t2, t3)

  // Three ways to list all
  const r1 = await api.v1.assembly.getAssemblyTemplate()
  const r2 = await api.v1.assembly.getAssemblyTemplate({})
  const r3 = await api.v1.assembly.getAssemblyTemplate({ name: undefined })

  filewrite({
    noArgs: { result: r1.result, maxLevel: r1.maxLevel, isArray: Array.isArray(r1.result) },
    emptyObj: { result: r2.result, maxLevel: r2.maxLevel, isArray: Array.isArray(r2.result) },
    undefinedName: { result: r3.result, maxLevel: r3.maxLevel, isArray: Array.isArray(r3.result) },
    allIdentical: JSON.stringify(r1.result) === JSON.stringify(r2.result) && JSON.stringify(r2.result) === JSON.stringify(r3.result),
  }, 'list-all-results')

  console.log('[01] no-args:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[01] empty-obj:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[01] undefined-name:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[01] all identical:', JSON.stringify(r1.result) === JSON.stringify(r2.result))

  return { asmId, t1, t2, t3 }
}
