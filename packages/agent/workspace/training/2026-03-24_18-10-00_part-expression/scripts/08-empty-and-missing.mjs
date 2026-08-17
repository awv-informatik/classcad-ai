// Edge cases: empty toCreate, missing params
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Empty toCreate array
  const r1 = await api.v1.part.expression({
    id: partId,
    toCreate: [],
  })
  console.log('[08] empty toCreate result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[08] empty toCreate messages:', JSON.stringify(r1.messages))

  // No toCreate at all
  const r2 = await api.v1.part.expression({
    id: partId,
  })
  console.log('[08] no toCreate result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[08] no toCreate messages:', JSON.stringify(r2.messages))

  // Missing name in toCreate item
  const r3 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ value: 42 }],
  })
  console.log('[08] no name result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[08] no name messages:', JSON.stringify(r3.messages))

  // Missing value in toCreate item
  const r4 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'no_value' }],
  })
  console.log('[08] no value result:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[08] no value messages:', JSON.stringify(r4.messages))

  return { partId }
}
