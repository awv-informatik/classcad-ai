export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Test' })).result

  // Create 3 templates with the same requested name
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Bolt' })).result
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Bolt' })).result
  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Bolt' })).result

  // Check what names they actually got
  const rAll = await api.v1.assembly.getPartTemplate()

  // Try finding by original name and deduplicated names
  const rBolt = await api.v1.assembly.getPartTemplate({ name: 'Bolt' })
  const rBolt0 = await api.v1.assembly.getPartTemplate({ name: 'Bolt0' })
  const rBolt1 = await api.v1.assembly.getPartTemplate({ name: 'Bolt1' })

  console.log('[05] created IDs:', tpl1, tpl2, tpl3)
  console.log('[05] all:', JSON.stringify(rAll.result))
  console.log('[05] lookup Bolt:', rBolt.result, 'maxLevel:', rBolt.maxLevel)
  console.log('[05] lookup Bolt0:', rBolt0.result, 'maxLevel:', rBolt0.maxLevel)
  console.log('[05] lookup Bolt1:', rBolt1.result, 'maxLevel:', rBolt1.maxLevel)

  filewrite({
    created: { tpl1, tpl2, tpl3 },
    listAll: rAll.result,
    bolt: { result: rBolt.result, maxLevel: rBolt.maxLevel },
    bolt0: { result: rBolt0.result, maxLevel: rBolt0.maxLevel },
    bolt1: { result: rBolt1.result, maxLevel: rBolt1.maxLevel },
  }, 'duplicate-results')

  return { asmId }
}
