// Multiple renames in one call
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'a', value: 1 },
      { name: 'b', value: 2 },
      { name: 'c', value: 3 },
    ],
  })

  const rr = await api.v1.part.renameExpression({
    id: partId,
    toRename: [
      { name: 'a', newName: 'alpha' },
      { name: 'b', newName: 'beta' },
      { name: 'c', newName: 'gamma' },
    ],
  })
  console.log('[03] batch rename result:', rr.result, 'maxLevel:', rr.maxLevel)

  const ra = await api.v1.part.getExpression({ id: partId, name: 'alpha' })
  const rb = await api.v1.part.getExpression({ id: partId, name: 'beta' })
  const rc = await api.v1.part.getExpression({ id: partId, name: 'gamma' })
  console.log('[03] alpha:', ra.result.value, 'beta:', rb.result.value, 'gamma:', rc.result.value)

  return { partId }
}
