// Empty and omitted toRename
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'x', value: 5 }] })

  const r1 = await api.v1.part.renameExpression({ id: partId, toRename: [] })
  console.log('[07] empty array result:', r1.result, 'maxLevel:', r1.maxLevel)

  const r2 = await api.v1.part.renameExpression({ id: partId })
  console.log('[07] omitted result:', r2.result, 'maxLevel:', r2.maxLevel)

  return { partId }
}
