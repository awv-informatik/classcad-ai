export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  // Create a single template
  const t1 = (await api.v1.assembly.partTemplate({ name: 'Only' })).result

  // All — returns array even with 1 item?
  const rAll = await api.v1.assembly.getPartTemplate()
  console.log('[08] all (1 template):', JSON.stringify(rAll.result), 'type:', typeof rAll.result, 'isArray:', Array.isArray(rAll.result))

  // By name — returns single ID, not array?
  const rName = await api.v1.assembly.getPartTemplate({ name: 'Only' })
  console.log('[08] byName:', JSON.stringify(rName.result), 'type:', typeof rName.result, 'isArray:', Array.isArray(rName.result))

  // Add another and re-check
  const t2 = (await api.v1.assembly.partTemplate({ name: 'Second' })).result
  const rAll2 = await api.v1.assembly.getPartTemplate()
  console.log('[08] all (2 templates):', JSON.stringify(rAll2.result), 'isArray:', Array.isArray(rAll2.result))

  filewrite({
    singleAll: { result: rAll.result, type: typeof rAll.result, isArray: Array.isArray(rAll.result) },
    byName: { result: rName.result, type: typeof rName.result, isArray: Array.isArray(rName.result) },
    twoAll: { result: rAll2.result, type: typeof rAll2.result, isArray: Array.isArray(rAll2.result) },
  }, 'return-type')

  return { asmId }
}
