// Partial batch: mix of valid and invalid renames
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'a', value: 1 },
      { name: 'b', value: 2 },
    ],
  })

  const rr = await api.v1.part.renameExpression({
    id: partId,
    toRename: [
      { name: 'a', newName: 'alpha' },
      { name: 'nope', newName: 'stillnope' },
      { name: 'b', newName: 'beta' },
    ],
  })
  console.log('[09] partial batch result:', rr.result, 'maxLevel:', rr.maxLevel)
  if (rr.messages?.length) {
    for (const m of rr.messages) console.log('[09] msg:', m.level, m.code, m.message)
  }

  // Check if valid renames applied
  const ra = await api.v1.part.getExpression({ id: partId, name: 'a' })
  const ralpha = await api.v1.part.getExpression({ id: partId, name: 'alpha' })
  const rb = await api.v1.part.getExpression({ id: partId, name: 'b' })
  const rbeta = await api.v1.part.getExpression({ id: partId, name: 'beta' })
  console.log('[09] a:', ra.result.value, 'alpha:', ralpha.result.value)
  console.log('[09] b:', rb.result.value, 'beta:', rbeta.result.value)

  return { partId }
}
