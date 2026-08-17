export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Test' })).result

  // Create templates in non-alphabetical order
  const tplZ = (await api.v1.assembly.partTemplate({ name: 'Zeta' })).result
  const tplA = (await api.v1.assembly.partTemplate({ name: 'Alpha' })).result
  const tplM = (await api.v1.assembly.partTemplate({ name: 'Mu' })).result
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Beta' })).result

  const rAll = await api.v1.assembly.getPartTemplate()

  console.log('[08] creation order IDs: Zeta=', tplZ, 'Alpha=', tplA, 'Mu=', tplM, 'Beta=', tplB)
  console.log('[08] getPartTemplate():', JSON.stringify(rAll.result))

  // Check multiple times for stability
  const r2 = await api.v1.assembly.getPartTemplate()
  console.log('[08] second call:', JSON.stringify(r2.result))
  console.log('[08] stable:', JSON.stringify(rAll.result) === JSON.stringify(r2.result))

  filewrite({
    creationOrder: { Zeta: tplZ, Alpha: tplA, Mu: tplM, Beta: tplB },
    returnedOrder: rAll.result,
    secondCall: r2.result,
    matchesCreationOrder: JSON.stringify(rAll.result) === JSON.stringify([tplZ, tplA, tplM, tplB]),
  }, 'ordering')

  return { asmId }
}
