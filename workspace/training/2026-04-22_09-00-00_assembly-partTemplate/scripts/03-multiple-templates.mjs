export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  console.log('[03] asmId:', asmId)

  // No params — default name
  const t1 = await api.v1.assembly.partTemplate()
  console.log('[03] t1 (no params) id:', t1.result, 'maxLevel:', t1.maxLevel)

  // Second no-params call — does default name auto-increment?
  const t2 = await api.v1.assembly.partTemplate()
  console.log('[03] t2 (no params) id:', t2.result, 'maxLevel:', t2.maxLevel)

  // Third with empty object
  const t3 = await api.v1.assembly.partTemplate({})
  console.log('[03] t3 ({}) id:', t3.result, 'maxLevel:', t3.maxLevel)

  // Named templates
  const t4 = await api.v1.assembly.partTemplate({ name: 'Bolt' })
  console.log('[03] t4 (Bolt) id:', t4.result, 'maxLevel:', t4.maxLevel)

  const t5 = await api.v1.assembly.partTemplate({ name: 'Nut' })
  console.log('[03] t5 (Nut) id:', t5.result, 'maxLevel:', t5.maxLevel)

  // Duplicate name — what happens?
  const t6 = await api.v1.assembly.partTemplate({ name: 'Bolt' })
  console.log('[03] t6 (dup Bolt) id:', t6.result, 'maxLevel:', t6.maxLevel)
  console.log('[03] t6 messages:', JSON.stringify(t6.messages))

  // Check PartContainer children
  const partContainerNode = t6.structure?.tree?.['8']
  console.log('[03] PartContainer children:', JSON.stringify(partContainerNode?.children))

  // Check names of all templates
  for (const childId of partContainerNode?.children || []) {
    const node = t6.structure?.tree?.[String(childId)]
    console.log(`[03] template ${childId}: name="${node?.name}" class="${node?.class}"`)
  }

  filewrite(partContainerNode, 'partContainer-with-6-templates')

  return { asmId }
}
