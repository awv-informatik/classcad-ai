export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NonexType' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

  // Create only TOP and FRONT views
  await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT'] })

  // Request RIGHT (not created) alongside TOP (created)
  const r1 = await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP', 'RIGHT'] })
  console.log('[03] TOP+RIGHT result:', JSON.stringify(r1.result))
  console.log('[03] TOP+RIGHT maxLevel:', r1.maxLevel)
  console.log('[03] TOP+RIGHT messages:', JSON.stringify(r1.messages))

  // Request only non-existent types
  const r2 = await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['RIGHT', 'BACK'] })
  console.log('[03] RIGHT+BACK result:', JSON.stringify(r2.result))
  console.log('[03] RIGHT+BACK maxLevel:', r2.maxLevel)
  console.log('[03] RIGHT+BACK messages:', JSON.stringify(r2.messages))

  filewrite({
    mixedResult: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    allMissing: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
  }, 'nonexistent-type')

  return { partId }
}
