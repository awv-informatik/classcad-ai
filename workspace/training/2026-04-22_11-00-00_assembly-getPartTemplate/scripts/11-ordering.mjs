export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  // Create templates in a known order
  const ids = []
  for (const name of ['Zeta', 'Alpha', 'Mu', 'Beta']) {
    ids.push((await api.v1.assembly.partTemplate({ name })).result)
  }
  console.log('[11] created in order:', ids)

  // List all — check if order is creation order or alphabetical
  const rAll = await api.v1.assembly.getPartTemplate()
  console.log('[11] getPartTemplate() all:', JSON.stringify(rAll.result))

  // Check if order matches creation order
  const creationOrder = ids.join(',') === rAll.result.join(',')
  console.log('[11] matches creation order:', creationOrder)

  // Call twice — is result stable?
  const rAll2 = await api.v1.assembly.getPartTemplate()
  const stable = rAll.result.join(',') === rAll2.result.join(',')
  console.log('[11] result stable across calls:', stable)

  filewrite({
    creationOrder: ids,
    returnOrder: rAll.result,
    matchesCreation: creationOrder,
    stableResult: stable,
  }, 'ordering')

  return { asmId }
}
