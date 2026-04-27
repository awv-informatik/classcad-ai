export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  // Create templates with same base name — auto-deduplication
  const t1 = (await api.v1.assembly.partTemplate({ name: 'Bolt' })).result
  const t2 = (await api.v1.assembly.partTemplate({ name: 'Bolt' })).result
  const t3 = (await api.v1.assembly.partTemplate({ name: 'Bolt' })).result

  console.log('[04] created: t1=', t1, 't2=', t2, 't3=', t3)

  // Lookup original name
  const rBolt = await api.v1.assembly.getPartTemplate({ name: 'Bolt' })
  console.log('[04] Bolt:', rBolt.result, 'maxLevel:', rBolt.maxLevel)

  // Lookup deduplicated names
  const rBolt0 = await api.v1.assembly.getPartTemplate({ name: 'Bolt0' })
  console.log('[04] Bolt0:', rBolt0.result, 'maxLevel:', rBolt0.maxLevel)

  const rBolt1 = await api.v1.assembly.getPartTemplate({ name: 'Bolt1' })
  console.log('[04] Bolt1:', rBolt1.result, 'maxLevel:', rBolt1.maxLevel)

  // All templates
  const rAll = await api.v1.assembly.getPartTemplate()
  console.log('[04] all:', JSON.stringify(rAll.result))

  filewrite({
    bolt: { id: t1, lookup: rBolt.result },
    bolt0: { id: t2, lookup: rBolt0.result },
    bolt1: { id: t3, lookup: rBolt1.result },
    allIds: rAll.result,
  }, 'duplicate-names')

  return { asmId }
}
